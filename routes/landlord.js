
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const RepairRequest = require('../models/RepairRequest');
const Payment = require('../models/Payment');

// Get properties for the logged-in landlord
router.get('/api/properties', ensureLandlord, async (req, res) => {
  try {
    const properties = await Property.find({ landlordId: req.user._id });
    
    // Populate properties with tenant count for each
    const propertiesWithStats = await Promise.all(
      properties.map(async (property) => {
        const tenantCount = await User.countDocuments({
          assignedPropertyId: property._id,
          role: 'tenant'
        });
        
        return {
          ...property.toObject(),
          tenantCount
        };
      })
    );
    
    res.json(propertiesWithStats);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get unassigned tenants for the logged-in landlord
router.get('/api/unassigned-tenants', ensureLandlord, async (req, res) => {
  try {
    // Get all landlord's properties
    const properties = await Property.find({ landlordId: req.user._id });
    const propertyIds = properties.map(p => p._id);
    
    // Find tenants assigned to this landlord but not to any specific property
    const unassignedTenants = await User.find({
      role: 'tenant',
      assignedLandlordId: req.user._id,
      $or: [
        { assignedPropertyId: { $exists: false } },
        { assignedPropertyId: null },
        { assignedPropertyId: { $nin: propertyIds } }
      ]
    });
    
    res.json(unassignedTenants);
  } catch (error) {
    console.error('Error fetching unassigned tenants:', error);
    res.status(500).json({ error: 'Failed to fetch unassigned tenants' });
  }
});

// Get tenants assigned to this landlord with their balances and due dates
router.get('/api/tenants/balances', ensureLandlord, async (req, res) => {
  try {
    // Only get tenants assigned to this landlord
    const tenants = await User.find({ 
      role: 'tenant',
      assignedLandlordId: req.user._id,
      isActive: true
    }).populate('assignedPropertyId');
    
    const now = new Date();
    const results = await Promise.all(tenants.map(async (tenant) => {
      if (!tenant.leaseStart || !tenant.monthlyRent) {
        return {
          username: tenant.username,
          email: tenant.email,
          address: tenant.getFullAddress(),
          unitNumber: tenant.unitNumber,
          propertyName: tenant.assignedPropertyId?.propertyName || 'N/A',
          balance: null,
          monthlyRent: tenant.monthlyRent || 0,
          leaseStart: tenant.leaseStart,
          leaseEnd: tenant.leaseEnd,
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
        email: tenant.email,
        address: tenant.getFullAddress(),
        unitNumber: tenant.unitNumber,
        propertyName: tenant.assignedPropertyId?.propertyName || 'N/A',
        balance,
        monthlyRent: tenant.monthlyRent,
        leaseStart: tenant.leaseStart,
        leaseEnd: tenant.leaseEnd,
        nextDueDate: nextDue
      };
    }));
    
    res.json(results);
  } catch (err) {
    console.error('Error fetching tenant balances:', err);
    res.status(500).json({ error: 'Failed to fetch tenant balances' });
  }
});

function ensureLandlord(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'landlord') return next();
  res.status(403).send('Access denied');
}

router.get('/api/tenants', ensureLandlord, async (req, res) => {
  try {
    // Only return tenants assigned to this landlord
    const tenants = await User.find({ 
      role: 'tenant',
      assignedLandlordId: req.user._id,
      isActive: true
    }, 'username email address unitNumber').populate('assignedPropertyId', 'propertyName');
    
    res.json(tenants);
  } catch (err) {
    console.error('Error fetching tenants:', err);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

router.get('/api/requests', ensureLandlord, async (req, res) => {
  try {
    // Get tenants assigned to this landlord
    const tenantUsernames = await User.find({
      role: 'tenant',
      assignedLandlordId: req.user._id,
      isActive: true
    }, 'username').then(tenants => tenants.map(t => t.username));
    
    const status = req.query.status || 'all';
    const filter = { username: { $in: tenantUsernames } };
    
    if (status !== 'all') {
      filter.status = status;
    }

    const requests = await RepairRequest.find(filter).sort({ submittedAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Request fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.get('/api/payments', ensureLandlord, async (req, res) => {
  try {
    // Get tenants assigned to this landlord
    const tenantUsernames = await User.find({
      role: 'tenant',
      assignedLandlordId: req.user._id,
      isActive: true
    }, 'username').then(tenants => tenants.map(t => t.username));
    
    const payments = await Payment.find({ 
      username: { $in: tenantUsernames } 
    }).sort({ date: -1 }).limit(20);
    
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
  res.json({ 
    username: req.user.username,
    email: req.user.email,
    businessName: req.user.businessName,
    phoneNumber: req.user.phoneNumber
  });
});

// Get properties owned by this landlord
router.get('/api/properties', ensureLandlord, async (req, res) => {
  try {
    const properties = await Property.findByLandlord(req.user._id);
    
    // Add tenant count for each property
    const propertiesWithTenants = await Promise.all(properties.map(async (property) => {
      const tenantCount = await User.countDocuments({
        role: 'tenant',
        assignedPropertyId: property._id,
        isActive: true
      });
      
      return {
        ...property.toObject(),
        tenantCount
      };
    }));
    
    res.json(propertiesWithTenants);
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Add a new property
router.post('/api/properties', ensureLandlord, async (req, res) => {
  try {
    const { address, propertyName, propertyType, totalUnits, baseRent } = req.body;
    
    // Validate address
    if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
      return res.status(400).json({ error: 'Complete address required' });
    }
    
    // Check if property already exists for this landlord
    const existingProperty = await Property.findOne({
      landlordId: req.user._id,
      normalizedAddress: Property.prototype.createNormalizedAddress || 
        ((addr) => `${addr.street}${addr.city}${addr.state}${addr.zipCode}`.toLowerCase().replace(/[^\w]/g, ''))
    });
    
    if (existingProperty) {
      return res.status(400).json({ error: 'Property already exists' });
    }
    
    const property = new Property({
      address: {
        street: address.street.trim(),
        city: address.city.trim(), 
        state: address.state,
        zipCode: address.zipCode.replace(/\D/g, '').substring(0, 5)
      },
      propertyName: propertyName?.trim() || null,
      propertyType: propertyType || 'apartment',
      totalUnits: parseInt(totalUnits) || 1,
      availableUnits: parseInt(totalUnits) || 1,
      baseRent: parseFloat(baseRent) || null,
      landlordId: req.user._id,
      landlordUsername: req.user.username
    });
    
    await property.save();
    
    // Check for unassigned tenants at this address
    await assignExistingTenantsToProperty(property);
    
    res.status(201).json(property);
  } catch (err) {
    console.error('Error creating property:', err);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Get unassigned tenants (for manual assignment)
router.get('/api/unassigned-tenants', ensureLandlord, async (req, res) => {
  try {
    const unassignedTenants = await User.findUnassignedTenants();
    res.json(unassignedTenants);
  } catch (err) {
    console.error('Error fetching unassigned tenants:', err);
    res.status(500).json({ error: 'Failed to fetch unassigned tenants' });
  }
});

// Manually assign tenant to landlord
router.post('/api/assign-tenant', ensureLandlord, async (req, res) => {
  try {
    const { tenantId, propertyId } = req.body;
    
    const tenant = await User.findById(tenantId);
    const property = await Property.findOne({ 
      _id: propertyId,
      landlordId: req.user._id // Ensure landlord owns the property
    });
    
    if (!tenant || !property) {
      return res.status(404).json({ error: 'Tenant or property not found' });
    }
    
    if (tenant.role !== 'tenant') {
      return res.status(400).json({ error: 'Invalid tenant' });
    }
    
    // Assign tenant
    tenant.assignedLandlordId = req.user._id;
    tenant.assignedPropertyId = property._id;
    await tenant.save();
    
    res.json({ 
      message: 'Tenant assigned successfully',
      tenant: tenant.username,
      property: property.getFullAddress()
    });
  } catch (err) {
    console.error('Error assigning tenant:', err);
    res.status(500).json({ error: 'Failed to assign tenant' });
  }
});

// Helper function for assigning existing tenants
async function assignExistingTenantsToProperty(property) {
  try {
    const unassignedTenants = await User.find({
      role: 'tenant',
      normalizedAddress: property.normalizedAddress,
      assignedLandlordId: null,
      isActive: true
    });
    
    for (const tenant of unassignedTenants) {
      tenant.assignedLandlordId = property.landlordId;
      tenant.assignedPropertyId = property._id;
      await tenant.save();
      
      console.log(`✅ Assigned existing tenant ${tenant.username} to property ${property.getFullAddress()}`);
    }
  } catch (error) {
    console.error('Error assigning existing tenants:', error);
  }
}

module.exports = router;