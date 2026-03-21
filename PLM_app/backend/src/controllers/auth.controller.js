const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { JWT_SECRET } = require('../config/env');

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

const normalizeDbUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  passwordHash: user.passwordHash || user.password,
});

const findUserByEmailFallback = async (email) => {
  const rows = await prisma.$queryRaw`
    SELECT id, name, email, role, password_hash AS "passwordHash", created_at AS "createdAt"
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  return rows[0] || null;
};

const findUserByIdFallback = async (id) => {
  const rows = await prisma.$queryRaw`
    SELECT id, name, email, role, password_hash AS "passwordHash", created_at AS "createdAt"
    FROM users
    WHERE id = ${id}::uuid
    LIMIT 1
  `;
  return rows[0] || null;
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    let existing;
    try {
      existing = await prisma.user.findUnique({ where: { email } });
    } catch (_error) {
      existing = await findUserByEmailFallback(email);
    }
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          role: role || 'ENGINEERING',
        },
      });
    } catch (_error) {
      const rows = await prisma.$queryRaw`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (${name}, ${email}, ${hashed}, ${role || 'ENGINEERING'})
        RETURNING id, name, email, role, password_hash AS "passwordHash", created_at AS "createdAt"
      `;
      user = rows[0];
    }

    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('register error', error);
    return res.status(503).json({ error: 'Database unavailable. Check Supabase connection.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (_error) {
      user = await findUserByEmailFallback(email);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    const normalized = normalizeDbUser(user);
    const valid = await bcrypt.compare(password, normalized.passwordHash || '');
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(normalized);
    return res.json({ token, user: sanitizeUser(normalized) });
  } catch (error) {
    console.error('login error', error);
    return res.status(503).json({ error: 'Database unavailable. Check Supabase connection.' });
  }
};

const getMe = async (req, res) => {
  try {
    let user;
    try {
      user = await prisma.user.findUnique({ where: { id: req.user.id } });
    } catch (_error) {
      user = await findUserByIdFallback(req.user.id);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('getMe error', error);
    return res.status(503).json({ error: 'Database unavailable. Check Supabase connection.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
