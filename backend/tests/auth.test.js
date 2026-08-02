const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');

describe('Auth Endpoints (/api/auth)', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  const validUserData = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return user + token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(validUserData.email);
      expect(res.body.data.user.name).toBe(validUserData.name);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject registration if email is already registered', async () => {
      await request(app).post('/api/auth/register').send(validUserData);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(validUserData.email);
      expect(res.body.data.user.name).toBe(validUserData.name);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject registration if password is less than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short@example.com',
          password: 'short',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/at least 8 characters/i);
    });

    it('should reject registration if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'missingname@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUserData);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(validUserData.email);
    });

    it('should fail login with wrong password and return generic error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid credentials.');
    });

    it('should fail login with non-existent email and return generic error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid credentials.');
    });
  });

  describe('GET /api/auth/me', () => {
    let userToken;

    beforeEach(async () => {
      const regRes = await request(app).post('/api/auth/register').send(validUserData);
      userToken = regRes.body.data.token;
    });

    it('should return current user when presented with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUserData.email);
    });

    it('should return 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/unauthorized/i);
    });

    it('should return 401 when presented with a garbage token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_token_123');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/unauthorized/i);
    });
  });
});
