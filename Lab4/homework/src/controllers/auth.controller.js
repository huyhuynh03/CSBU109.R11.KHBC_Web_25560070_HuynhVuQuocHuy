const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/v1/auth/register
exports.register = async (req, res) => {
  const { fullName, age, gender, email, password, type = 'normal' } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'fullName, email and password are required' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  if (!['normal', 'admin'].includes(type)) {
    return res.status(400).json({ success: false, message: "type must be 'normal' or 'admin'" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ success: false, message: 'This email is already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    age,
    gender,
    email: normalizedEmail,
    passwordHash,
    type
  });

  res.status(201).json({ success: true, message: 'Account created successfully', data: user });
};

// POST /api/v1/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  const isMatch = user && await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, type: user.type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  res.json({ success: true, message: 'Login successful', token, data: user });
};

// GET /api/v1/auth/me
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: user no longer exists' });
  }
  res.json({ success: true, data: user });
};
