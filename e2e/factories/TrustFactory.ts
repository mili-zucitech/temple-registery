import { ApiClient } from '../lib/api-client';
import { TestContext } from '../lib/test-context';

export interface Trust {
  id: number;
  templeId: number;
  trustName: string;
  trustRegistrationNumber: string;
  panNumber: string;
}

export interface BoardMember {
  id: number;
  trustId: number;
  fullName: string;
  designation: string;
}

export class TrustFactory {
  static async create(
    api: ApiClient,
    context: TestContext,
    options: { templeId: number },
    overrides?: Partial<any>
  ): Promise<Trust> {
    const id = context.generateId();
    
    const trust = {
      templeId: options.templeId,
      trustName: `Test Trust ${id}`,
      trustRegistrationNumber: `TRN-TEST-${id}`,
      dateOfRegistration: '2020-01-01',
      registeringAuthority: 'Test Authority',
      trustType: 'PUBLIC',
      panNumber: `ABCDE${id.toString().padStart(4, '0')}F`,
      bankAccountNumber: `ACC${id}`,
      bankName: 'Test Bank',
      bankBranch: 'Test Branch',
      annualIncome: 1000000,
      test_run_id: context.testRunId,
      ...overrides
    };

    const created = await api.post<Trust>('/trusts', trust);
    context.registerEntityForCleanup('TRUST', created.id);
    
    return created;
  }

  static async createWithBoardMembers(
    api: ApiClient,
    context: TestContext,
    options: { templeId: number; memberCount: number }
  ): Promise<{ trust: Trust; members: BoardMember[] }> {
    const trust = await this.create(api, context, { templeId: options.templeId });

    const members: BoardMember[] = [];
    for (let i = 0; i < options.memberCount; i++) {
      const memberId = context.generateId();
      const member = await api.post<BoardMember>(`/trusts/${trust.id}/board-members`, {
        fullName: `Board Member ${memberId}`,
        aadhaarNumber: `${memberId.toString().padStart(12, '0')}`,
        designation: 'TRUSTEE',
        appointmentDate: '2020-01-01',
        tenureEndDate: '2025-01-01',
        contactNumber: '9876543210',
        address: 'Test Address',
        test_run_id: context.testRunId
      });
      members.push(member);
      // board_members are deleted automatically when the trust is cleaned up
    }

    return { trust, members };
  }
}
