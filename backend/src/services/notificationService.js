const { messaging } = require('../config/firebase');
const axios = require('axios');

class NotificationService {
  async sendNotification(userId, title, body, data = {}) {
    try {
      console.log(`[Notification] To: ${userId} | ${title}: ${body}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendWelcomeEmail(email, displayName, password) {
    try {
      // Log the welcome email details (in production, you'd integrate with an email service)
      console.log(`[Welcome Email] To: ${email} | Name: ${displayName}`);
      
      // You can integrate with any email service here
      // For now, we'll use Firebase Functions or a simple endpoint
      
      // Example with a custom email service:
      const emailServiceUrl = process.env.EMAIL_SERVICE_URL;
      if (emailServiceUrl) {
        await axios.post(emailServiceUrl, {
          to: email,
          subject: 'Welcome to Asafor VTU',
          template: 'welcome',
          data: {
            name: displayName,
            email: email,
            loginUrl: process.env.FRONTEND_URL || 'https://vtu.ferixas.com/login'
          }
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Notification] Welcome email error:', error?.message || error);
      return { success: false, error: error.message };
    }
  }

  async sendSms(phone, message) {
    try {
      if ((process.env.SEND_PURCHASE_SMS || '').toLowerCase() !== 'true') {
        return;
      }
      const apiKey = process.env.SMS_TERMII_API_KEY || '';
      const senderId = process.env.SMS_SENDER_ID || 'Asafor';
      const channel = process.env.SMS_CHANNEL || 'dnd';
      if (!apiKey) {
        console.warn('SMS provider API key missing');
        return;
      }
      const payload = {
        api_key: apiKey,
        to: String(phone),
        from: senderId,
        sms: String(message),
        type: 'plain',
        channel
      };
      await axios.post('https://api.ng.termii.com/api/sms/send', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
    } catch (error) {
      console.error('Error sending SMS:', error?.response?.data || error?.message || String(error));
    }
  }
}

module.exports = new NotificationService();

