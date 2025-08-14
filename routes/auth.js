const express = require('express');
const passport = require('passport');
const router = express.Router();

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/login.html?error=true',
}), (req, res) => {
  if (req.user.role === 'landlord') {
    res.redirect('/landlord.html');
  } else {
    res.redirect('/rent.html');
  }
});

module.exports = router;