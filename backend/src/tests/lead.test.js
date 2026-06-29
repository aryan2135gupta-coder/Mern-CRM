import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/mern_crm_test';

let adminToken;
let agentToken;
let adminUser;
let agentUser;
let testLeadId;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_MONGO_URI);

  // Clear DB collections
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({})
  ]);

  // Seed Admin
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin_test@crm.com',
    password: 'password123',
    role: 'admin'
  });

  // Seed Agent
  agentUser = await User.create({
    name: 'Agent User',
    email: 'agent_test@crm.com',
    password: 'password123',
    role: 'sales_agent'
  });

  // Logins to fetch tokens
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: adminUser.email, password: 'password123' });
  adminToken = adminLogin.body.token;

  const agentLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: agentUser.email, password: 'password123' });
  agentToken = agentLogin.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Leads API Endpoints', () => {
  it('should create a lead successfully as admin', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Doe',
        email: 'johndoe@test.com',
        phone: '1234567890',
        source: 'referral',
        status: 'new',
        assignedAgent: agentUser._id,
        notes: 'Initial discussion'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lead.name).toBe('John Doe');
    expect(res.body.data.lead.assignedAgent._id.toString()).toBe(agentUser._id.toString());
    testLeadId = res.body.data.lead._id;
  });

  it('should return a list of leads', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.leads)).toBe(true);
    expect(res.body.data.leads.length).toBeGreaterThan(0);
  });

  it('should restrict sales agents from deleting leads', async () => {
    const res = await request(app)
      .delete(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Only administrators can delete leads');
  });

  it('should allow admins to delete leads successfully', async () => {
    const res = await request(app)
      .delete(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted successfully');
  });
});
