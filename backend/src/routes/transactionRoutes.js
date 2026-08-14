const express = require('express');
const { authenticate } = require('../middleware/auth');
const transactionService = require('../services/transactionService');

const router = express.Router();
router.use(authenticate);

// The maintained purchase contract is POST /api/vtu/purchase. This legacy
// endpoint is explicitly rejected instead of creating an unfulfilled row.
router.post('/purchase', (_req, res) => {
  res.status(410).json({ error: 'This endpoint is retired; use /api/vtu/purchase' });
});

router.get('/', async (req, res) => {
  try {
    res.json(await transactionService.getTransactionsByUserId(req.user.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id, req.user.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
