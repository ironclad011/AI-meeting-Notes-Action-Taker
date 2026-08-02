const { aiResponseSchema } = require('../schemas/aiResponseSchema');

class AiValidationFailedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiValidationFailedError';
  }
}

/**
 * Mock heuristic implementation for deterministic zero-key testing
 */
const generateMockInsights = (transcript) => {
  if (!transcript || transcript.trim() === '') {
    return {
      summary: 'Empty transcript provided.',
      keyDiscussionPoints: [],
      keyDecisions: [],
      actionItems: [],
      risksOrConcerns: [],
      unansweredQuestions: [],
    };
  }

  const cleanText = transcript.trim();
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Summary
  const firstSentence = sentences[0] || cleanText.substring(0, 100);
  const summary = `Meeting transcript overview: ${firstSentence} Detailed team sync covering progress updates and next steps.`;

  // Discussion points
  const keyDiscussionPoints = sentences.slice(0, Math.min(4, sentences.length));

  // Decisions (keywords: decided, agreed, approved, resolved)
  const decisionSentences = sentences.filter((s) =>
    /\b(decided|agreed|approved|resolved|conclusion|decide)\b/i.test(s)
  );
  const keyDecisions = decisionSentences.map((s) => s.replace(/^(decided|agreed|approved):\s*/i, '').trim());

  // Action items (keywords: action, will, todo, assigned, task)
  const actionSentences = sentences.filter((s) =>
    /\b(action|will|todo|assigned|need to|should|must|task)\b/i.test(s)
  );

  const actionItems = actionSentences.map((s) => {
    // Check if assignee mentioned e.g., "Alice will ..." or "Assigned to Bob"
    let assignee = 'Unassigned';
    const assigneeMatch = s.match(/([A-Z][a-z]+)\s+(?:will|to|is assigned)/);
    if (assigneeMatch && assigneeMatch[1]) {
      assignee = assigneeMatch[1];
    }

    return {
      description: s.replace(/^[-*•\d.\s]+/, '').trim(),
      assignee,
      dueDate: null,
      priority: 'Medium',
    };
  });

  // Risks (keywords: risk, concern, blocker, issue, delay, challenge)
  const riskSentences = sentences.filter((s) =>
    /\b(risk|concern|blocker|issue|delay|challenge|danger)\b/i.test(s)
  );
  const risksOrConcerns = riskSentences.map((s) => s.trim());

  // Questions (ending with ? or keyword question, tbd)
  const questionSentences = sentences.filter((s) =>
    s.endsWith('?') || /\b(question|tbd|unknown|unclear)\b/i.test(s)
  );
  const unansweredQuestions = questionSentences.map((s) => s.trim());

  return {
    summary,
    keyDiscussionPoints: keyDiscussionPoints.length > 0 ? keyDiscussionPoints : [cleanText.substring(0, 100)],
    keyDecisions, // Can be empty []
    actionItems,
    risksOrConcerns,
    unansweredQuestions,
  };
};

/**
 * Anthropic Claude API Implementation
 */
const generateAnthropicInsights = async (transcript, isRetry = false) => {
  const Anthropic = require('@anthropic-ai/sdk');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing in environment variables.');
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = `You are a strict JSON meeting intelligence assistant.
Your task is to analyze raw meeting transcripts and output structured JSON.
CRITICAL RULES:
1. Return ONLY valid JSON matching the schema below. Do NOT output markdown code fences (\`\`\`json), explanations, or extra text.
2. DO NOT invent decisions, action items, owners, or due dates not present in the transcript.
3. If no clear decision was made, return keyDecisions as an empty array [].
4. If an owner/assignee is not stated, set assignee to null. If due date is not stated, set dueDate to null.

SCHEMA:
{
  "summary": "High level summary string",
  "keyDiscussionPoints": ["point 1", "point 2"],
  "keyDecisions": ["decision 1"],
  "actionItems": [
    {
      "description": "action description",
      "assignee": "Name or null",
      "dueDate": "YYYY-MM-DD or null",
      "priority": "Low" | "Medium" | "High" | null
    }
  ],
  "risksOrConcerns": ["risk 1"],
  "unansweredQuestions": ["question 1"]
}`;

  let prompt = `Analyze this transcript:\n\n${transcript}`;
  if (isRetry) {
    prompt += `\n\nREMINDER: Your previous response was invalid. Return strictly valid raw JSON without any markdown formatting or surrounding text.`;
  }

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  const cleanedJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleanedJson);
};

/**
 * Gemini API Implementation (if process.env.AI_PROVIDER === 'gemini')
 */
const generateGeminiInsights = async (transcript, isRetry = false) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables.');
  }

  const promptText = `You are a strict JSON meeting analyzer. Analyze this transcript and return raw JSON matching:
{
  "summary": "string",
  "keyDiscussionPoints": ["string"],
  "keyDecisions": ["string"],
  "actionItems": [{"description": "string", "assignee": "string or null", "dueDate": "string or null", "priority": "Low|Medium|High|null"}],
  "risksOrConcerns": ["string"],
  "unansweredQuestions": ["string"]
}
Do not invent facts. Return keyDecisions as [] if none made. Do not use markdown fences.

TRANSCRIPT:
${transcript}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini API HTTP error ${res.status}`);
  }

  const data = await res.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) throw new Error('Empty response from Gemini API');
  const cleaned = textContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
};

/**
 * Main exported service function
 */
const generateMeetingInsights = async (transcript) => {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();

  const getRawData = async (isRetry = false) => {
    if (provider === 'anthropic') {
      return await generateAnthropicInsights(transcript, isRetry);
    } else if (provider === 'gemini') {
      return await generateGeminiInsights(transcript, isRetry);
    } else {
      return generateMockInsights(transcript);
    }
  };

  // First Attempt
  try {
    const rawData = await getRawData(false);
    return aiResponseSchema.parse(rawData);
  } catch (err1) {
    console.warn(`[aiService] First AI generation attempt failed validation: ${err1.message}`);

    // Retry once with stricter reminder (if external API)
    if (provider === 'anthropic' || provider === 'gemini') {
      try {
        const retryData = await getRawData(true);
        return aiResponseSchema.parse(retryData);
      } catch (err2) {
        console.error(`[aiService] Second AI generation attempt failed validation: ${err2.message}`);
        throw new AiValidationFailedError(`AI output failed schema validation: ${err2.message}`);
      }
    } else {
      throw new AiValidationFailedError(`Mock AI output failed schema validation: ${err1.message}`);
    }
  }
};

module.exports = {
  generateMeetingInsights,
  AiValidationFailedError,
};
