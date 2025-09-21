
import { NextRequest, NextResponse } from 'next/server';
import {prisma}  from '@/lib/db';
import { auth } from '@/lib/auth'; 
import { Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

// POST handler for sending a message
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { message, document_id: documentId } = body;

    if (!message || !documentId) {
      return NextResponse.json({ error: 'Message and document_id are required' }, { status: 400 });
    }

    // 1. Find or create a chat session
    let chatSession = await prisma.chatSession.findFirst({
      where: {
        userId,
        documentId,
      },
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId,
          documentId,
          title: 'Chat for document ' + documentId, // You might want a better title
        },
      });
    }

    // 2. Save the user's message
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'USER',
        content: message,
      },
    });
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    // 3. Call the external AI service
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer token` }, // This token needs to be managed securely
      body: JSON.stringify({ message, document_id: documentId }),
    });

    if (!response.ok) {
      throw new Error('Network response from AI service was not ok');
    }

    const data = await response.json();

    // 4. Save the assistant's message
    const assistantMessageDb = await prisma.chatMessage.create({
        data: {
            sessionId: chatSession.id,
            role: 'ASSISTANT',
            content: data.response,
            metadata: data.sources ? { sources: data.sources } : undefined,
            modelUsed: data.model,
            tokensUsed: data.tokens,
        }
    });

    const assistantMessage: Message = {
      id: assistantMessageDb.id,
      role: 'assistant',
      content: data.response,
      sources: data.sources,
    };

    // 5. Return the assistant's message to the client
    return NextResponse.json(assistantMessage);

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET handler for fetching messages
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const { searchParams } = new URL(req.url);
        const documentId = searchParams.get('documentId');

        if (!documentId) {
            return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
        }

        const chatSession = await prisma.chatSession.findFirst({
            where: {
                userId,
                documentId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        if (!chatSession) {
            return NextResponse.json([]);
        }

        const messages: Message[] = chatSession.messages.map(msg => ({
            id: msg.id,
            role: msg.role === 'USER' ? 'user' : 'assistant',
            content: msg.content,
            sources: (msg.metadata as any)?.sources,
        }));

        return NextResponse.json(messages);

    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
