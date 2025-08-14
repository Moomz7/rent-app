const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

mongoose.connect('mongodb+srv://moumiedibinga:tmiUoPH6d3yrbWSG@rent-app.21fte9i.mongodb.net/?retryWrites=true&w=majority&appName=rent-app');

const seedUsers = async () => {
  await User.deleteMany({}); // Clear existing users

  const users = [
    { username: 'tenant1', password: 'pass123', role: 'tenant' },
    { username: 'tenant2', password: 'pass456', role: 'tenant' },
    { username: 'landlord1', password: 'admin123', role: 'landlord' },
    { username: 'landlord2', password: 'admin456', role: 'landlord' }
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new User({
      username: userData.username,
      password: hashedPassword,
      role: userData.role
    });
    await user.save();
    console.log(`Created user: ${user.username} (${user.role})`);
  }

  mongoose.connection.close();
};

seedUsers();