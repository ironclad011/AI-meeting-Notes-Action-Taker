const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { Meeting } = require('../src/models/Meeting');
const { ActionItem } = require('../src/models/ActionItem');

describe('POST /api/meetings/:id/generate-ai', () => {
  let user1Token, user1Id;
  let user2Token;
  let meetingId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Meeting.deleteMany({});
    await ActionItem.deleteMany({});

    // User 1
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
    });
    user1Token = res1.body.data.token;
    user1Id = res1.body.data.user.id;

    // User 2
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
    });
    user2Token = res2.body.data.token;

    // Create Meeting for User 1
    const meetingRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Q3 Product Strategy Sync',
        type: 'Project Meeting',
        transcript: 'We decided to launch feature A by next month. Alice will write documentation. Any risks with DB capacity?',
      });

    meetingId = meetingRes.body.data.meeting.id;
  });

  it('should generate AI insights, update meeting.ai, and create ActionItems in DB', async () => {
    const res = await request(app)
      .post(`/api/meetings/${meetingId}/generate-ai`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.meeting.ai.status).toBe('completed');
    expect(res.body.data.meeting.ai.summary).toBeTruthy();
    expect(Array.isArray(res.body.data.meeting.ai.keyDiscussionPoints)).toBe(true);

    // Check ActionItems created in database
    const actionItemsInDb = await ActionItem.find({ meeting: meetingId, owner: user1Id });
    expect(actionItemsInDb.length).toBeGreaterThan(0);
    expect(actionItemsInDb[0].source).toBe('ai_generated');
    expect(actionItemsInDb[0].owner.toString()).toBe(user1Id);
  });

  it('should return 404 if User 2 attempts to generate AI insights for User 1 meeting', async () => {
    const res = await request(app)
      .post(`/api/meetings/${meetingId}/generate-ai`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
