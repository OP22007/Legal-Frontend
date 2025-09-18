import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  Content,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import pinecone from '@/lib/pinecone';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const MODEL_NAME = 'gemini-2.0-flash-exp';
const EMBEDDING_MODEL_NAME = 'text-embedding-004';
const PINECONE_INDEX_NAME = 'google-hackathon-768';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const generationConfig = {
  temperature: 0.3, // Lower temperature for more focused responses
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface ContextResult {
  context: string;
  sources: string[];
  relevanceScores: number[];
  totalChunks: number;
  debugInfo: any;
}

async function debugPineconeData(documentId: string, userId: string) {
  try {
    const pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);
    
    // Check total documents for user
    const statsResponse = await pineconeIndex.describeIndexStats();
    console.log('Index stats:', statsResponse);
    
    // Try to fetch any data for this document
    const testQuery = await pineconeIndex.query({
      topK: 3,
      vector: new Array(768).fill(0.1), // Dummy vector
      filter: {
        document_id: { $eq: documentId }
      },
      includeMetadata: true,
      includeValues: false
    });
    
    console.log(`Debug: Found ${testQuery.matches.length} total chunks for document ${documentId}`);
    testQuery.matches.forEach((match, i) => {
      console.log(`Chunk ${i}:`, {
        id: match.id,
        score: match.score,
        metadata_keys: Object.keys(match.metadata || {}),
        chunk_preview: (match.metadata as any)?.chunk_text?.substring(0, 100) + '...'
      });
    });
    
    return testQuery.matches;
  } catch (error) {
    console.error('Debug query failed:', error);
    return [];
  }
}

