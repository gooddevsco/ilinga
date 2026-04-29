/* eslint-disable no-console */
import { eq } from 'drizzle-orm';
import { closeDb, getDb } from '../client.js';
import * as schema from '../schema/index.js';

const SLUG = 'northwind-cargo-demo';

export const seedDemoTenant = async (): Promise<{ tenantId: string }> => {
  const db = getDb();

  const existing = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, SLUG))
    .limit(1);
  if (existing[0]) return { tenantId: existing[0].id };

  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: SLUG,
      displayName: 'Northwind Cargo (demo)',
      region: 'eu',
      industry: 'logistics',
      countryCode: 'DE',
      isDemo: true,
    })
    .returning({ id: schema.tenants.id });
  if (!tenant) throw new Error('failed to insert demo tenant');

  const [demoUser] = await db
    .insert(schema.users)
    .values({
      email: 'demo+northwind@ilinga.local',
      emailNormalized: 'demo+northwind@ilinga.local',
      displayName: 'Demo founder',
    })
    .onConflictDoNothing({ target: schema.users.emailNormalized })
    .returning({ id: schema.users.id });

  if (demoUser) {
    await db.insert(schema.tenantMembers).values({
      tenantId: tenant.id,
      userId: demoUser.id,
      role: 'owner',
    });
  }

  const [venture] = await db
    .insert(schema.ventures)
    .values({
      tenantId: tenant.id,
      name: 'Northwind Cargo',
      industry: 'logistics',
      geos: ['DE', 'FR', 'NL'],
      brief: {
        thesis:
          'Mid-mile freight visibility for European 3PLs. Pain: shippers email PDFs of bills of lading and call to chase status; carriers update by SMS.',
        wedge: 'EDI normaliser + carrier-portal scraper + a single tracking dashboard.',
      },
      createdBy: demoUser?.id ?? tenant.id,
    })
    .returning({ id: schema.ventures.id });
  if (!venture) throw new Error('failed to insert demo venture');

  await db.insert(schema.ventureCycles).values({
    tenantId: tenant.id,
    ventureId: venture.id,
    seq: 1,
    status: 'open',
    createdBy: demoUser?.id ?? tenant.id,
  });

  console.log(`Seeded demo tenant ${tenant.id} (${SLUG})`);
  return { tenantId: tenant.id };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoTenant()
    .then(() => closeDb())
    .catch(async (err) => {
      console.error(err);
      await closeDb();
      process.exit(1);
    });
}
