const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('should return 200 OK with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('timestamp');
  });
});
