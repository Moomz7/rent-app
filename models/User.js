const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// ✅ Define schema first
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, enum: ['tenant', 'landlord'], required: true },
  resetToken: String,
  resetTokenExpires: Date
});

// ✅ Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Method to validate password
userSchema.methods.isValidPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// ✅ Method to generate reset token
userSchema.methods.generateResetToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.resetToken = token;
  this.resetTokenExpires = Date.now() + 3600000; // 1 hour
  return token;
};

module.exports = mongoose.model('User', userSchema);