const cron = require('node-cron');
const reconcilePayments = require('./paymentReconciler');
const { runDueCampaigns } = require('../services/campaignService');
const { processDueDeletions } = require('../services/accountDeletionService');

const initCronJobs = () => {
  console.log('Initializing Cron Jobs...');

  // Run payment reconciliation every minute
  // Schedule: * * * * *
  cron.schedule('* * * * *', () => {
    Promise.resolve(reconcilePayments()).catch((error) => console.error('[Cron] Payment reconciliation failed:', error.message));
    runDueCampaigns().catch((error) => console.error('[Cron] Scheduled campaign run failed:', error.message));
    processDueDeletions().catch((error) => console.error('[Cron] Account deletion processing failed:', error.message));
  });

  console.log('Cron Jobs scheduled: Payment reconciliation, campaigns, and delayed account deletion (every 1 min)');
};

module.exports = { initCronJobs };
