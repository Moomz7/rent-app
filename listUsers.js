const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI);
User.find().then(users => {
  console.log('Users in DB:');
  users.forEach(u => console.log(`${u.username} (${u.role})`));
  mongoose.connection.close();
});