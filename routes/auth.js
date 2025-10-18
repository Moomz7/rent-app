const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Property = require('../models/Property');

router.post('/signup', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      address,
      unitNumber,
      monthlyRent,
      leaseStart,
      businessName,
      phoneNumber
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.redirect('/signup.html?error=missing');
    }

    // Validate address
    if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
      return res.redirect('/signup.html?error=address');
    }

    // Check for existing user
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    
    const existingUser = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail }
      ]
    });

    if (existingUser) {
      return res.redirect('/signup.html?error=exists');
    }

    // Create user object
    const userData = {
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role,
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state,
        zipCode: address.zipCode.replace(/\D/g, '').substring(0, 5)
      }
    };

    // Add role-specific fields
    if (role === 'tenant') {
      userData.unitNumber = unitNumber?.trim() || null;
      userData.monthlyRent = monthlyRent ? parseFloat(monthlyRent) : 0;
      userData.leaseStart = leaseStart ? new Date(leaseStart) : null;
    } else if (role === 'landlord') {
      userData.businessName = businessName?.trim() || null;
      userData.phoneNumber = phoneNumber?.trim() || null;
    }

    // Create and save user
    const user = new User(userData);
    await user.save();

    console.log('User created:', normalizedUsername, 'Role:', role);

    // Handle post-creation logic based on role
    if (role === 'tenant') {
      // Try to auto-assign tenant to landlord
      await autoAssignTenantToLandlord(user);
    } else if (role === 'landlord') {
      // Create property for landlord
      await createPropertyForLandlord(user);
    }

    res.redirect('/login.html?signup=success');
    
  } catch (err) {
    console.error('Signup error:', err);
    res.redirect('/signup.html?error=server');
  }
});

// Auto-assign tenant to landlord based on address
async function autoAssignTenantToLandlord(tenant) {
  try {
    console.log('Attempting auto-assignment for tenant:', tenant.username);
    
    // Find property matching tenant's address
    const matchingProperty = await Property.findByAddress(tenant.address);
    
    if (matchingProperty) {
      // Find the landlord
      const landlord = await User.findById(matchingProperty.landlordId);
      
      if (landlord) {
        // Assign tenant to landlord and property
        tenant.assignedLandlordId = landlord._id;
        tenant.assignedPropertyId = matchingProperty._id;
        await tenant.save();
        
        console.log(`✅ Auto-assigned tenant ${tenant.username} to landlord ${landlord.username} at property ${matchingProperty.getFullAddress()}`);
      }
    } else {
      console.log(`⚠️ No matching property found for tenant ${tenant.username} at address: ${tenant.getFullAddress()}`);
    }
  } catch (error) {
    console.error('Auto-assignment error:', error);
    // Don't throw - assignment can be done manually later
  }
}

// Create property for new landlord
async function createPropertyForLandlord(landlord) {
  try {
    console.log('Creating property for landlord:', landlord.username);
    
    const property = new Property({
      address: landlord.address,
      landlordId: landlord._id,
      landlordUsername: landlord.username,
      propertyType: 'apartment', // Default, can be changed later
      totalUnits: 1, // Default, can be changed later
      availableUnits: 1
    });
    
    await property.save();
    console.log(`✅ Created property for landlord ${landlord.username}: ${property.getFullAddress()}`);
    
    // Now check for any unassigned tenants at this address
    await assignExistingTenantsToProperty(property);
    
  } catch (error) {
    console.error('Property creation error:', error);
    // Don't throw - property can be created manually later
  }
}

// Check for existing tenants at this address and assign them
async function assignExistingTenantsToProperty(property) {
  try {
    const unassignedTenants = await User.find({
      role: 'tenant',
      normalizedAddress: property.normalizedAddress,
      assignedLandlordId: null,
      isActive: true
    });
    
    if (unassignedTenants.length > 0) {
      console.log(`Found ${unassignedTenants.length} unassigned tenants at this address`);
      
      for (const tenant of unassignedTenants) {
        tenant.assignedLandlordId = property.landlordId;
        tenant.assignedPropertyId = property._id;
        await tenant.save();
        
        console.log(`✅ Assigned existing tenant ${tenant.username} to landlord ${property.landlordUsername}`);
      }
    }
  } catch (error) {
    console.error('Error assigning existing tenants:', error);
  }
}

router.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username: username.trim().toLowerCase() });
  if (!user) return res.redirect('/forgot-password.html?error=notfound');

  const token = user.generateResetToken();
  await user.save();

  // For now, just show the link on screen (later: send via email)
  res.redirect(`/reset-password.html?token=${token}`);
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Reset token invalid or expired');
      return res.redirect('/reset-password.html?error=expired');
    }

    user.password = newPassword; // This will be hashed by your pre-save hook
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    console.log('Password reset successful for:', user.username);
    res.redirect('/login.html?reset=success');
  } catch (err) {
    console.error('Error resetting password:', err);
    res.redirect('/reset-password.html?error=server');
  }
});

module.exports = router;