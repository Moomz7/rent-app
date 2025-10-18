const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  // Property identification
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'United States' }
  },
  
  // Normalized address for matching (lowercase, no spaces/punctuation)
  normalizedAddress: { type: String, required: true, index: true },
  
  // Property details
  propertyName: { type: String }, // Optional name like "Sunset Apartments"
  propertyType: { 
    type: String, 
    enum: ['house', 'apartment', 'condo', 'townhouse', 'duplex', 'other'],
    default: 'apartment'
  },
  
  // Landlord who owns this property
  landlordId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  landlordUsername: { type: String, required: true }, // Denormalized for quick lookup
  
  // Property management info
  totalUnits: { type: Number, default: 1 },
  availableUnits: { type: Number, default: 0 },
  
  // Financial info
  baseRent: { type: Number }, // Base rent for the property
  
  // Property status
  isActive: { type: Boolean, default: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
propertySchema.index({ landlordId: 1, isActive: 1 });
propertySchema.index({ normalizedAddress: 1 });
propertySchema.index({ 'address.zipCode': 1, 'address.city': 1 });

// Pre-save middleware to create normalized address
propertySchema.pre('save', function(next) {
  if (this.isModified('address')) {
    this.normalizedAddress = createNormalizedAddress(this.address);
  }
  this.updatedAt = new Date();
  next();
});

// Method to get full address string
propertySchema.methods.getFullAddress = function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
};

// Static method to find property by address
propertySchema.statics.findByAddress = function(addressObj) {
  const normalized = createNormalizedAddress(addressObj);
  return this.findOne({ normalizedAddress: normalized, isActive: true });
};

// Static method to find properties by landlord
propertySchema.statics.findByLandlord = function(landlordId) {
  return this.find({ landlordId: landlordId, isActive: true }).sort({ createdAt: -1 });
};

// Helper function to normalize address for matching
function createNormalizedAddress(address) {
  if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
    throw new Error('Complete address required (street, city, state, zipCode)');
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
}

module.exports = mongoose.model('Property', propertySchema);