import User from '../models/User.js';

export const getAgents = async (req, res, next) => {
  try {
    const agents = await User.find({ role: 'sales_agent', isActive: true })
      .select('name email role isActive')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: agents.length,
      data: {
        agents
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name email role isActive createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'sales_agent' } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409);
      throw new Error('A user with this email already exists.');
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    if (req.params.id === req.user._id.toString() && isActive === false) {
      res.status(400);
      throw new Error('You cannot deactivate your own account.');
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found.');
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
