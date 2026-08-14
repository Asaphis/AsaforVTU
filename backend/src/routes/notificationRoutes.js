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
