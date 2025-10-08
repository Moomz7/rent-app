require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const landlordRoutes = require('./routes/landlord');
const tenantRoutes = require('./routes/tenant');

const app = express();

// Middleware setup
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  console.log('Login attempt:', username);
  const user = await User.findOne({ username: username.trim().toLowerCase() });
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

// Role-based access middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login.html');
}

function ensureLandlord(req, res, next) {
  console.log('User:', req.user); // 👀 See what’s in the session
  if (req.isAuthenticated() && req.user.role === 'landlord') return next();
  res.redirect('/login.html');
}

function ensureTenant(req, res, next) {
  console.log('User:', req.user); // 👀 See what’s in the session
  if (req.isAuthenticated() && req.user.role === 'tenant') return next();
  res.redirect('/login.html');
}

// Routes
app.use('/', authRoutes);        // Handles login, registration, etc.
app.use('/', landlordRoutes);   // Handles landlord API routes

app.use('/', tenantRoutes);     // Handles tenant API routes

// Role-based dashboard access
app.get('/tenant-portal.html', ensureTenant, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tenant-portal.html'));
});

app.get('/landlord-dashboard.html', ensureLandlord, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landlord-dashboard.html'));
});

// Role-based redirect after login
app.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/login.html?error=invalid'
  }),
  (req, res) => {
    if (req.user.role === 'landlord') {
      res.redirect('/landlord-dashboard.html');
    } else {
      res.redirect('/tenant-portal.html');
    }
  }
);

// Logout route
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login.html?loggedOut=true');
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});