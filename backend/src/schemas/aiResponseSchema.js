const { z } = require('zod');

const actionItemAiSchema = z.object({
  description: z.string().min(1, 'Action item description required'),
  assignee: z.string().nullable().optional().transform((val) => (val && val.trim() ? val.trim() : 'Unassigned')),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return null;
      const parsedDate = new Date(val);
      return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
    }),
  priority: z
    .enum(['Low', 'Medium', 'High'])
    .nullable()
    .optional()
    .transform((val) => val || 'Medium'),
});

const aiResponseSchema = z.object({
  summary: z.string().default('No summary generated.'),
  keyDiscussionPoints: z.array(z.string()).default([]),
  keyDecisions: z.array(z.string()).default([]),
  actionItems: z.array(actionItemAiSchema).default([]),
  risksOrConcerns: z.array(z.string()).default([]),
  unansweredQuestions: z.array(z.string()).default([]),
});

module.exports = {
  aiResponseSchema,
};
