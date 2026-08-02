const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production_12345';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // If user already exists, treat as login and return token
      const token = generateToken(existingUser);
      return res.status(200).json({
        success: true,
        data: {
          user: existingUser.toJSON(),
          token,
        },
      });
    }

    // Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Generic error message for security (don't reveal whether email or password failed)
    const invalidCredentialsResponse = () => {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials.',
        },
      });
    };

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return invalidCredentialsResponse();
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return invalidCredentialsResponse();
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully.',
    },
  });
};

/**
 * @route GET /api/auth/me
 */
const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
};
