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
    // PAN must be exactly 10 chars: 5 alpha + 4 digits + 1 alpha (e.g. ABCDE1234F)
    const pan4 = String((id % 9000) + 1000); // always 4 digits: 1000-9999
    
    const trust = {
      trustName: `Test Trust ${id}`,
      registrationNumber: `TRN-TEST-${id}`,
      dateOfRegistration: '2020-01-01',
      registeringAuthority: 'Test Authority',
      trustType: 'PUBLIC',
      panNumber: `ABCDE${pan4}F`,
      bankAccountNumber: String(100000 + (id % 900000)),
      bankName: 'Test Bank',
      bankBranch: 'Test Branch',
      annualIncome: 1000000,
      test_run_id: context.testRunId,
      ...overrides
    };

    let created: Trust;
    try {
      created = await api.post<Trust>(`/temples/${options.templeId}/trusts`, trust);
      context.registerEntityForCleanup('TRUST', created.id);
    } catch (err: any) {
      // If a trust already exists for this temple, fetch and return it
      if (err.message && err.message.includes('409')) {
        const existing = await api.get<Trust[]>(`/temples/${options.templeId}/trusts`);
        if (!existing || existing.length === 0) {
          throw err;
        }
        created = existing[0];
      } else {
        throw err;
      }
    }
    
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
