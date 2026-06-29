export const getLeadAiInsights = async ({ name, status, notes, tasks = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      summary: 'AI insights are currently unavailable because the Gemini API Key is not configured in the backend .env file.',
      score: 'warm',
      nextSteps: 'Please ask your administrator to configure GEMINI_API_KEY to enable automated lead qualifications.'
    };
  }

  const prompt = `
    You are a professional CRM sales assistant. Analyze the following lead details:
    Lead Name: ${name}
    Current Pipeline Status: ${status}
    Conversation Notes: ${notes || 'None'}
    Tasks: ${tasks.map(t => `${t.title} (Completed: ${t.isCompleted})`).join(', ') || 'None'}

    Provide a JSON response with exactly three keys:
    1. "summary": A brief 1-2 sentence summary of this lead's state.
    2. "score": Classify the lead as "hot", "warm", or "cold" based on their interest level and task completion.
    3. "nextSteps": A single actionable next step for the sales agent.

    Do not include any markdown styling like \`\`\`json or backticks. Return the raw JSON string only.
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    
    // Clean JSON output in case Gemini wrapped it in markdown code block
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(cleanText);
    return {
      summary: parsed.summary || 'Summary unavailable.',
      score: ['hot', 'warm', 'cold'].includes(parsed.score?.toLowerCase()) ? parsed.score.toLowerCase() : 'warm',
      nextSteps: parsed.nextSteps || 'Review lead details manually.'
    };
  } catch (error) {
    console.error('Error fetching Gemini AI insights:', error.message);
    return {
      summary: 'Failed to analyze lead notes using Gemini AI.',
      score: 'warm',
      nextSteps: 'Review conversation logs and tasks manually.'
    };
  }
};
