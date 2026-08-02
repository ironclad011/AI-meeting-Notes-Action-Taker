const { Meeting } = require('../models/Meeting');
const { ActionItem } = require('../models/ActionItem');
const { generateMeetingInsights } = require('../services/aiService');

/**
 * @route POST /api/meetings
 */
const createMeeting = async (req, res, next) => {
  try {
    const meetingData = {
      ...req.body,
      owner: req.user.id,
    };

    const meeting = await Meeting.create(meetingData);

    res.status(201).json({
      success: true,
      data: {
        meeting: meeting.toJSON(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/meetings
 * Supports query params: search, type, page, limit
 */
const getMeetings = async (req, res, next) => {
  try {
    const { search, type, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Filter to current user's meetings only
    const query = { owner: req.user.id };

    if (type) {
      query.type = type;
    }

    if (search && search.trim() !== '') {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const [meetings, total] = await Promise.all([
      Meeting.find(query).sort({ date: -1 }).skip(skip).limit(limitNum),
      Meeting.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: {
        meetings: meetings.map((m) => m.toJSON()),
        pagination: {
          total,
          page: pageNum,
          pages,
          limit: limitNum,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/meetings/:id
 */
const getMeetingById = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }

    // Fetch action items for this meeting
    const actionItems = await ActionItem.find({
      meeting: meeting._id,
      owner: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        meeting: meeting.toJSON(),
        actionItems: actionItems.map((a) => a.toJSON()),
      },
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }
    next(err);
  }
};

/**
 * @route PUT /api/meetings/:id
 */
const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }

    Object.assign(meeting, req.body);
    await meeting.save();

    res.status(200).json({
      success: true,
      data: {
        meeting: meeting.toJSON(),
      },
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }
    next(err);
  }
};

/**
 * @route DELETE /api/meetings/:id
 */
const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }

    // Cascade delete ActionItems for this meeting
    await ActionItem.deleteMany({ meeting: meeting._id });

    res.status(200).json({
      success: true,
      data: {
        message: 'Meeting deleted successfully.',
      },
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }
    next(err);
  }
};

/**
 * @route POST /api/meetings/:id/transcript-file
 */
const uploadTranscript = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }

    const fileName = req.file.originalname.toLowerCase();
    let textContent = '';

    if (fileName.endsWith('.pdf')) {
      const pdfParseModule = require('pdf-parse');
      const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule.default || pdfParseModule);
      const pdfData = await pdfParse(req.file.buffer);
      textContent = pdfData.text;
    } else if (fileName.endsWith('.docx')) {
      const mammoth = require('mammoth');
      const docxResult = await mammoth.extractRawText({ buffer: req.file.buffer });
      textContent = docxResult.value;
    } else {
      textContent = req.file.buffer.toString('utf-8');
    }

    if (!textContent || textContent.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Uploaded file is empty or contains no extractable text.',
        },
      });
    }

    meeting.transcript = textContent.trim();
    meeting.transcriptSource = 'uploaded';
    await meeting.save();

    res.status(200).json({
      success: true,
      data: {
        meeting: meeting.toJSON(),
      },
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }
    next(err);
  }
};

/**
 * @route POST /api/meetings/:id/generate-ai
 */
const generateAiInsights = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }

    // Update status to processing
    meeting.ai.status = 'processing';
    meeting.ai.error = null;
    await meeting.save();

    try {
      const insights = await generateMeetingInsights(meeting.transcript);

      // Save insights to meeting.ai
      meeting.ai.summary = insights.summary;
      meeting.ai.keyDiscussionPoints = insights.keyDiscussionPoints || [];
      meeting.ai.keyDecisions = insights.keyDecisions || [];
      meeting.ai.risksOrConcerns = insights.risksOrConcerns || [];
      meeting.ai.unansweredQuestions = insights.unansweredQuestions || [];
      meeting.ai.rawResponse = insights;
      meeting.ai.generatedAt = new Date();
      meeting.ai.status = 'completed';
      meeting.ai.error = null;

      await meeting.save();

      // Delete old AI-generated ActionItems for this meeting before inserting fresh ones
      await ActionItem.deleteMany({ meeting: meeting._id, source: 'ai_generated' });

      // Insert ActionItems returned by AI
      let createdActionItems = [];
      if (insights.actionItems && insights.actionItems.length > 0) {
        const actionItemDocs = insights.actionItems.map((item) => ({
          meeting: meeting._id,
          owner: req.user.id,
          description: item.description,
          assignee: item.assignee || 'Unassigned',
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          priority: item.priority || 'Medium',
          status: 'Open',
          source: 'ai_generated',
        }));

        createdActionItems = await ActionItem.insertMany(actionItemDocs);
      }

      res.status(200).json({
        success: true,
        data: {
          meeting: meeting.toJSON(),
          actionItems: createdActionItems.map((a) => a.toJSON()),
        },
      });
    } catch (aiErr) {
      console.error(`[generateAiInsights] AI generation failed:`, aiErr);
      meeting.ai.status = 'failed';
      meeting.ai.error = 'Failed to generate AI insights. Please try again.';
      await meeting.save();

      return res.status(400).json({
        success: false,
        error: {
          message: 'Failed to generate AI insights. Please verify transcript content and try again.',
        },
      });
    }
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found.',
        },
      });
    }
    next(err);
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  uploadTranscript,
  generateAiInsights,
};
