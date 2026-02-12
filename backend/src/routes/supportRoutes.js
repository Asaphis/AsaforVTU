const express = require('express');
const { verifyToken } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// All support routes require authentication
router.use(verifyToken);

// Support tickets (Users can create and reply, Admins can do more)
router.get('/tickets', adminController.getTickets);
router.post('/tickets/create', adminController.createTicket);
router.get('/tickets/:id/messages', adminController.getTicketMessages);
router.post('/tickets/:id/reply', adminController.replyTicket);

module.exports = router;
