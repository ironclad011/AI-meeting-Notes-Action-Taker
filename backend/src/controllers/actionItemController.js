const { ActionItem } = require('../models/ActionItem');
const { Meeting } = require('../models/Meeting');

/**
 * @route POST /api/action-items
 */
const createActionItem = async (req, res, next) => {
  try {
    const { meetingId, description, assignee, dueDate, priority, status } = req.body;

    // Verify meeting exists and belongs to current user
    const meeting = await Meeting.findOne({
      _id: meetingId,
      owner: req.user.id,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found or unauthorized.',
        },
      });
    }

    const actionItem = await ActionItem.create({
      meeting: meeting._id,
      owner: req.user.id,
      description,
      assignee: assignee || 'Unassigned',
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      status: status || 'Open',
      source: 'manual',
    });

    const populatedItem = await ActionItem.findById(actionItem._id).populate('meeting', 'title date type');

    res.status(201).json({
      success: true,
      data: {
        actionItem: populatedItem.toJSON(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/action-items
 * Query params: status, priority, assignee, dueBefore, overdue, search, meetingId, page, limit
 */
const getActionItems = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      assignee,
      dueBefore,
      overdue,
      search,
      meetingId,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Scoped strictly to current user
    const filter = { owner: req.user.id };

    if (meetingId) {
      filter.meeting = meetingId;
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignee && assignee.trim() !== '') {
      filter.assignee = { $regex: assignee.trim(), $options: 'i' };
    }

    if (dueBefore) {
      filter.dueDate = { $lte: new Date(dueBefore) };
    }

    if (overdue === 'true' || overdue === true) {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'Completed' };
    }

    if (search && search.trim() !== '') {
      filter.description = { $regex: search.trim(), $options: 'i' };
    }

    const [items, total] = await Promise.all([
      ActionItem.find(filter)
        .populate('meeting', 'title date type')
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ActionItem.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: {
        actionItems: items.map((i) => i.toJSON()),
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
 * @route GET /api/action-items/:id
 */
const getActionItemById = async (req, res, next) => {
  try {
    const item = await ActionItem.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).populate('meeting', 'title date type');

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Action item not found.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        actionItem: item.toJSON(),
      },
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Action item not found.',
        },
      });
    }
    next(err);
  }
};

/**
 * @route PUT /api/action-items/:id
 */
const updateActionItem = async (req, res, next) => {
  try {
    const item = await ActionItem.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Action item not found.',
        },
      });
    }

    const { description, assignee, dueDate, priority, status } = req.body;
    if (description !== undefined) item.description = description;
    if (assignee !== undefined) item.assignee = assignee;
    if (dueDate !== undefined) item.dueDate = dueDate;
    if (priority !== undefined) item.priority = priority;
    if (status !== undefined) item.status = status;

    await item.save();
    const updated = await ActionItem.findById(item._id).populate('meeting', 'title date type');

    res.status(200).json({
      success: true,
      data: {
        actionItem: updated.toJSON(),
      },
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Action item not found.',
        },
      });
    }
    next(err);
  }
};

/**
 * @route DELETE /api/action-items/:id
 */
const deleteActionItem = async (req, res, next) => {
  try {
    const item = await ActionItem.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Action item not found.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Action item deleted successfully.',
      },
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Action item not found.',
        },
      });
    }
    next(err);
  }
};

/**
 * @route GET /api/meetings/:meetingId/action-items
 */
const getActionItemsByMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.meetingId,
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

    const items = await ActionItem.find({
      meeting: meeting._id,
      owner: req.user.id,
    })
      .populate('meeting', 'title date type')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        actionItems: items.map((i) => i.toJSON()),
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

module.exports = {
  createActionItem,
  getActionItems,
  getActionItemById,
  updateActionItem,
  deleteActionItem,
  getActionItemsByMeeting,
};
