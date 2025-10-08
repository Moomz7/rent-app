
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RepairRequest = require('../models/RepairRequest');
const Payment = require('../models/Payment');

// Get all tenants with their balances and due dates
router.get('/api/tenants/balances', ensureLandlord, async (req, res) => {
  try {
    const tenants = await User.find({ role: 'tenant' });
    const now = new Date();
    const results = await Promise.all(tenants.map(async (tenant) => {
      if (!tenant.leaseStart || !tenant.monthlyRent) {
        return {
          username: tenant.username,
          balance: null,
          monthlyRent: tenant.monthlyRent,
          leaseStart: tenant.leaseStart,
          nextDueDate: null,
          error: 'Lease start date or monthly rent not set.'
        };
      }
      const leaseStart = new Date(tenant.leaseStart);
      let monthsOwed = (now.getFullYear() - leaseStart.getFullYear()) * 12 + (now.getMonth() - leaseStart.getMonth()) + 1;
      if (monthsOwed < 0) monthsOwed = 0;
      const totalOwed = monthsOwed * tenant.monthlyRent;
      const payments = await Payment.find({ username: tenant.username });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = totalOwed - totalPaid;
      const nextDue = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        username: tenant.username,
        balance,
        monthlyRent: tenant.monthlyRent,
        leaseStart: tenant.leaseStart,
        nextDueDate: nextDue
      };
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tenant balances' });
  }
});

function ensureLandlord(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'landlord') return next();
  res.status(403).send('Access denied');
}

router.get('/api/tenants', ensureLandlord, async (req, res) => {
  try {
    const tenants = await User.find({ role: 'tenant' }, 'username');
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

router.get('/api/requests', ensureLandlord, async (req, res) => {
  try {
    const status = req.query.status || 'all';
    const filter = status === 'all' ? {} : { status };

    const requests = await RepairRequest.find(filter).sort({ submittedAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Request fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.get('/api/payments', ensureLandlord, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ date: -1 }).limit(10);
    res.json(payments);
  } catch (err) {
    console.error('Payment fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/api/requests/:id/resolve', ensureLandlord, async (req, res) => {
  try {
    const request = await RepairRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

router.get('/api/current-user', ensureLandlord, (req, res) => {
  res.json({ username: req.user.username });
});

module.exports = router;