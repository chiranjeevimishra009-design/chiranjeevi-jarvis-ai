import OpenAI from 'openai';

const FALLBACK_TONE = {
  en: 'I am CHIRANJEEVI JARVIS AI, your personal assistant. I can help with daily tasks, reminders, notes, research, and conversations. Please continue the task and I will respond intelligently.',
  hi: 'मैं CHIRANJEEVI JARVIS AI हूँ। मैं आपकी दैनिक मदद, नोट्स, अनुसंधान और बातचीत में सहायता कर सकता हूँ। कृपया अपना कार्य बताइए, मैं तुरंत मदद करता हूँ।'
};

export async function generateAIReply(prompt: string, locale: string, history: string[] = []) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackReply(prompt, locale, history);
  }

  try {
    const client = new OpenAI({ apiKey });
    const messages = [
      {
        role: 'system' as const,
        content: `You are CHIRANJEEVI JARVIS AI, a helpful assistant for a user. Speak in ${locale === 'hi' ? 'Hindi' : 'English'} unless the user writes in another language. Keep answers concise, useful, and practical.`
      },
      ...history.slice(-6).map((entry) => ({
        role: 'user' as const,
        content: entry
      })),
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content?.trim() || fallbackReply(prompt, locale, history);
  } catch (error) {
    return fallbackReply(prompt, locale, history);
  }
}

function fallbackReply(prompt: string, locale: string, history: string[] = []) {
  const language = locale === 'hi' ? 'hi' : 'en';
  const promptText = prompt.trim();
  const base = FALLBACK_TONE[language as keyof typeof FALLBACK_TONE];

  if (!promptText) {
    return base;
  }

  const hint = history.length > 0 ? 'I remember the earlier context in this conversation.' : 'I am ready to help.';
  const userPrompt = promptText.length > 120 ? `${promptText.slice(0, 120)}...` : promptText;

  if (language === 'hi') {
    return `आपने कहा: “${userPrompt}”\n\n${hint}\n\nमैं इस विषय पर उपयोगी, संक्षिप्त और व्यावहारिक सहायता दे सकता हूँ। कृपया चाहें तो मैं आपको योजना, अनुस्मारक, कार्य सूची, हिन्दी में उत्तर, या नोट्स में बदल सकता हूँ।`;
  }

  return `You said: “${userPrompt}”\n\n${hint}\n\nI can help with this by providing a practical answer, task breakdown, summary, or follow-up suggestions.`;
}
