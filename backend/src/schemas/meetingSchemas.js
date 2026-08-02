const { z } = require('zod');
const { MEETING_TYPES } = require('../models/Meeting');

const createMeetingSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  date: z.coerce.date().default(() => new Date()),
  type: z.enum(MEETING_TYPES).default('Project Meeting'),
  participants: z.array(z.string().trim()).default([]),
  transcript: z.string().min(1, 'Transcript is required'),
  transcriptSource: z.enum(['pasted', 'uploaded']).optional().default('pasted'),
  notes: z.string().optional().default(''),
});

const updateMeetingSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').optional(),
  date: z.coerce.date().optional(),
  type: z.enum(MEETING_TYPES).optional(),
  participants: z.array(z.string().trim()).optional(),
  transcript: z.string().min(1, 'Transcript cannot be empty').optional(),
  transcriptSource: z.enum(['pasted', 'uploaded']).optional(),
  notes: z.string().optional(),
});

module.exports = {
  createMeetingSchema,
  updateMeetingSchema,
};
