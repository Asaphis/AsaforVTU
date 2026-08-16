const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');
const providerService = require('../src/services/providerService');

const APPLY = process.argv.includes('--apply');
const ESTIMATE = process.argv.find((arg) => arg.startsWith('--estimate-provider-cost='));
const ESTIMATE_RATE = ESTIMATE ? Number(ESTIMATE.split('=')[1]) : null;
const cataloguePath = path.join(__dirname, '../data/mtn_catalogue.json');

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/₦/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function numberFrom(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstValue(item, keys) {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];
  }
  return null;
}

function providerId(item) {
  return firstValue(item, ['variation_id', 'variationId', 'plan_id', 'planId', 'provider_plan_id', 'id', 'code', 'variation_code']);
}

function providerLabel(item) {
  return firstValue(item, ['name', 'plan_name', 'variation_name', 'variation', 'title', 'description', 'plan']) || '';
}

function providerCost(item) {
  return numberFrom(firstValue(item, ['provider_cost', 'cost', 'price_api', 'price', 'amount', 'selling_price', 'plan_amount', 'amount_value']));
}

function tokensFor(plan) {
  return new Set(normalize(`${plan.name} ${plan.category} ${plan.duration}`).split(' ').filter(Boolean));
}

function scoreMatch(plan, variation) {
  const target = normalize(`${providerLabel(variation)} ${JSON.stringify(variation)}`);
  const targetTokens = new Set(target.split(' ').filter(Boolean));
  const tokens = tokensFor(plan);
  let score = 0;
  for (const token of tokens) if (targetTokens.has(token)) score += token.length >= 3 ? 2 : 1;
  const targetText = normalize(providerLabel(variation));
  if (targetText === normalize(plan.name)) score += 20;
  const amount = providerCost(variation);
  if (amount !== null && Number(plan.priceUser) > 0) {
    const ratio = amount / Number(plan.priceUser);
    if (ratio > 0.4 && ratio < 1.2) score += 2;
  }
  return score;
}

function matchVariation(plan, variations, usedIds) {
  const ranked = variations
    .map((item) => ({ item, id: providerId(item), score: scoreMatch(plan, item) }))
    .filter((entry) => entry.id !== null && entry.id !== undefined && !usedIds.has(String(entry.id)))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 5) return null;
  if (ranked[1] && ranked[0].score === ranked[1].score) return null;
  return ranked[0];
}

async function findDataService(db) {
  const result = await db.query("SELECT id FROM services WHERE slug = 'data' LIMIT 1");
  if (!result.rows[0]) throw new Error("The 'data' service does not exist. Run the normal database migrations first.");
  return result.rows[0].id;
}

async function main() {
  const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
  if (!Array.isArray(catalogue) || catalogue.length !== 64) throw new Error(`Expected 64 catalogue plans, found ${catalogue.length}`);

  const providerResult = await providerService.getVariations('data', 'mtn');
  if (!providerResult.success) throw new Error(`Provider catalogue request failed: ${providerResult.message}`);
  const variations = Array.isArray(providerResult.data) ? providerResult.data : [];
  if (!variations.length) throw new Error('Provider returned no MTN data variations; no plans were changed.');

  const client = await pool.connect();
  let transactionStarted = false;
  try {
    if (APPLY) {
      await client.query('BEGIN');
      transactionStarted = true;
    }
    const serviceId = await findDataService(client);
    const usedIds = new Set();
    const results = [];

    for (const plan of catalogue) {
    const match = matchVariation(plan, variations, usedIds);
    if (!match) {
      results.push({ status: 'unmatched', plan: plan.name, customerPrice: plan.priceUser });
      continue;
    }

    const id = String(match.id);
    usedIds.add(id);
    const actualProviderCost = providerCost(match.item);
    const estimatedProviderCost = ESTIMATE_RATE && ESTIMATE_RATE > 0 && ESTIMATE_RATE < 1
      ? Math.round((Number(plan.priceUser) * ESTIMATE_RATE) * 100) / 100
      : null;
    const cost = actualProviderCost ?? estimatedProviderCost;
    const source = actualProviderCost !== null ? 'provider_api' : 'estimated_seed';
    const profit = cost === null ? null : Math.round((Number(plan.priceUser) - cost) * 100) / 100;
    const margin = cost === null || Number(plan.priceUser) <= 0 ? null : Math.round((profit / Number(plan.priceUser)) * 100000) / 1000;
    results.push({
      status: cost === null ? 'missing_cost' : 'matched',
      plan: plan.name,
      providerPlanId: id,
      customerPrice: Number(plan.priceUser),
      providerCost: cost,
      profit,
      margin,
      source,
      category: plan.category,
      duration: plan.duration
    });

    if (!APPLY || cost === null) continue;
    const metadata = {
      variation_id: id,
      provider_plan_id: id,
      catalogue_category: plan.category,
      catalogue_duration: plan.duration,
      pricing_source: source,
      imported_by: 'seedMtnCatalogue'
    };
    const existing = await client.query(
      `SELECT id FROM service_plans WHERE service_id = $1 AND network_key = 'mtn' AND type = 'data' AND (provider_plan_id = $2 OR metadata->>'variation_id' = $2 OR name = $3) LIMIT 1`,
      [serviceId, id, plan.name]
    );
    if (existing.rows[0]) {
      await client.query(
        `UPDATE service_plans SET network = 'MTN', name = $1, sub_type = $2, price_user = $3, price_api = $4,
         provider_cost = $4, profit_amount = $5, profit_margin_percent = $6, pricing_source = $7,
         provider_plan_id = $8, metadata = $9, is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $10`,
        [plan.name, plan.category, plan.priceUser, cost, profit, margin, source, id, JSON.stringify(metadata), existing.rows[0].id]
      );
    } else {
      await client.query(
        `INSERT INTO service_plans (service_id, network, network_key, name, type, sub_type, price_user, price_api,
         provider_cost, profit_amount, profit_margin_percent, pricing_source, provider_plan_id, is_active, metadata)
         VALUES ($1, 'MTN', 'mtn', $2, 'data', $3, $4, $5, $5, $6, $7, $8, $9, TRUE, $10)`,
        [serviceId, plan.name, plan.category, plan.priceUser, cost, profit, margin, source, id, JSON.stringify(metadata)]
      );
    }
  }

    const summary = results.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    console.log(JSON.stringify({ mode: APPLY ? 'apply' : 'preview', total: results.length, summary, results }, null, 2));
    if (summary.unmatched || summary.missing_cost) {
      if (APPLY && transactionStarted) await client.query('ROLLBACK');
      if (APPLY) throw new Error(`Seed aborted: ${summary.unmatched || 0} unmatched and ${summary.missing_cost || 0} missing provider-cost rows; no plans were changed.`);
      process.exitCode = 2;
    } else if (APPLY && transactionStarted) {
      await client.query('COMMIT');
    } else if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    if (!APPLY) console.log('\\nPreview only. Re-run with --apply after reviewing the matches.');
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

main().catch((error) => {
  console.error(`[Seed MTN] ${error.message}`);
  process.exitCode = 1;
}).finally(async () => {
  await pool.end();
});