async function getContext(message: string, documentId: string, userId: string): Promise<ContextResult> {
  try {
    console.log(`\n=== CONTEXT RETRIEVAL DEBUG ===`);
    console.log(`Query: "${message}"`);
    console.log(`Document ID: ${documentId}`);
    console.log(`User ID: ${userId}`);
    
    // Debug: Check what data exists
    const debugMatches = await debugPineconeData(documentId, userId);
    
    // Generate embedding for the query using Google's embedding model
    const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });
    const embedding = await embeddingModel.embedContent(message);
    const queryVector = embedding.embedding.values;

    console.log(`Query vector dimension: ${queryVector?.length}`);

    if (!queryVector || queryVector.length === 0) {
      throw new Error('Failed to generate query embedding');
    }

    const pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);

    // First try: With user filter
    let queryResponse = await pineconeIndex.query({
      topK: 15, // Increased for better coverage
      vector: queryVector,
      filter: {
        document_id: { $eq: documentId },
        user_id: { $eq: userId }
      },
      includeMetadata: true,
      includeValues: false,
    });

    console.log(`First query (with user filter): ${queryResponse.matches.length} matches`);

    // Second try: Without user filter if no matches
    if (queryResponse.matches.length === 0) {
      console.log("No matches with user filter, trying without user filter...");
      queryResponse = await pineconeIndex.query({
        topK: 15,
        vector: queryVector,
        filter: {
          document_id: { $eq: documentId }
        },
        includeMetadata: true,
        includeValues: false,
      });
      console.log(`Second query (without user filter): ${queryResponse.matches.length} matches`);
    }

    // Third try: Even broader search if still no matches
    if (queryResponse.matches.length === 0) {
      console.log("Still no matches, trying with partial document ID match...");
      queryResponse = await pineconeIndex.query({
        topK: 10,
        vector: queryVector,
        // Try without any filter as last resort
        includeMetadata: true,
        includeValues: false,
      });
      
      // Filter results manually to match document
      queryResponse.matches = queryResponse.matches.filter(match => {
        const metadata = match.metadata as any;
        return metadata?.document_id === documentId;
      });
      
      console.log(`Third query (manual filter): ${queryResponse.matches.length} matches`);
    }

    if (queryResponse.matches.length === 0) {
      return {
        context: `No content found for document ID: ${documentId}. Please ensure the document has been properly processed and stored.`,
        sources: [],
        relevanceScores: [],
        totalChunks: 0,
        debugInfo: { totalDebugMatches: debugMatches.length, filters_tried: 3 }
      };
    }

    // Log all matches with their scores
    console.log('\n=== MATCH DETAILS ===');
    queryResponse.matches.forEach((match, i) => {
      console.log(`Match ${i + 1}: Score=${match.score?.toFixed(3)}, ID=${match.id}`);
      const metadata = match.metadata as any;
      if (metadata?.chunk_text) {
        console.log(`  Preview: ${metadata.chunk_text.substring(0, 150)}...`);
      }
    });

    // Use a lower threshold for relevance to capture more potential matches
    const relevanceThreshold = 0.15; // Lowered from 0.3
    const relevantMatches = queryResponse.matches
      .filter(match => (match.score || 0) > relevanceThreshold)
      .slice(0, 8); // Increased from 6

    console.log(`\nRelevant matches after filtering (threshold: ${relevanceThreshold}): ${relevantMatches.length}`);

    if (relevantMatches.length === 0) {
      // Show what was found but deemed irrelevant
      const topMatch = queryResponse.matches[0];
      const topScore = topMatch?.score || 0;
      
      return {
        context: `I found some content in the document, but it doesn't seem directly relevant to your question about "${message}". The most relevant section had a relevance score of ${(topScore * 100).toFixed(1)}%. Try asking a more specific question or use different keywords.`,
        sources: [],
        relevanceScores: [topScore],
        totalChunks: queryResponse.matches.length,
        debugInfo: { 
          topScore, 
          threshold: relevanceThreshold,
          allScores: queryResponse.matches.slice(0, 5).map(m => m.score)
        }
      };
    }

    // Build context with improved formatting
    const contextParts: string[] = [];
    const sources: string[] = [];
    const relevanceScores: number[] = [];

    relevantMatches.forEach((match, index) => {
      const metadata = match.metadata as any;
      const chunkText = metadata?.chunk_text || '';
      const chunkIndex = metadata?.chunk_index ?? index;
      const score = match.score || 0;
      const section = metadata?.document_section || `section_${Math.floor(chunkIndex / 5)}`;

      if (chunkText.trim()) {
        // Add more context markers
        contextParts.push(`[Document Section ${index + 1} - ${section}]\n${chunkText.trim()}\n[End Section ${index + 1}]`);
        sources.push(`${section} (chunk ${chunkIndex}, relevance: ${(score * 100).toFixed(1)}%)`);
        relevanceScores.push(score);
      }
    });

    const context = contextParts.join('\n\n');
    
    console.log(`\n=== FINAL CONTEXT ===`);
    console.log(`Context sections: ${contextParts.length}`);
    console.log(`Total context length: ${context.length} characters`);
    console.log(`Average relevance score: ${(relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length * 100).toFixed(1)}%`);

    return {
      context,
      sources,
      relevanceScores,
      totalChunks: queryResponse.matches.length,
      debugInfo: {
        relevanceThreshold,
        chunksAfterFiltering: relevantMatches.length,
        avgScore: relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
      }
    };

  } catch (error) {
    console.error('Error fetching context from Pinecone:', error);
    return {
      context: `Error fetching context: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      sources: [],
      relevanceScores: [],
      totalChunks: 0,
      debugInfo: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, documentId, history } = await req.json();

    if (!message || !documentId) {
      return NextResponse.json({ error: 'Message and documentId are required' }, { status: 400 });
    }

    console.log(`\n=== CHAT REQUEST ===`);
    console.log(`User: ${session.user.id}`);
    console.log(`Document: ${documentId}`);
    console.log(`Message: ${message}`);

    const contextResult = await getContext(message, documentId, session.user.id);

    // Enhanced error handling for context issues
    if (contextResult.context.includes("No content found") || 
        contextResult.context.includes("Error fetching context")) {
      return NextResponse.json({
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: contextResult.context,
        sources: [],
        confidence: 0,
        debug: contextResult.debugInfo
      });
    }

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig,
      safetySettings
    });

    // Process chat history
    const chatHistory: Content[] = (history || []).slice(-4).map((msg: { role: string; parts: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts }],
    }));

    // Enhanced prompt with better instructions
    const enhancedPrompt = `You are an expert legal document analyst. Your task is to answer questions based SOLELY on the provided document context.

CRITICAL INSTRUCTIONS:
1. ONLY use information from the DOCUMENT CONTEXT below
2. If the context contains relevant information, provide a detailed answer
3. If the context lacks information, clearly state what's missing
4. Be specific about which sections support your answer
5. Use clear, non-technical language
6. Highlight important implications or concerns

DOCUMENT CONTEXT (${contextResult.sources.length} sections found):
${contextResult.context}

CONVERSATION HISTORY:
${chatHistory.map(h => `${h.role}: ${h.parts[0].text}`).join('\n')}

CURRENT QUESTION: ${message}

Based on the document context above, please provide a comprehensive answer. If the context contains relevant information, explain it thoroughly. If not, be specific about what information is missing from the provided sections.`;

    console.log(`\n=== GENERATING AI RESPONSE ===`);
    console.log(`Prompt length: ${enhancedPrompt.length} characters`);
    console.log(`Context sections used: ${contextResult.sources.length}`);

    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;
    const text = response.text();

    // Calculate confidence
    const avgConfidence = contextResult.relevanceScores.length > 0 
      ? contextResult.relevanceScores.reduce((a, b) => a + b, 0) / contextResult.relevanceScores.length
      : 0;

    console.log(`Response generated: ${text.length} characters`);
    console.log(`Confidence: ${Math.round(avgConfidence * 100)}%`);

    return NextResponse.json({
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: text,
      sources: contextResult.sources,
      confidence: Math.round(avgConfidence * 100),
      context_sections_used: contextResult.sources.length,
      debug: {
        ...contextResult.debugInfo,
        total_chunks_found: contextResult.totalChunks,
        context_length: contextResult.context.length
      }
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        return NextResponse.json({ 
          error: 'API quota exceeded. Please try again later.' 
        }, { status: 429 });
      }
      if (error.message.includes('safety')) {
        return NextResponse.json({ 
          error: 'Content filtered for safety. Please rephrase your question.' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      error: 'Internal Server Error. Please try again.',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}