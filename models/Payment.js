const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paymentMethod: { 
    type: String, 
    enum: ['stripe', 'paypal', 'manual', 'bank_transfer'],
    default: 'manual'
  },
  stripeSessionId: { type: String, sparse: true },
  paypalOrderId: { type: String, sparse: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  description: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

// Add indexes for better query performance
paymentSchema.index({ username: 1, date: -1 });
paymentSchema.index({ stripeSessionId: 1 });
paymentSchema.index({ paypalOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);