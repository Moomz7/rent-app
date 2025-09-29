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