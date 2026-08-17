const express = require('express');
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const unreadOnly = String(req.query.unreadOnly || 'false') === 'true';
    const limit = Math.min(Number(req.query.limit || 50), 100);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    res.json(await notificationService.getNotificationsByUserId(req.user.id, unreadOnly, limit, offset));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    res.json({ count: await notificationService.getUnreadCount(req.user.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/devices', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    const platform = String(req.body?.platform || '').trim().toLowerCase();
    if (token.length < 20 || token.length > 4096) {
      return res.status(400).json({ error: 'A valid device token is required.' });
    }
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({ error: 'Device platform must be android or ios.' });
    }
    const database = require('../config/database');
    const account = await database.query(
      `SELECT email, full_name, last_login_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );
    const accountEmail = String(account.rows[0]?.email || '').trim().toLowerCase();
    const accountName = String(account.rows[0]?.full_name || '').trim().toLowerCase();
    const isAuditAccount = accountEmail.endsWith('@example.invalid') || accountName === 'auth audit test';
    if (isAuditAccount) {
      await database.query(
        'UPDATE notification_devices SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [req.user.id]
      );
      return res.status(403).json({ error: 'Test and audit accounts cannot register production notification devices.' });
    }
    // A reinstall can produce a new FCM token. Keep the newest installation
    // active for this user/platform and retire stale tokens immediately.
    await database.query(
      'UPDATE notification_devices SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND platform = $2 AND token <> $3',
      [req.user.id, platform, token]
    );
    const result = await database.query(
      `INSERT INTO notification_devices (user_id, token, platform, is_active, last_seen_at)
       VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP)
       ON CONFLICT (token) DO UPDATE
       SET user_id = EXCLUDED.user_id,
           platform = EXCLUDED.platform,
           is_active = TRUE,
           last_seen_at = CURRENT_TIMESTAMP
       RETURNING id, platform, is_active, last_seen_at`,
      [req.user.id, token, platform]
    );
    const loginAt = new Date(account.rows[0]?.last_login_at || 0).getTime();
    const loginWasRecent = Number.isFinite(loginAt) && Date.now() - loginAt >= 0 && Date.now() - loginAt < 2 * 60 * 1000;
    let loginPush = null;
    if (loginWasRecent) {
      try {
        const { deliverPushNotification } = require('../services/pushNotificationService');
        loginPush = await deliverPushNotification({
          userId: req.user.id,
          notificationId: '',
          title: 'Welcome back',
          message: 'You signed in successfully. Review your wallet, activity, and support updates.',
          type: 'account',
          metadata: { event: 'login', login_at: new Date(loginAt).toISOString() },
        });
      } catch (pushError) {
        loginPush = { delivered: false, reason: pushError.message || 'login_push_retry_failed' };
      }
    }
    return res.status(201).json({ device: result.rows[0], loginPush });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/devices', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    if (!token) return res.status(400).json({ error: 'Device token is required.' });
      await require('../config/database').query(
      'UPDATE notification_devices SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND token = $2',
      [req.user.id, token]
    );
    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    res.json(await notificationService.markNotificationAsRead(req.params.id, req.user.id));
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    res.json({ notifications: await notificationService.markAllNotificationsAsRead(req.user.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    res.json(await notificationService.deleteNotification(req.params.id, req.user.id));
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;
