import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/mern_crm_test';

beforeAll(async () => {
  // Clear any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test Administrator',
    email: 'test_admin@crm.com',
    password: 'password123',
    role: 'admin'
  };

  it('should sign up a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe('admin');
  });

  it('should not sign up a user with duplicate email', async () => {
    await User.create({
      ...testUser,
      role: 'admin'
    });

    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should login an existing user and set auth cookies', async () => {
    await User.create(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    
    // Verify cookies set
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some(c => c.includes('token='))).toBe(true);
  });

  it('should reject login with wrong password', async () => {
    await User.create(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return current user profile when authorized', async () => {
    const user = await User.create(testUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    const token = loginRes.body.token;

    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data.user.email).toBe(testUser.email);
  });
});
