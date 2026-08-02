const { z } = require('zod');
const { ACTION_ITEM_PRIORITIES, ACTION_ITEM_STATUSES } = require('../models/ActionItem');

const createActionItemSchema = z.object({
  meetingId: z.string().trim().min(1, 'Meeting ID is required'),
  description: z.string().trim().min(1, 'Description is required'),
  assignee: z.string().trim().optional().default('Unassigned'),
  dueDate: z
    .union([z.string(), z.date(), z.null()])
    .optional()
    .transform((val) => {
      if (!val || val === '') return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }),
  priority: z.enum(ACTION_ITEM_PRIORITIES).optional().default('Medium'),
  status: z.enum(ACTION_ITEM_STATUSES).optional().default('Open'),
});

const updateActionItemSchema = z.object({
  description: z.string().trim().min(1, 'Description cannot be empty').optional(),
  assignee: z.string().trim().optional(),
  dueDate: z
    .union([z.string(), z.date(), z.null()])
    .optional()
    .transform((val) => {
      if (val === null || val === '') return null;
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }),
  priority: z.enum(ACTION_ITEM_PRIORITIES).optional(),
  status: z.enum(ACTION_ITEM_STATUSES).optional(),
});

module.exports = {
  createActionItemSchema,
  updateActionItemSchema,
};
