const express = require('express');
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  uploadTranscript,
  generateAiInsights,
} = require('../controllers/meetingController');
const { getActionItemsByMeeting } = require('../controllers/actionItemController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const uploadTranscriptMiddleware = require('../middleware/upload');
const {
  createMeetingSchema,
  updateMeetingSchema,
} = require('../schemas/meetingSchemas');

const router = express.Router();

// All meeting endpoints require authentication
router.use(authMiddleware);

router.post('/', validate(createMeetingSchema), createMeeting);
router.get('/', getMeetings);
router.get('/:id', getMeetingById);
router.get('/:meetingId/action-items', getActionItemsByMeeting);
router.put('/:id', validate(updateMeetingSchema), updateMeeting);
router.delete('/:id', deleteMeeting);
router.post('/:id/transcript-file', uploadTranscriptMiddleware, uploadTranscript);
router.post('/:id/generate-ai', generateAiInsights);

module.exports = router;
