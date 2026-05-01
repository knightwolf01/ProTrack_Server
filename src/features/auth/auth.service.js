const User = require('./user.model');
const jwt = require('jsonwebtoken');

const normalizeEmail = (email) => email.trim().toLowerCase();

const serializeUser = (user) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.signup = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new Error('Email already in use');
  const user = await User.create({ name, email: normalizedEmail, password });
  return { user: serializeUser(user), token: generateToken(user) };
};

exports.login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new Error('Invalid credentials');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Invalid credentials');
  return { user: serializeUser(user), token: generateToken(user) };
};

exports.serializeUser = serializeUser;
