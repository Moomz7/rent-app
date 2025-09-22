const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

router.post('/signup', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const normalizedUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) return res.redirect('/signup.html?error=exists');

    const user = new User({ username: normalizedUsername, password, role });
    await user.save();
    console.log('User saved:', normalizedUsername);
    res.redirect('/login.html?signup=success');
  } catch (err) {
    console.error('Signup error:', err);
    res.redirect('/signup.html?error=server');
  }
});

module.exports = router;