const cron = require('node-cron');
const reconcilePayments = require('./paymentReconciler');
const { runDueCampaigns } = require('../services/campaignService');

const initCronJobs = () => {
  console.log('Initializing Cron Jobs...');

  // Run payment reconciliation every minute
  // Schedule: * * * * *
  cron.schedule('* * * * *', () => {
    Promise.resolve(reconcilePayments()).catch((error) => console.error('[Cron] Payment reconciliation failed:', error.message));
    runDueCampaigns().catch((error) => console.error('[Cron] Scheduled campaign run failed:', error.message));
  });

  console.log('Cron Jobs scheduled: Payment Reconciliation and scheduled campaigns (every 1 min)');
};

module.exports = { initCronJobs };
