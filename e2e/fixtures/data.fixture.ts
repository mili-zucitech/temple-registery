import { test as base } from './auth.fixture';
import { TempleFactory } from '../factories/TempleFactory';
import { TrustFactory } from '../factories/TrustFactory';
import { DeclarationFactory } from '../factories/DeclarationFactory';

type Temple = Awaited<ReturnType<typeof TempleFactory.create>>;
type Trust = Awaited<ReturnType<typeof TrustFactory.create>>;
type Declaration = Awaited<ReturnType<typeof DeclarationFactory.create>>;

type DataFixtures = {
  temple: Temple;
  trust: Trust;
  declaration: Declaration;
};

export const test = base.extend<DataFixtures>({
  temple: async ({ api, testContext, db }, use) => {
    let temple: Temple;

    try {
      temple = await TempleFactory.create(api, testContext);
    } catch {
      const existingTemple = await db.getOne<Temple>(`
        SELECT t.id,
               t.name,
               t.registration_number AS registrationNumber,
               t.grade,
               t.district_id AS districtId
        FROM temples t
        JOIN users u ON u.temple_id = t.id
        WHERE u.username = 'ta_chamundi'
        LIMIT 1
      `);

      if (!existingTemple) {
        throw new Error('Temple fixture setup failed: create temple failed and no TA-linked temple found.');
      }

      temple = existingTemple;
    }

    await use(temple);
  },

  trust: async ({ api, testContext, temple }, use) => {
    const trust = await TrustFactory.create(api, testContext, { templeId: temple.id });
    await use(trust);
  },

  declaration: async ({ api, testContext, temple }, use) => {
    const declaration = await DeclarationFactory.create(api, testContext, { templeId: temple.id });
    await use(declaration);
  }
});

export { expect } from '@playwright/test';
