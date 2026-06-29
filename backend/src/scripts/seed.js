import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';

const seedDatabase = async () => {
  await connectDB();

  await Promise.all([Activity.deleteMany(), Lead.deleteMany(), User.deleteMany()]);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@crm.com',
    password: 'password123',
    role: 'admin',
    isActive: true
  });

  const agent = await User.create({
    name: 'Sales Agent',
    email: process.env.SMTP_USER || 'agent@crm.com',
    password: 'password123',
    role: 'sales_agent',
    isActive: true
  });

  const leads = await Lead.create([
    {
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      phone: '+91 9876543210',
      source: 'website',
      status: 'new',
      assignedAgent: agent._id,
      notes: 'Interested in a product demo next week.',
      createdBy: admin._id
    },
    {
      name: 'Priya Mehta',
      email: 'priya@example.com',
      phone: '+91 9123456780',
      source: 'referral',
      status: 'contacted',
      assignedAgent: agent._id,
      notes: 'Asked for pricing details.',
      createdBy: admin._id
    },
    {
      name: 'Rohan Iyer',
      email: 'rohan@example.com',
      phone: '+91 9988776655',
      source: 'linkedin',
      status: 'converted',
      assignedAgent: agent._id,
      notes: 'Converted after follow-up call.',
      createdBy: admin._id
    }
  ]);

  await Activity.create(
    leads.map((lead) => ({
      lead: lead._id,
      user: admin._id,
      type: 'created',
      message: `Lead created and assigned to ${agent.name}`,
      metadata: { assignedAgent: agent._id }
    }))
  );

  console.log('Database seeded');
  console.log('Admin login: admin@crm.com / password123');
  console.log('Agent login: agent@crm.com / password123');

  await mongoose.connection.close();
};

seedDatabase().catch(async (error) => {
  console.error(error.message);
  await mongoose.connection.close();
  process.exit(1);
});
