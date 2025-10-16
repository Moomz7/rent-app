
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const RepairRequest = require('../models/RepairRequest');
console.log('Stripe key:', process.env.STRIPE_SECRET_KEY);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
// PayPal environment setup
const paypalEnv = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

// Stripe webhook endpoint (no authentication required for webhooks)
router.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature (you should set STRIPE_WEBHOOK_SECRET in your .env file)
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful:', session.id);
      
      try {
        // Save payment to database
        const payment = new Payment({
          username: session.metadata.username,
          amount: session.metadata.original_amount,
          stripeSessionId: session.id,
          paymentMethod: 'stripe',
          status: 'completed'
        });
        
        await payment.save();
        console.log('Payment saved to database:', payment.id);
      } catch (err) {
        console.error('Error saving payment to database:', err);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object;
      console.log('Payment failed:', paymentIntent.id);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// Create Stripe Checkout session
router.post('/api/create-stripe-session', ensureTenant, async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    // Validate input
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }
    
    const paymentAmount = Math.round(Number(amount) * 100); // Convert to cents
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { 
              name: description || 'Rent Payment',
              description: `Rent payment for ${req.user.username}`
            },
            unit_amount: paymentAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
      metadata: { 
        username: req.user.username,
        tenant_id: req.user._id.toString(),
        payment_type: 'rent',
        original_amount: amount
      },
      customer_email: req.user.email,
      billing_address_collection: 'required',
    });
    
    console.log('Stripe session created:', session.id);
    res.json({ url: session.url, session_id: session.id });
    
  } catch (err) {
    console.error('Stripe session creation error:', err);
    res.status(500).json({ 
      error: 'Failed to create Stripe session',
      message: err.message 
    });
  }
});

// Create PayPal order
router.post('/api/create-paypal-order', ensureTenant, async (req, res) => {
  console.log('PayPal route hit', req.body);
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: String(req.body.amount),
        },
        description: 'Rent Payment',
      },
    ],
    application_context: {
      return_url: req.body.successUrl || `${req.protocol}://${req.get('host')}/tenant-portal.html?payment=success`,
      cancel_url: req.body.cancelUrl || `${req.protocol}://${req.get('host')}/tenant-portal.html?payment=cancel`,
    },
  });
  try {
    const order = await paypalClient.execute(request);
    res.json({ id: order.result.id, links: order.result.links });
  } catch (err) {
    console.error('PayPal error:', err);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});
// Get current balance and due date for the logged-in tenant
router.get('/api/balance', ensureTenant, async (req, res) => {
  try {
    const user = req.user;
    if (!user.leaseStart || !user.monthlyRent) {
      return res.status(400).json({ error: 'Lease start date or monthly rent not set.' });
    }
    const now = new Date();
    const leaseStart = new Date(user.leaseStart);
    // Calculate number of months since leaseStart (including current month)
    let monthsOwed = (now.getFullYear() - leaseStart.getFullYear()) * 12 + (now.getMonth() - leaseStart.getMonth()) + 1;
    if (monthsOwed < 0) monthsOwed = 0;
    const totalOwed = monthsOwed * user.monthlyRent;
    const payments = await Payment.find({ username: user.username });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalOwed - totalPaid;
    // Next due date is the 1st of next month
    const nextDue = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    res.json({
      balance,
      monthlyRent: user.monthlyRent,
      leaseStart: user.leaseStart,
      nextDueDate: nextDue,
      payments
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate balance' });
  }
});
// Middleware to ensure only tenants can access
function ensureTenant(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'tenant') return next();
  res.status(403).json({ error: 'Forbidden' });
}

// Submit a payment
router.post('/api/payments', ensureTenant, async (req, res) => {
  try {
    const payment = new Payment({
      username: req.user.username,
      amount: req.body.amount
    });
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Get all payments for the logged-in tenant
router.get('/api/payments', ensureTenant, async (req, res) => {
  try {
    const payments = await Payment.find({ username: req.user.username }).sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Submit a repair request
router.post('/api/repair-requests', ensureTenant, async (req, res) => {
  try {
    const request = new RepairRequest({
      username: req.user.username,
      description: req.body.description
    });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit repair request' });
  }
});

// Get all repair requests for the logged-in tenant
router.get('/api/repair-requests', ensureTenant, async (req, res) => {
  try {
    const requests = await RepairRequest.find({ username: req.user.username }).sort({ submittedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch repair requests' });
  }
});

module.exports = router;
