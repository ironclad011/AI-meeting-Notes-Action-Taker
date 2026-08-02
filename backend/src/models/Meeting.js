const mongoose = require('mongoose');

const MEETING_TYPES = [
  'Client Meeting',
  'Sales Meeting',
  'Project Meeting',
  'Internal Meeting',
  'Requirement Discussion',
  'Retrospective',
  'Other',
];

const meetingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Meeting date is required'],
      default: Date.now,
    },
    type: {
      type: String,
      enum: {
        values: MEETING_TYPES,
        message: '{VALUE} is not a valid meeting type',
      },
      default: 'Project Meeting',
    },
    participants: {
      type: [String],
      default: [],
    },
    transcript: {
      type: String,
      required: [true, 'Transcript is required'],
    },
    transcriptSource: {
      type: String,
      enum: ['pasted', 'uploaded'],
      default: 'pasted',
    },
    notes: {
      type: String,
      default: '',
    },
    ai: {
      status: {
        type: String,
        enum: ['not_started', 'processing', 'completed', 'failed'],
        default: 'not_started',
      },
      summary: { type: String, default: '' },
      keyDiscussionPoints: { type: [String], default: [] },
      keyDecisions: { type: [String], default: [] },
      risksOrConcerns: { type: [String], default: [] },
      unansweredQuestions: { type: [String], default: [] },
      rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
      generatedAt: { type: Date, default: null },
      error: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
meetingSchema.index({ owner: 1, date: -1 });
meetingSchema.index({ title: 'text' });

// Add custom toJSON method
meetingSchema.methods.toJSON = function () {
  const meeting = this.toObject();
  meeting.id = meeting._id.toString();
  delete meeting.__v;
  return meeting;
};

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = {
  Meeting,
  MEETING_TYPES,
};
