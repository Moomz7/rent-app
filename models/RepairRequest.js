const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'pending' }, // could be 'pending', 'in progress', 'resolved'
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RepairRequest', requestSchema);