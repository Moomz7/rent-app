const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

async function seedLandlords() {
  const landlords = [
    { username: 'landlord3', password: 'dashboard789' }
  ];

  for (const { username, password } of landlords) {
    const hashed = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { username },
      { username, password: hashed, role: 'landlord' },
      { upsert: true, new: true }
    );
    console.log(`Seeded landlord: ${username}`);
  }

  mongoose.connection.close();
}

seedLandlords();