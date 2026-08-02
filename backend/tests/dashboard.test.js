const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { Meeting } = require('../src/models/Meeting');
const { ActionItem } = require('../src/models/ActionItem');

describe('Dashboard Endpoints (/api/dashboard/summary)', () => {
  let user1Token, user1Id;
  let user2Token, user2Id;
  let meeting1Id;

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
    user2Id = res2.body.data.user.id;

    // Create 6 Meetings for User 1 with different dates
    for (let i = 1; i <= 6; i++) {
      const mRes = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: `User 1 Meeting ${i}`,
          type: 'Internal Meeting',
          date: new Date(2026, 7, i).toISOString(),
          transcript: `Transcript content for meeting ${i}`,
        });

      if (i === 1) {
        meeting1Id = mRes.body.data.meeting.id;
      }
    }

    // Create 1 Meeting for User 2
    await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        title: 'User 2 Secret Meeting',
        type: 'Client Meeting',
        transcript: 'Secret user 2 transcript',
      });

    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    // User 1 Action Items:
    // Item 1: Open & Overdue (past date)
    await request(app)
      .post('/api/action-items')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        meetingId: meeting1Id,
        description: 'User 1 Overdue Task',
        priority: 'High',
        status: 'Open',
        dueDate: pastDate,
      });

    // Item 2: Completed (past date - NOT overdue)
    await request(app)
      .post('/api/action-items')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        meetingId: meeting1Id,
        description: 'User 1 Completed Task',
        priority: 'Medium',
        status: 'Completed',
        dueDate: pastDate,
      });

    // Item 3: Open & Future date (NOT overdue)
    await request(app)
      .post('/api/action-items')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        meetingId: meeting1Id,
        description: 'User 1 Open Future Task',
        priority: 'Low',
        status: 'Open',
        dueDate: futureDate,
      });

    // User 2 Action Item (Must NOT be counted for User 1)
    const m2Res = await request(app)
      .get('/api/meetings')
      .set('Authorization', `Bearer ${user2Token}`);
    const u2MeetingId = m2Res.body.data.meetings[0].id;

    await request(app)
      .post('/api/action-items')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        meetingId: u2MeetingId,
        description: 'User 2 Task',
        status: 'Open',
      });
  });

  it('should return correct summary counts for authenticated user', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const { summary } = res.body.data;
    expect(summary.totalMeetings).toBe(6);
    expect(summary.totalActionItems).toBe(3);
    expect(summary.openActionItems).toBe(2);
    expect(summary.completedActionItems).toBe(1);
    expect(summary.overdueActionItems).toBe(1);
  });

  it('should isolate user data and not count other users data', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(200);
    const { summary } = res.body.data;
    expect(summary.totalMeetings).toBe(1);
    expect(summary.totalActionItems).toBe(1);
    expect(summary.openActionItems).toBe(1);
    expect(summary.completedActionItems).toBe(0);
    expect(summary.overdueActionItems).toBe(0);
  });

  it('should return at most 5 recent meetings ordered by date descending', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    const { recentMeetings } = res.body.data;
    expect(recentMeetings.length).toBe(5);

    // Check date descending order (most recent first)
    const dates = recentMeetings.map((m) => new Date(m.date).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });
});
