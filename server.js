const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User'); // Adjust path if needed

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'yourSecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', authRoutes);

passport.use(new LocalStrategy(async (username, password, done) => {
  console.log('Login attempt:', username);
  const user = await User.findOne({ username: username.trim().toLocaleLowerCase() });
  if (!user) {
    console.log('User not found');
    return done(null, false);
  }
  const isValid = await user.isValidPassword(password);
  if (!isValid) {
    console.log('Invalid password');
    return done(null, false);
  }
  console.log('Login successful');
  return done(null, user);
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login.html');
}

const path = require('path');

app.get('/tenant-portal.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tenant-portal.html'));
});

require('dotenv').config();
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

function ensureLandlord(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'landlord') return next();
  res.redirect('/login.html');
}

app.get('/landlord-dashboard.html', ensureLandlord, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landlord-dashboard.html'));
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login.html');
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});