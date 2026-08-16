const pool = require('../config/database');
const { deliverPushNotification } = require('./pushNotificationService');

// Create notification
const createNotification = async (notificationData) => {
  try {
    const { user_id, type, title, message, metadata = {} } = notificationData;

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, type, title, message, JSON.stringify(metadata)]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error);
    throw error;
  }
};

const sendNotification = async (userId, title, message, type = 'transaction', metadata = {}) => {
  const notification = await createNotification({ user_id: userId, type, title, message, metadata });
  Promise.resolve(
    deliverPushNotification({
      userId,
      notificationId: notification.id,
      title,
      message,
      type,
      metadata,
    })
  ).catch((error) => console.error('[Notification Service] Push delivery failed:', error.message));
  return notification;
};

// Get notifications by user ID
const getNotificationsByUserId = async (userId, unreadOnly = false, limit = 50, offset = 0) => {
  try {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (unreadOnly) {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    console.error('[Notification Service] Error getting notifications:', error);
    throw error;
  }
};

// Mark notification as read
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Notification not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Notification Service] Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for user
const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false 
       RETURNING *`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('[Notification Service] Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Notification not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Notification Service] Error deleting notification:', error);
    throw error;
  }
};

// Get unread count for user
const getUnreadCount = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('[Notification Service] Error getting unread count:', error);
    throw error;
  }
};

// Bulk create notifications (for announcements)
const createBulkNotifications = async (userIds, notificationData) => {
  try {
    const { type, title, message, metadata = {} } = notificationData;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const notifications = [];
      for (const userId of userIds) {
        const result = await client.query(
          `INSERT INTO notifications (user_id, type, title, message, metadata)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [userId, type, title, message, JSON.stringify(metadata)]
        );
        notifications.push(result.rows[0]);
      }

      await client.query('COMMIT');

      return notifications;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Notification Service] Error creating bulk notifications:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendNotification,
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  createBulkNotifications
};
