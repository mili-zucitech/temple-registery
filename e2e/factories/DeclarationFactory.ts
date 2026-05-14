import { ApiClient } from '../lib/api-client';
import { TestContext } from '../lib/test-context';

export interface Declaration {
  id: number;
  templeId: number;
  fiscalYear: string;
  status: string;
}

export interface Asset {
  id: number;
  declarationId: number;
  assetType: string;
  estimatedValue: number;
}

export class DeclarationFactory {
  static async create(
    api: ApiClient,
    context: TestContext,
    options: { templeId: number; fiscalYear?: string },
    overrides?: Partial<any>
  ): Promise<Declaration> {
    // Generate a unique fiscal year using the test run seed to avoid
    // conflicts with pre-existing declarations for the shared test temple.
    const uniqueFiscalYear = options.fiscalYear || (() => {
      const seed = context.generateId();
      const timeSalt = Math.floor(Date.now() / 1000) % 7000;
      const start = 2100 + ((seed + timeSalt) % 6000);
      return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
    })();
    const declaration = {
      financialYear: uniqueFiscalYear,
      dueDate: '2026-03-31',
      annualIncome: 0,
      annualExpenditure: 0,
      test_run_id: context.testRunId,
      ...overrides
    };

    const created = await api.post<Declaration>(`/temples/${options.templeId}/declarations`, declaration);
    context.registerEntityForCleanup('DECLARATION', created.id);
    
    return created;
  }

  static async createWithAssets(
    api: ApiClient,
    context: TestContext,
    options: { templeId: number; assetCount: number }
  ): Promise<{ declaration: Declaration; assets: Asset[] }> {
    const declaration = await this.create(api, context, { templeId: options.templeId });

    const assets: Asset[] = [];
    for (let i = 0; i < options.assetCount; i++) {
      const assetId = context.generateId();
      const asset = await api.post<Asset>(`/declarations/${declaration.id}/assets`, {
        assetType: 'AGRI_LAND',
        surveyNumber: `SN-${assetId}`,
        area: 10.5,
        location: 'Test Location',
        estimatedValue: 1000000,
        test_run_id: context.testRunId
      });
      assets.push(asset);
    }

    return { declaration, assets };
  }

  static async createAndSubmit(
    api: ApiClient,
    context: TestContext,
    options: { templeId: number }
  ): Promise<Declaration> {
    const declaration = await this.create(api, context, options);
    
    // Submit the declaration
    await api.post(`/governance/declarations/${declaration.id}/submit`, {});
    
    // Fetch updated declaration
    const updated = await api.get<Declaration>(`/declarations/${declaration.id}`);
    return updated;
  }
}
