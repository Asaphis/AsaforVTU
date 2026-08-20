const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

const APPLY = process.argv.includes('--apply');
const PROFIT_MARGIN = Number(process.env.SEED_PROFIT_MARGIN || '0.05');
const ROUNDING_INCREMENT = Number(process.env.SEED_PRICE_ROUNDING || '10');
const cataloguePath = path.join(__dirname, '../data/glo_requested_plans.json');

if (!Number.isFinite(PROFIT_MARGIN) || PROFIT_MARGIN < 0) {
  throw new Error('SEED_PROFIT_MARGIN must be a non-negative decimal, for example 0.05.');
}
if (!Number.isFinite(ROUNDING_INCREMENT) || ROUNDING_INCREMENT <= 0) {
  throw new Error('SEED_PRICE_ROUNDING must be a positive number, for example 10.');
}

function customerPriceFor(providerCost) {
  return Math.ceil((Number(providerCost) * (1 + PROFIT_MARGIN)) / ROUNDING_INCREMENT) * ROUNDING_INCREMENT;
}

function validateCatalogue(catalogue) {
  if (!Array.isArray(catalogue) || catalogue.length !== 25) {
    throw new Error(`Expected exactly 25 supplied Glo plans, found ${Array.isArray(catalogue) ? catalogue.length : 0}.`);
  }
  const ids = new Set();
  for (const plan of catalogue) {
    if (!plan.providerPlanId || !plan.name || !plan.validity || !plan.category || !(Number(plan.providerCost) > 0)) {
      throw new Error(`Invalid requested plan: ${JSON.stringify(plan)}`);
    }
    if (ids.has(String(plan.providerPlanId))) throw new Error(`Duplicate provider plan ID: ${plan.providerPlanId}`);
    ids.add(String(plan.providerPlanId));
  }
}

async function findDataServiceId(db) {
  const result = await db.query("SELECT id FROM services WHERE slug = 'data' LIMIT 1");
  if (!result.rows[0]) throw new Error("The 'data' service does not exist. Run database migrations before importing plans.");
  return result.rows[0].id;
}

async function main() {
  const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
  validateCatalogue(catalogue);

  const preview = catalogue.map((plan) => {
    const priceUser = customerPriceFor(plan.providerCost);
    const profit = Number((priceUser - Number(plan.providerCost)).toFixed(2));
    const margin = Number(((profit / priceUser) * 100).toFixed(3));
    return {
      providerPlanId: plan.providerPlanId,
      name: plan.name,
      providerCost: Number(plan.providerCost),
      customerPrice: priceUser,
      profit,
      effectiveMarginPercent: margin,
    };
  });

  if (!APPLY) {
    console.log(JSON.stringify({
      mode: 'preview',
      total: preview.length,
      configuredMarkupPercent: PROFIT_MARGIN * 100,
      roundingIncrement: ROUNDING_INCREMENT,
      plans: preview,
      nextStep: 'Review the customerPrice values, then rerun with --apply to upsert these same 25 Glo plans.'
    }, null, 2));
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const serviceId = await findDataServiceId(client);
    let inserted = 0;
    let updated = 0;

    for (const plan of catalogue) {
      const customerPrice = customerPriceFor(plan.providerCost);
      const profit = Number((customerPrice - Number(plan.providerCost)).toFixed(2));
      const margin = Number(((profit / customerPrice) * 100).toFixed(3));
      const metadata = {
        provider_plan_id: String(plan.providerPlanId),
        source_validity: plan.validity,
        imported_by: 'seedGloRequestedPlans',
        configured_markup_percent: PROFIT_MARGIN * 100,
        price_rounding_increment: ROUNDING_INCREMENT,
      };

      const existing = await client.query(
        `SELECT id FROM service_plans
         WHERE service_id = $1
           AND network_key = 'glo'
           AND type = 'data'
           AND (provider_plan_id = $2 OR metadata->>'provider_plan_id' = $2)
         LIMIT 1`,
        [serviceId, String(plan.providerPlanId)]
      );

      if (existing.rows[0]) {
        await client.query(
          `UPDATE service_plans
           SET network = 'Glo', name = $1, sub_type = $2, price_user = $3, price_api = $4,
               provider_cost = $4, profit_amount = $5, profit_margin_percent = $6,
               pricing_source = 'requested_glo_catalogue', provider_plan_id = $7,
               metadata = $8, is_active = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE id = $9`,
          [plan.name, plan.category, customerPrice, plan.providerCost, profit, margin,
            String(plan.providerPlanId), JSON.stringify(metadata), existing.rows[0].id]
        );
        updated += 1;
      } else {
        await client.query(
          `INSERT INTO service_plans
           (service_id, network, network_key, name, type, sub_type, price_user, price_api,
            provider_cost, profit_amount, profit_margin_percent, pricing_source, provider_plan_id,
            is_active, metadata)
           VALUES ($1, 'Glo', 'glo', $2, 'data', $3, $4, $5, $5, $6, $7,
                   'requested_glo_catalogue', $8, TRUE, $9)`,
          [serviceId, plan.name, plan.category, customerPrice, plan.providerCost, profit, margin,
            String(plan.providerPlanId), JSON.stringify(metadata)]
        );
        inserted += 1;
      }
    }

    await client.query('COMMIT');
    console.log(JSON.stringify({
      mode: 'apply',
      total: catalogue.length,
      inserted,
      updated,
      configuredMarkupPercent: PROFIT_MARGIN * 100,
      roundingIncrement: ROUNDING_INCREMENT,
      plans: preview,
    }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(`[Seed Glo requested plans] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
