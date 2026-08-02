const mongoose = require('mongoose');

const ACTION_ITEM_PRIORITIES = ['Low', 'Medium', 'High'];
const ACTION_ITEM_STATUSES = ['Open', 'In Progress', 'Blocked', 'Completed'];
const ACTION_ITEM_SOURCES = ['ai_generated', 'manual'];

const actionItemSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Action item description is required'],
      trim: true,
    },
    assignee: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: {
        values: ACTION_ITEM_PRIORITIES,
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: {
        values: ACTION_ITEM_STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'Open',
    },
    source: {
      type: String,
      enum: ACTION_ITEM_SOURCES,
      default: 'ai_generated',
    },
  },
  {
    timestamps: true,
  }
);

actionItemSchema.index({ owner: 1, status: 1 });
actionItemSchema.index({ owner: 1, dueDate: 1 });

actionItemSchema.methods.toJSON = function () {
  const item = this.toObject();
  item.id = item._id.toString();
  delete item.__v;
  return item;
};

const ActionItem = mongoose.model('ActionItem', actionItemSchema);

module.exports = {
  ActionItem,
  ACTION_ITEM_PRIORITIES,
  ACTION_ITEM_STATUSES,
  ACTION_ITEM_SOURCES,
};
