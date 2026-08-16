const admin = require('firebase-admin');
const pool = require('../config/database');
const fs = require('fs');

const invalidTokenCodes = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const firebaseCredential = () => {
  const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw && process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    try {
      return JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    } catch (error) {
      console.error('[Push] GOOGLE_APPLICATION_CREDENTIALS could not be read:', error.message);
      return null;
    }
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('[Push] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON:', error.message);
    return null;
  }
};

const messaging = () => {
  const credential = firebaseCredential();
  if (!credential) return null;
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(credential) });
  }
  return admin.messaging();
};

const inferredDestination = (type, metadata = {}) => {
  if (metadata.deep_link || metadata.destination || metadata.url) {
    return metadata.deep_link || metadata.destination || metadata.url;
  }
  if (metadata.transactionId || metadata.reference || metadata.tx_ref) return '/dashboard/transactions';
  if (metadata.ticketId) return '/dashboard/support';
  if (type === 'wallet') return '/dashboard/wallet';
  if (type === 'support') return '/dashboard/support';
  if (type === 'referral') return '/dashboard/referrals';
  return '/dashboard/notifications';
};

const dataPayload = (type, metadata, destination, notificationId) => {
  const safe = {
    type: String(type || 'notification'),
    deep_link: String(destination),
    notification_id: String(notificationId || ''),
  };
  for (const [key, value] of Object.entries(metadata || {})) {
    if (value === null || value === undefined || typeof value === 'object') continue;
    safe[String(key)] = String(value);
  }
  return safe;
};

const notificationImageUrl = (metadata = {}) => {
  const candidate = String(metadata.image_url || '').trim();
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch (_) {
    return undefined;
  }
};

const deliverPushNotification = async ({ userId, notificationId, title, message, type, metadata = {} }) => {
  const client = messaging();
  if (!client) return { delivered: false, reason: 'firebase_not_configured' };

  const devices = await pool.query(
    `SELECT id, token FROM notification_devices
     WHERE user_id = $1 AND is_active = TRUE
     ORDER BY last_seen_at DESC`,
    [userId]
  );
  if (!devices.rows.length) return { delivered: false, reason: 'no_registered_devices' };

  const destination = inferredDestination(type, metadata);
  const imageUrl = notificationImageUrl(metadata);
  const response = await client.sendEachForMulticast({
    tokens: devices.rows.map((device) => device.token),
    notification: { title, body: message, imageUrl },
    data: dataPayload(type, metadata, destination, notificationId),
    android: {
      priority: 'high',
      notification: { channelId: 'asaforvtu_account_alerts', sound: 'default', imageUrl },
    },
    apns: {
      payload: { aps: { sound: 'default', contentAvailable: true } },
      fcmOptions: imageUrl ? { imageUrl } : undefined,
    },
  });

  const invalidIds = [];
  response.responses.forEach((result, index) => {
    if (!result.success && invalidTokenCodes.has(result.error?.code)) {
      invalidIds.push(devices.rows[index].id);
    }
  });
  if (invalidIds.length) {
    await pool.query(
      'UPDATE notification_devices SET is_active = FALSE WHERE id = ANY($1::uuid[])',
      [invalidIds]
    );
  }

  return {
    delivered: response.successCount > 0,
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
};

module.exports = { deliverPushNotification, inferredDestination };
