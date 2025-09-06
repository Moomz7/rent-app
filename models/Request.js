const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  tenant: String,
  issue: String,
  status: { type: String, default: 'Pending' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);