const admin = require('firebase-admin');
const pool = require('../config/database');
const fs = require('fs');

const invalidTokenCodes = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const parseCredentialFile = (filePath, sourceName) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`[Push] ${sourceName} could not be read:`, error.message);
    return null;
  }
};

const firebaseCredential = () => {
  const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (raw) {
    // Accept legacy deployments that put the service-account file path in a
    // variable whose name suggests inline JSON. Never log the path contents.
    const filePath = raw.startsWith('file:') ? raw.slice(5) : raw;
    if (fs.existsSync(filePath)) return parseCredentialFile(filePath, 'Firebase service-account file');
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('[Push] Firebase service-account configuration is neither valid JSON nor an existing file path.');
      return null;
    }
  }
  const applicationCredentials = String(process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  if (applicationCredentials && fs.existsSync(applicationCredentials)) {
    return parseCredentialFile(applicationCredentials, 'GOOGLE_APPLICATION_CREDENTIALS');
  }
  return null;
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

  const requestedDeviceIds = Array.isArray(metadata.device_ids) ? metadata.device_ids.map(String).filter(Boolean) : [];
  const devices = await pool.query(
    requestedDeviceIds.length
      ? `SELECT id, token FROM notification_devices
         WHERE user_id = $1 AND id = ANY($2::uuid[]) AND is_active = TRUE
         ORDER BY last_seen_at DESC`
      : `SELECT id, token FROM notification_devices
         WHERE user_id = $1 AND is_active = TRUE
         ORDER BY last_seen_at DESC`,
    requestedDeviceIds.length ? [userId, requestedDeviceIds] : [userId]
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
      notification: {
        channelId: 'asaforvtu_account_alerts',
        sound: 'default',
        icon: 'ic_stat_asaforvtu',
        imageUrl,
      },
    },
    apns: {
      payload: { aps: { sound: 'default', contentAvailable: true } },
      fcmOptions: imageUrl ? { imageUrl } : undefined,
    },
  });

  const invalidIds = [];
  const failureCodes = [];
  response.responses.forEach((result, index) => {
    if (!result.success) {
      const code = String(result.error?.code || 'unknown_firebase_error');
      failureCodes.push(code);
      if (invalidTokenCodes.has(code)) {
        invalidIds.push(devices.rows[index].id);
      }
    }
  });
  if (invalidIds.length) {
    await pool.query(
      'UPDATE notification_devices SET is_active = FALSE WHERE id = ANY($1::uuid[])',
      [invalidIds]
    );
  }

  const uniqueFailureCodes = [...new Set(failureCodes)];
  if (uniqueFailureCodes.length) {
    console.error('[Push] Firebase delivery failed:', uniqueFailureCodes.join(', '));
  }
  return {
    delivered: response.successCount > 0,
    successCount: response.successCount,
    failureCount: response.failureCount,
    failureCodes: uniqueFailureCodes,
  };
};

module.exports = { deliverPushNotification, inferredDestination };
