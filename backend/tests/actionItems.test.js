const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { Meeting } = require('../src/models/Meeting');
const { ActionItem, isOverdue } = require('../src/models/ActionItem');

describe('Action Items Endpoints (/api/action-items)', () => {
  let user1Token, user1Id;
  let user2Token;
  let meeting1Id, meeting2Id;

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

    // User 1 Meeting
    const m1Res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Project Kickoff',
        type: 'Project Meeting',
        transcript: 'Initial discussion transcript.',
      });
    meeting1Id = m1Res.body.data.meeting.id;

    // User 2 Meeting
    const m2Res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        title: 'User 2 Meeting',
        type: 'Internal Meeting',
        transcript: 'User 2 transcript.',
      });
    meeting2Id = m2Res.body.data.meeting.id;
  });

  describe('Overdue Helper Logic (isOverdue)', () => {
    it('should flag an item with a past dueDate and status Open as overdue', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const item = { dueDate: pastDate, status: 'Open' };
      expect(isOverdue(item)).toBe(true);
    });

    it('should NOT flag an item with a past dueDate and status Completed as overdue', () => {
      const pastDate = new Date(Date.now() - 86400000);
      const item = { dueDate: pastDate, status: 'Completed' };
      expect(isOverdue(item)).toBe(false);
    });

    it('should NOT flag an item with dueDate null as overdue', () => {
      const item = { dueDate: null, status: 'Open' };
      expect(isOverdue(item)).toBe(false);
    });
  });

  describe('POST /api/action-items (Create)', () => {
    it('should create a manual action item attached to a meeting', async () => {
      const res = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          meetingId: meeting1Id,
          description: 'Deploy backend API to production',
          assignee: 'Alice',
          priority: 'High',
          status: 'Open',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.actionItem.description).toBe('Deploy backend API to production');
      expect(res.body.data.actionItem.source).toBe('manual');
      expect(res.body.data.actionItem.owner).toBe(user1Id);
    });

    it('should reject creation if description is missing', async () => {
      const res = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          meetingId: meeting1Id,
          description: '',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation if attaching to another user meeting', async () => {
      const res = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          meetingId: meeting2Id, // Owned by User 2
          description: 'Unauthorized action item',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/action-items (List & Filters)', () => {
    beforeEach(async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      // Item 1: High priority, Open, Overdue
      await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          meetingId: meeting1Id,
          description: 'Fix critical auth vulnerability',
          priority: 'High',
          status: 'Open',
          dueDate: pastDate,
        });

      // Item 2: Medium priority, Completed, Past date
      await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          meetingId: meeting1Id,
          description: 'Setup CI CD pipeline',
          priority: 'Medium',
          status: 'Completed',
          dueDate: pastDate,
        });

      // Item 3: Low priority, In Progress, Future date
      await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          meetingId: meeting1Id,
          description: 'Update API documentation',
          priority: 'Low',
          status: 'In Progress',
          dueDate: futureDate,
        });
    });

    it('should filter by combined status and priority', async () => {
      const res = await request(app)
        .get('/api/action-items?status=Open&priority=High')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.actionItems.length).toBe(1);
      expect(res.body.data.actionItems[0].description).toBe('Fix critical auth vulnerability');
    });

    it('should filter by combined search and status', async () => {
      const res = await request(app)
        .get('/api/action-items?search=documentation&status=In Progress')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.actionItems.length).toBe(1);
      expect(res.body.data.actionItems[0].description).toBe('Update API documentation');
    });

    it('should filter overdue items (overdue=true)', async () => {
      const res = await request(app)
        .get('/api/action-items?overdue=true')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.actionItems.length).toBe(1);
      expect(res.body.data.actionItems[0].description).toBe('Fix critical auth vulnerability');
    });
  });

  describe('PUT & DELETE /api/action-items/:id (Ownership & Cascade)', () => {
    let user1ItemId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          meetingId: meeting1Id,
          description: 'User 1 task',
          priority: 'Medium',
          status: 'Open',
        });
      user1ItemId = res.body.data.actionItem.id;
    });

    it('should allow User 1 to update their action item', async () => {
      const res = await request(app)
        .put(`/api/action-items/${user1ItemId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'Completed', priority: 'High' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.actionItem.status).toBe('Completed');
      expect(res.body.data.actionItem.priority).toBe('High');
    });

    it('should return 404 when User 2 tries to update User 1 action item', async () => {
      const res = await request(app)
        .put(`/api/action-items/${user1ItemId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'Completed' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when User 2 tries to delete User 1 action item', async () => {
      const res = await request(app)
        .delete(`/api/action-items/${user1ItemId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should cascade delete action items when meeting is deleted', async () => {
      // Confirm item exists before meeting delete
      const beforeCount = await ActionItem.countDocuments({ meeting: meeting1Id });
      expect(beforeCount).toBe(1);

      // Delete User 1 meeting
      await request(app)
        .delete(`/api/meetings/${meeting1Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Confirm item was cascade deleted
      const afterCount = await ActionItem.countDocuments({ meeting: meeting1Id });
      expect(afterCount).toBe(0);
    });
  });
});
