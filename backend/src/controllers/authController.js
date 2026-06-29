import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

const sendAuthResponse = (res, statusCode, user) => {
  const token = generateToken(user._id);

  res.cookie('token', token, cookieOptions());

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const [userExists, userCount] = await Promise.all([
      User.findOne({ email }),
      User.countDocuments()
    ]);

    if (userExists) {
      res.status(409);
      throw new Error('A user with this email already exists.');
    }

    const safeRole = userCount === 0 && role === 'admin' ? 'admin' : 'sales_agent';
    const user = await User.create({ name, email, password, role: safeRole });

    sendAuthResponse(res, 201, user);

    sendWelcomeEmail({
      to: user.email,
      userName: user.name,
      role: user.role
    }).catch((err) => console.error(`Error sending welcome email: ${err.message}`));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password.');
    }

    sendAuthResponse(res, 200, user);
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const getMe = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
};
