const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { Meeting } = require('../src/models/Meeting');
const { ActionItem } = require('../src/models/ActionItem');

describe('Full End-to-End Integration Suite', () => {
  let userToken, userId;

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

    // Register User
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'E2E Tester',
      email: 'e2e@example.com',
      password: 'password123',
    });

    userToken = regRes.body.data.token;
    userId = regRes.body.data.user.id;
  });

  describe('Multi-Filter Search Endpoints', () => {
    beforeEach(async () => {
      // Seed Meetings
      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Sprint Sync Requirements',
          type: 'Requirement Discussion',
          transcript: 'Discussing requirements.',
        });

      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Sprint Retrospective',
          type: 'Retrospective',
          transcript: 'Discussing retro.',
        });

      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Client Demo Sync',
          type: 'Client Meeting',
          transcript: 'Client presentation.',
        });
    });

    it('should filter meetings by combined search and type filter', async () => {
      const res = await request(app)
        .get('/api/meetings?search=Sprint&type=Requirement Discussion')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.meetings.length).toBe(1);
      expect(res.body.data.meetings[0].title).toBe('Sprint Sync Requirements');
    });

    it('should filter action items by combined status, priority, and search', async () => {
      const mRes = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${userToken}`);
      const mId = mRes.body.data.meetings[0].id;

      await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          meetingId: mId,
          description: 'Fix authentication vulnerability in backend',
          status: 'Open',
          priority: 'High',
        });

      await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          meetingId: mId,
          description: 'Update UI styling colors',
          status: 'Open',
          priority: 'Low',
        });

      const res = await request(app)
        .get('/api/action-items?status=Open&priority=High&search=vulnerability')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.actionItems.length).toBe(1);
      expect(res.body.data.actionItems[0].description).toContain('authentication vulnerability');
    });
  });

  describe('Full End-to-End User Journey (Register -> AI -> Action Item -> Complete -> Delete)', () => {
    it('should execute the full application contract end-to-end', async () => {
      // 1. Authenticate via Login
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'e2e@example.com',
        password: 'password123',
      });
      expect(loginRes.statusCode).toBe(200);
      const token = loginRes.body.data.token;

      // 2. Create Meeting
      const meetingRes = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Q3 Architectural Planning',
          type: 'Project Meeting',
          transcript: 'Alice decided to complete database migrations. Bob will review PRs by tomorrow.',
        });
      expect(meetingRes.statusCode).toBe(201);
      const meetingId = meetingRes.body.data.meeting.id;

      // 3. Generate AI Insights
      const aiRes = await request(app)
        .post(`/api/meetings/${meetingId}/generate-ai`)
        .set('Authorization', `Bearer ${token}`);
      expect(aiRes.statusCode).toBe(200);
      expect(aiRes.body.data.meeting.ai.status).toBe('completed');
      expect(aiRes.body.data.actionItems.length).toBeGreaterThan(0);

      const createdActionItem = aiRes.body.data.actionItems[0];
      const actionItemId = createdActionItem.id || createdActionItem._id;

      // 4. Mark action item as Completed
      const updateRes = await request(app)
        .put(`/api/action-items/${actionItemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Completed' });
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.actionItem.status).toBe('Completed');

      // 5. Verify item no longer appears in overdue filter
      const overdueRes = await request(app)
        .get('/api/action-items?overdue=true')
        .set('Authorization', `Bearer ${token}`);
      expect(overdueRes.statusCode).toBe(200);
      const overdueIds = overdueRes.body.data.actionItems.map((a) => a.id || a._id);
      expect(overdueIds).not.toContain(actionItemId);

      // 6. Delete Meeting
      const deleteRes = await request(app)
        .delete(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteRes.statusCode).toBe(200);

      // 7. Verify cascade delete purged action items
      const remainingItems = await ActionItem.countDocuments({ meeting: meetingId });
      expect(remainingItems).toBe(0);
    });
  });
});
