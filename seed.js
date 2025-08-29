const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config();
mongoose.connect(process.env.MONGO_URI);

const seedUsers = async () => {
  await User.deleteMany(); // Clear existing users

  const users = [
    { username: 'tenant1', password: 'pass123', role: 'tenant' },
    { username: 'tenant2', password: 'pass456', role: 'tenant' },
    { username: 'landlord1', password: 'admin123', role: 'landlord' },
    { username: 'landlord2', password: 'admin456', role: 'landlord' }
  ];

  for (const userData of users) {
    const user = new User({
      username: userData.username.toLowerCase(), // Normalize username
      password: userData.password,
      role: userData.role
    });
    await user.save();
    console.log(`Created user: ${user.username} (${user.role})`);
  }

  mongoose.connection.close();
};

seedUsers();