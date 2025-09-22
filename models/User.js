const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, enum: ['tenant', 'landlord'], required: true }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  console.log('🔐 Raw password before hashing:', this.password);
  this.password = await bcrypt.hash(this.password, 10);
  console.log('✅ Hashed password:', this.password);
  next();
});

// Method to validate password
UserSchema.methods.isValidPassword = async function(password) {
  console.log('🔍 Comparing entered password:', password);
  console.log('🧠 Against stored hash:', this.password);
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);