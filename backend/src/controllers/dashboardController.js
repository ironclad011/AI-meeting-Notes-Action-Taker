const mongoose = require('mongoose');
const { Meeting } = require('../models/Meeting');
const { ActionItem } = require('../models/ActionItem');

/**
 * @route GET /api/dashboard/summary
 * Scoped strictly to req.user.id
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();

    const [totalMeetings, recentMeetingsDocs, actionItemStatsArr] = await Promise.all([
      Meeting.countDocuments({ owner: userObjectId }),
      Meeting.find({ owner: userObjectId })
        .select('title date type ai.status createdAt')
        .sort({ date: -1 })
        .limit(5),
      ActionItem.aggregate([
        { $match: { owner: userObjectId } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            open: [{ $match: { status: 'Open' } }, { $count: 'count' }],
            completed: [{ $match: { status: 'Completed' } }, { $count: 'count' }],
            overdue: [
              { $match: { dueDate: { $lt: now }, status: { $ne: 'Completed' } } },
              { $count: 'count' },
            ],
          },
        },
      ]),
    ]);

    const statsFacet = actionItemStatsArr[0] || {};
    const totalActionItems = statsFacet.total?.[0]?.count || 0;
    const openActionItems = statsFacet.open?.[0]?.count || 0;
    const completedActionItems = statsFacet.completed?.[0]?.count || 0;
    const overdueActionItems = statsFacet.overdue?.[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalMeetings,
          totalActionItems,
          openActionItems,
          completedActionItems,
          overdueActionItems,
        },
        recentMeetings: recentMeetingsDocs.map((m) => m.toJSON()),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardSummary,
};
