const express = require('express');
const passport = require('passport');
const router = express.Router();

router.post('/login', passport.authenticate('local'), (req, res) => {
  if (req.user.role === 'landlord') {
    res.redirect('/landlord-dashboard.html');
  } else if (req.user.role === 'tenant') {
    res.redirect('/tenant-portal.html');
  } else {
    res.redirect('/login.html?error=unknown-role');
  }
});

module.exports = router;