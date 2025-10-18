const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// ✅ Define schema first
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  role: { type: String, enum: ['tenant', 'landlord'], required: true },
  resetToken: String,
  resetTokenExpires: Date,
  
  // Address information (for both tenants and landlords)
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'United States' }
  },
  
  // Normalized address for matching
  normalizedAddress: { type: String, index: true },
  
  // Tenant-specific fields
  monthlyRent: { type: Number, default: 0 }, // Only for tenants
  leaseStart: { type: Date }, // Only for tenants
  leaseEnd: { type: Date }, // Only for tenants
  unitNumber: String, // Apartment/unit number for tenants
  
  // Property assignment (for tenants)
  assignedPropertyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property'
  },
  assignedLandlordId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  // Landlord-specific fields
  businessName: String, // Optional business name for landlords
  phoneNumber: String,
  
  // Account status
  isActive: { type: Boolean, default: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Hash password before saving and normalize address
userSchema.pre('save', async function(next) {
  try {
    // Hash password if modified
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    
    // Normalize address if modified
    if (this.isModified('address') && this.address && this.address.street) {
      this.normalizedAddress = this.createNormalizedAddress(this.address);
    }
    
    // Update timestamp
    if (this.isModified() && !this.isNew) {
      this.updatedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
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

// Method to create normalized address for matching
userSchema.methods.createNormalizedAddress = function(address) {
  if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
    return null;
  }
  
  // Normalize: lowercase, remove spaces, punctuation, common abbreviations
  const street = address.street
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, '') // Remove spaces
    .replace(/street/g, 'st')
    .replace(/avenue/g, 'ave')
    .replace(/boulevard/g, 'blvd')
    .replace(/drive/g, 'dr')
    .replace(/road/g, 'rd')
    .replace(/lane/g, 'ln')
    .replace(/court/g, 'ct');
    
  const city = address.city.toLowerCase().replace(/[^\w]/g, '');
  const state = address.state.toLowerCase().replace(/[^\w]/g, '');
  const zip = address.zipCode.replace(/[^\d]/g, '').substring(0, 5); // First 5 digits only
  
  return `${street}${city}${state}${zip}`;
};

// Method to get full address string
userSchema.methods.getFullAddress = function() {
  if (!this.address || !this.address.street) return null;
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
};

// Static method to find tenants by landlord
userSchema.statics.findTenantsByLandlord = function(landlordId) {
  return this.find({ 
    role: 'tenant', 
    assignedLandlordId: landlordId,
    isActive: true 
  }).sort({ username: 1 });
};

// Static method to find unassigned tenants
userSchema.statics.findUnassignedTenants = function() {
  return this.find({ 
    role: 'tenant', 
    assignedLandlordId: null,
    isActive: true 
  }).sort({ createdAt: -1 });
};

// Indexes
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ resetTokenExpires: 1 });
userSchema.index({ normalizedAddress: 1 });
userSchema.index({ assignedLandlordId: 1 });
userSchema.index({ assignedPropertyId: 1 });
userSchema.index({ role: 1, assignedLandlordId: 1 });

module.exports = mongoose.model('User', userSchema);