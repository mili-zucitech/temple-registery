import { ApiClient } from '../lib/api-client';
import { TestContext } from '../lib/test-context';

export interface Temple {
  id: number;
  name: string;
  registrationNumber: string;
  grade: string;
  districtId: number;
}

export class TempleFactory {
  static async create(
    api: ApiClient,
    context: TestContext,
    overrides?: Partial<any>
  ): Promise<Temple> {
    const id = context.generateId();
    
    const temple = {
      name: `Test Temple ${id}`,
      registrationNumber: `TR-TEST-${id}`,
      grade: 'A',
      primaryDeity: 'Lord Shiva',
      tradition: 'SHAIVITE',
      yearEstablished: 1800,
      doorNumber: `${id}`,
      street: 'Temple Street',
      villageTown: 'Test Village',
      districtId: 1,
      pinCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      contactName: 'Test Contact',
      contactDesignation: 'Trustee',
      contactMobile: '9876543210',
      contactEmail: `contact${id}@test.com`,
      test_run_id: context.testRunId,
      ...overrides
    };

    const created = await api.post<Temple>('/temples', temple);
    context.registerEntityForCleanup('TEMPLE', created.id);
    
    return created;
  }
}
