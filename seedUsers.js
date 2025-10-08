const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Remove existing users
  await User.deleteMany({});

  // Create landlords
  const landlords = [
    { username: 'landlord1', password: 'password123', role: 'landlord' },
    { username: 'landlord2', password: 'password123', role: 'landlord' }
  ];

  // Create tenants
  const tenants = [
    {
      username: 'tenant1',
      password: 'password123',
      role: 'tenant',
      monthlyRent: 1200,
      leaseStart: new Date('2024-01-01')
    },
    {
      username: 'tenant2',
      password: 'password123',
      role: 'tenant',
      monthlyRent: 1500,
      leaseStart: new Date('2024-06-01')
    }
  ];

  await User.insertMany([...landlords, ...tenants]);
  console.log('Seeded landlords and tenants!');
  mongoose.disconnect();
}

seed();
