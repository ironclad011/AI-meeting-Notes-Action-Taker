const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { Meeting } = require('../src/models/Meeting');

describe('Meeting Endpoints (/api/meetings)', () => {
  let user1Token, user1Id;
  let user2Token, user2Id;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Meeting.deleteMany({});

    // Register User 1
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
    });
    user1Token = res1.body.data.token;
    user1Id = res1.body.data.user.id;

    // Register User 2
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
    });
    user2Token = res2.body.data.token;
    user2Id = res2.body.data.user.id;
  });

  const validMeetingPayload = {
    title: 'Sprint Planning Meeting',
    date: new Date().toISOString(),
    type: 'Project Meeting',
    participants: ['Alice', 'Bob'],
    transcript: 'Discussion about upcoming sprint backlog items and priorities.',
  };

  describe('POST /api/meetings', () => {
    it('should create a meeting successfully with valid input', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(validMeetingPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meeting.title).toBe(validMeetingPayload.title);
      expect(res.body.data.meeting.owner).toBe(user1Id);
    });

    it('should reject creation if title is missing', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ ...validMeetingPayload, title: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation if meeting type is invalid', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ ...validMeetingPayload, type: 'Invalid Type Name' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation if transcript is empty', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ ...validMeetingPayload, transcript: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/meetings', () => {
    beforeEach(async () => {
      // User 1 meetings
      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Q3 Strategy Meeting',
          type: 'Sales Meeting',
          transcript: 'Sales roadmap strategy.',
        });

      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Design Critique',
          type: 'Project Meeting',
          transcript: 'UI UX design review.',
        });

      // User 2 meeting
      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'User Two Meeting',
          type: 'Internal Meeting',
          transcript: 'Private notes for user 2.',
        });
    });

    it('should only return meetings owned by the authenticated user', async () => {
      const res = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meetings.length).toBe(2);
      expect(res.body.data.meetings.every((m) => m.owner === user1Id)).toBe(true);
    });

    it('should filter meetings by search keyword', async () => {
      const res = await request(app)
        .get('/api/meetings?search=Strategy')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.meetings.length).toBe(1);
      expect(res.body.data.meetings[0].title).toBe('Q3 Strategy Meeting');
    });

    it('should filter meetings by type', async () => {
      const res = await request(app)
        .get('/api/meetings?type=Project Meeting')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.meetings.length).toBe(1);
      expect(res.body.data.meetings[0].title).toBe('Design Critique');
    });
  });

  describe('Ownership Enforcement (GET / PUT / DELETE /:id)', () => {
    let meetingUser1Id;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(validMeetingPayload);
      meetingUser1Id = res.body.data.meeting.id;
    });

    it('should allow User 1 to fetch their own meeting', async () => {
      const res = await request(app)
        .get(`/api/meetings/${meetingUser1Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.meeting.id).toBe(meetingUser1Id);
    });

    it('should return 404 when User 2 tries to fetch User 1 meeting', async () => {
      const res = await request(app)
        .get(`/api/meetings/${meetingUser1Id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when User 2 tries to update User 1 meeting', async () => {
      const res = await request(app)
        .put(`/api/meetings/${meetingUser1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Hacked Title' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when User 2 tries to delete User 1 meeting', async () => {
      const res = await request(app)
        .delete(`/api/meetings/${meetingUser1Id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/meetings/:id/transcript-file (File Upload)', () => {
    let meetingId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(validMeetingPayload);
      meetingId = res.body.data.meeting.id;
    });

    it('should accept a valid .txt file and update transcript', async () => {
      const fileBuffer = Buffer.from('Uploaded text content from file.');

      const res = await request(app)
        .post(`/api/meetings/${meetingId}/transcript-file`)
        .set('Authorization', `Bearer ${user1Token}`)
        .attach('file', fileBuffer, 'transcript.txt');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meeting.transcript).toBe('Uploaded text content from file.');
      expect(res.body.data.meeting.transcriptSource).toBe('uploaded');
    });

    it('should reject non-.txt file upload (e.g. .pdf or .png)', async () => {
      const fileBuffer = Buffer.from('PDF binary content');

      const res = await request(app)
        .post(`/api/meetings/${meetingId}/transcript-file`)
        .set('Authorization', `Bearer ${user1Token}`)
        .attach('file', fileBuffer, 'document.pdf');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/only plain text \(\.txt\) files are allowed/i);
    });

    it('should reject file upload that exceeds 2MB size cap', async () => {
      // 2.5MB buffer
      const largeBuffer = Buffer.alloc(2.5 * 1024 * 1024, 'a');

      const res = await request(app)
        .post(`/api/meetings/${meetingId}/transcript-file`)
        .set('Authorization', `Bearer ${user1Token}`)
        .attach('file', largeBuffer, 'large_file.txt');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/maximum limit of 2MB/i);
    });
  });
});
