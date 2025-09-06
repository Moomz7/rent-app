const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Request = require('../models/Request'); // Assuming you have a model
const Payment = require('../models/Payment'); // Assuming you have a model

router.post('/api/requests/:id/resolve', ensureLandlord, async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved' },
      { new: true }
    );
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

function ensureLandlord(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'landlord') return next();
  res.status(403).send('Access denied');
}

router.get('/api/tenants', ensureLandlord, async (req, res) => {
  const tenants = await User.find({ role: 'tenant' }, 'username');
  res.json(tenants);
});

router.get('/api/requests', ensureLandlord, async (req, res) => {
  const requests = await Request.find();
  res.json(requests);
});

router.get('/api/payments', ensureLandlord, async (req, res) => {
  const payments = await Payment.find().sort({ date: -1 }).limit(10);
  res.json(payments);
});

module.exports = router;