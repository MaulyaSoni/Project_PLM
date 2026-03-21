const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { JWT_SECRET } = require('../config/env');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ['ADMIN', 'ENGINEERING', 'APPROVER', 'OPERATIONS'];

const serverError = (res, error) => {
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (error.message || 'Internal server error');
  return res.status(500).json({ error: message });
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' },
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedName || normalizedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    if (normalizedName.length > 255) return res.status(400).json({ error: 'Name must be at most 255 characters' });
    if (!EMAIL_REGEX.test(normalizedEmail)) return res.status(400).json({ error: 'Please enter a valid email address' });
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const requestedRole = role || 'ENGINEERING';
    if (!ALLOWED_ROLES.includes(requestedRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashed,
        role: requestedRole,
      },
    });

    const token = signToken(user);
    return res.status(201).json({
      data: { token, user: sanitizeUser(user) },
      message: 'User registered successfully',
    });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Email already registered' });
    return serverError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    if (!EMAIL_REGEX.test(email)) return res.status(401).json({ error: 'Invalid credentials' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({
      data: { token, user: sanitizeUser(user) },
      message: 'Login successful',
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ data: sanitizeUser(user) });
  } catch (error) {
    return serverError(res, error);
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return res.json({
      data: sanitizeUser(user),
      message: 'User role updated successfully',
    });
  } catch (error) {
    return serverError(res, error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateUserRole,
};
