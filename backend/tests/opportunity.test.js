import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

async function registerUser(overrides = {}) {
  const user = {
    name: 'User',
    email: `u${Math.floor(performance.now() * 1000)}@example.com`,
    password: 'secret123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(user);
  return res.body.token;
}

const sampleOpportunity = {
  customerName: 'Acme Corp',
  contactName: 'Jane Doe',
  contactEmail: 'jane@acme.com',
  requirement: 'Needs a CRM integration',
  estimatedValue: 5000,
  stage: 'New',
  priority: 'High',
};

let tokenA;
let tokenB;

beforeEach(async () => {
  tokenA = await registerUser({ email: 'a@example.com' });
  tokenB = await registerUser({ email: 'b@example.com' });
});

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Opportunity API', () => {
  it('requires authentication (401)', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(401);
  });

  it('creates an opportunity with owner derived from the token (201)', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set(auth(tokenA))
      .send(sampleOpportunity);
    expect(res.status).toBe(201);
    expect(res.body.opportunity.customerName).toBe('Acme Corp');
    expect(res.body.opportunity.owner).toHaveProperty('name');
  });

  it('ignores owner/user_id/created_by from the request body', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set(auth(tokenA))
      .send({
        ...sampleOpportunity,
        owner: '000000000000000000000000',
        user_id: '000000000000000000000000',
        created_by: 'hacker',
      });
    expect(res.status).toBe(201);
    // owner must be the authenticated user (A), not the spoofed id
    const meA = await request(app).get('/api/auth/me').set(auth(tokenA));
    expect(res.body.opportunity.owner.email).toBe(meA.body.user.email);
  });

  it('validates required fields (400)', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set(auth(tokenA))
      .send({ contactName: 'No customer or requirement' });
    expect(res.status).toBe(400);
  });

  it('returns global pipeline stats aggregated across all owners', async () => {
    // User A: an open High deal (20000) and a Won deal (5000)
    await request(app)
      .post('/api/opportunities')
      .set(auth(tokenA))
      .send({ ...sampleOpportunity, estimatedValue: 20000, stage: 'Contacted', priority: 'High' });
    await request(app)
      .post('/api/opportunities')
      .set(auth(tokenA))
      .send({ ...sampleOpportunity, estimatedValue: 5000, stage: 'Won', priority: 'Low' });
    // User B: another open deal (10000)
    await request(app)
      .post('/api/opportunities')
      .set(auth(tokenB))
      .send({ ...sampleOpportunity, estimatedValue: 10000, stage: 'New', priority: 'Medium' });

    const res = await request(app).get('/api/opportunities/stats').set(auth(tokenB));
    expect(res.status).toBe(200);
    expect(res.body.stats.openPipelineValue).toBe(30000); // 20000 + 10000 (Won excluded)
    expect(res.body.stats.wonValue).toBe(5000);
    expect(res.body.stats.highPriorityCount).toBe(1);
    expect(res.body.stats.total).toBe(3);
  });

  it('lets all authenticated users view the shared pipeline', async () => {
    await request(app).post('/api/opportunities').set(auth(tokenA)).send(sampleOpportunity);
    const res = await request(app).get('/api/opportunities').set(auth(tokenB));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('filters to only the caller\'s own opportunities with ?mine=true', async () => {
    await request(app).post('/api/opportunities').set(auth(tokenA)).send(sampleOpportunity);
    await request(app).post('/api/opportunities').set(auth(tokenA)).send(sampleOpportunity);
    await request(app).post('/api/opportunities').set(auth(tokenB)).send(sampleOpportunity);

    // Without the filter, B sees the whole shared pipeline (3).
    const all = await request(app).get('/api/opportunities').set(auth(tokenB));
    expect(all.body.total).toBe(3);

    // With mine=true, B sees only their own (1) — derived from the JWT.
    const mineB = await request(app).get('/api/opportunities?mine=true').set(auth(tokenB));
    expect(mineB.body.total).toBe(1);
    const mineA = await request(app).get('/api/opportunities?mine=true').set(auth(tokenA));
    expect(mineA.body.total).toBe(2);
  });

  describe('ownership enforcement', () => {
    let oppId;
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set(auth(tokenA))
        .send(sampleOpportunity);
      oppId = res.body.opportunity.id;
    });

    it('allows the owner to update (200)', async () => {
      const res = await request(app)
        .put(`/api/opportunities/${oppId}`)
        .set(auth(tokenA))
        .send({ stage: 'Won', notes: 'Closed the deal' });
      expect(res.status).toBe(200);
      expect(res.body.opportunity.stage).toBe('Won');
    });

    it('forbids a non-owner from updating (403)', async () => {
      const res = await request(app)
        .put(`/api/opportunities/${oppId}`)
        .set(auth(tokenB))
        .send({ stage: 'Lost' });
      expect(res.status).toBe(403);
    });

    it('forbids a non-owner from deleting (403)', async () => {
      const res = await request(app)
        .delete(`/api/opportunities/${oppId}`)
        .set(auth(tokenB));
      expect(res.status).toBe(403);
    });

    it('allows the owner to delete (200)', async () => {
      const res = await request(app)
        .delete(`/api/opportunities/${oppId}`)
        .set(auth(tokenA));
      expect(res.status).toBe(200);
    });

    it('returns 404 for a non-existent opportunity', async () => {
      const res = await request(app)
        .put('/api/opportunities/000000000000000000000000')
        .set(auth(tokenA))
        .send({ stage: 'Won' });
      expect(res.status).toBe(404);
    });

    it('lets the owner add an activity note (201)', async () => {
      const res = await request(app)
        .post(`/api/opportunities/${oppId}/activity`)
        .set(auth(tokenA))
        .send({ text: 'Called the customer' });
      expect(res.status).toBe(201);
      expect(res.body.opportunity.activity).toHaveLength(1);
    });
  });
});
