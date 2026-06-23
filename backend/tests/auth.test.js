import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

const validUser = { name: 'Alice', email: 'alice@example.com', password: 'secret123' };

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token (201)', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe('alice@example.com');
      // password must never be returned
      expect(res.body.user.password).toBeUndefined();
      // httpOnly cookie should be set
      expect(res.headers['set-cookie'][0]).toMatch(/token=/);
      expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
    });

    it('rejects duplicate email (409)', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid email format (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });

    it('rejects short password (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials (200)', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
    });

    it('rejects wrong password (401)', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'secret123' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the profile with a valid token (200)', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reg.body.token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('rejects when no token is provided (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
