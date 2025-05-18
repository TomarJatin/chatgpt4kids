import { streamText } from 'ai';
import { myProvider } from '../providers';

interface TopicResult {
  name: string;
  relevance: number;
}

/**
 * Extracts main topics from conversation text using an LLM
 */
export async function extractTopicsFromConversation(
  conversationText: string
): Promise<TopicResult[]> {
  try {

    const { text } = await streamText({
      model: myProvider.languageModel('title-model'),
      system: `
Extract the 1–3 main topics from the following conversation.
Return the topics as a JSON array of objects with \"name\" and \"relevance\" properties.
Example format:
[
  {"name": "Dinosaurs", "relevance": 9},
  {"name": "Extinction", "relevance": 6}
]
Only include the core subjects discussed.
      `.trim(),
      prompt: conversationText,
    });

    console.log("this is my text: ", text)
    const responseText = await text;

    console.log("And this is the response :", responseText)
    const jsonMatch    = responseText.match(/\[[\s\S]*\]/);

    console.log("Json match: ", jsonMatch)
    if (!jsonMatch) {
      console.warn('No JSON array found in topic extraction response:', responseText);
      return [];
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed as TopicResult[] : [];
    } catch (parseError) {
      console.error('Failed to parse topics JSON:', parseError, 'response:', jsonMatch[0]);
      return [];
    }
  } catch (err) {
    console.error('Failed to extract topics:', err);
    return [];
  }
}
