import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export interface TopicData {
  name: string;
  relevance: number;
}

/**
 * Extracts topics from a conversation using AI
 * @param transcript The conversation transcript to analyze
 * @returns An array of topics with relevance scores
 */
export async function extractTopicsFromConversation(transcript: string): Promise<TopicData[]> {
  console.log('► Extracting topics from conversation:', transcript);
  // If transcript is too long, truncate it
  const maxLength = 4000;
  const processedTranscript = transcript.length > maxLength 
    ? transcript.substring(0, maxLength) + "..." 
    : transcript;

  try {
    // Use generateText with the AI model to extract topics (non-streaming)
    const result = await generateText({
      model: myProvider.languageModel('chat-model-large'),
      system: `You are a helpful AI assistant that extracts the main topics from conversations.
        Extract the key topics from the provided conversation. For each topic:
        1. Identify the topic name (keep it concise, 1-3 words max)
        2. Assign a relevance score from 0 to 1 (where 1 is highly relevant)
        3. Focus on educational, age-appropriate topics for children
        4. AVOID any sensitive, political, or inappropriate topics
        5. Return a maximum of 5 topics
        
        Return your answer in the following JSON format:
        [{"name": "topic1", "relevance": 0.9}, {"name": "topic2", "relevance": 0.7}]
        
        Your response must be valid JSON and nothing else.`,
      messages: [
        {
          role: 'user',
          content: `Extract topics from this conversation:\n\n${processedTranscript}`
        }
      ],
    });

    // The result is available immediately (no streaming)
    const responseText = result.text;
    console.log('► Response text:', responseText);

    // Parse the response
    // Find JSON in the response by looking for content between [ and ]
    const jsonMatch = responseText.match(/\[.*\]/s);
    
    if (!jsonMatch) {
      console.error('No JSON found in topic extraction response:', responseText);
      return [];
    }

    const jsonResponse = jsonMatch[0];
    const topics = JSON.parse(jsonResponse) as TopicData[];
    console.log('► Topics:', topics);
    
    // Validate and filter topics
    return topics
      .filter(topic => 
        topic && 
        typeof topic.name === 'string' && 
        typeof topic.relevance === 'number' &&
        topic.name.trim().length > 0
      )
      .map(topic => ({
        name: topic.name.trim(),
        relevance: Math.max(0, Math.min(1, topic.relevance)) // Ensure relevance is between 0 and 1
      }))
      .sort((a, b) => b.relevance - a.relevance) // Sort by relevance (highest first)
      .slice(0, 5); // Take at most 5 topics
      
  } catch (error) {
    console.error('Error extracting topics:', error);
    return [];
  }
} 