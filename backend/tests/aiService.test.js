const { aiResponseSchema } = require('../src/schemas/aiResponseSchema');
const { generateMeetingInsights } = require('../src/services/aiService');

describe('AI Service & Schema Validation', () => {
  it('should validate a complete, correctly-shaped AI response', () => {
    const rawAiResponse = {
      summary: 'Project alignment meeting.',
      keyDiscussionPoints: ['Discussed Q3 deliverables.', 'Reviewed backend architecture.'],
      keyDecisions: ['Approved design system.'],
      actionItems: [
        {
          description: 'Deploy backend API to staging',
          assignee: 'Alice',
          dueDate: '2026-08-15T00:00:00.000Z',
          priority: 'High',
        },
        {
          description: 'Review database indexes',
          assignee: null,
          dueDate: null,
          priority: null,
        },
      ],
      risksOrConcerns: ['Third-party API rate limits.'],
      unansweredQuestions: ['Who will handle QA testing?'],
    };

    const validated = aiResponseSchema.parse(rawAiResponse);
    expect(validated.summary).toBe('Project alignment meeting.');
    expect(validated.keyDiscussionPoints.length).toBe(2);
    expect(validated.keyDecisions).toEqual(['Approved design system.']);
    expect(validated.actionItems[0].assignee).toBe('Alice');
    expect(validated.actionItems[1].assignee).toBe('Unassigned');
    expect(validated.actionItems[1].priority).toBe('Medium');
  });

  it('should accept an empty keyDecisions array (no invented decisions)', () => {
    const rawAiResponse = {
      summary: 'Introductory discussion without final decisions.',
      keyDiscussionPoints: ['Brainstorming session.'],
      keyDecisions: [],
      actionItems: [],
      risksOrConcerns: [],
      unansweredQuestions: [],
    };

    const validated = aiResponseSchema.parse(rawAiResponse);
    expect(validated.keyDecisions).toEqual([]);
  });

  it('should generate mock insights deterministically for sample transcript', async () => {
    const sampleTranscript = `
      We met today to discuss the Q3 product release.
      Alice agreed to complete the frontend components by Friday.
      Bob decided to refactor the database queries for performance.
      Are there any open questions regarding deployment?
    `;

    const insights = await generateMeetingInsights(sampleTranscript);
    expect(insights).toHaveProperty('summary');
    expect(insights).toHaveProperty('keyDiscussionPoints');
    expect(insights).toHaveProperty('keyDecisions');
    expect(insights).toHaveProperty('actionItems');
    expect(Array.isArray(insights.actionItems)).toBe(true);
  });
});
