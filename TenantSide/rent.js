const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, enum: ['tenant', 'landlord'], required: true }
});

passport.use(new LocalStrategy(
  async (username, password, done) => {
    const user = await User.findOne({ username });
    if (!user || !validPassword(user, password)) return done(null, false);
    return done(null, user);
  }
));

app.post('/login', passport.authenticate('local'), (req, res) => {
  if (req.user.role === 'landlord') {
    res.redirect('/landlord-dashboard');
  } else {
    res.redirect('/tenant-portal');
  }
});

function ensureTenant(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'tenant') return next();
  res.redirect('/login');
}