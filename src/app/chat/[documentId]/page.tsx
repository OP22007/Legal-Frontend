
import { notFound } from 'next/navigation';
import {prisma} from '@/lib/db';
import { ChatClient } from './client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
interface ChatPageProps {
  params: {
    documentId: string;
  };
}

async function getDocument(documentId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      // userId: userId,
    },
  });

  if (!document) {
    return null;
  }

  // Ensure all required fields are present and are strings
  if (typeof document.id !== 'string' ||
      typeof document.originalFileName !== 'string' ||
      typeof document.storageUrl !== 'string') {
    console.error('Document has invalid field types:', {
      id: typeof document.id,
      originalFileName: typeof document.originalFileName,
      storageUrl: typeof document.storageUrl,
      document
    });
    return null;
  }

  return document;
}

export default async function ChatPage({ params }: ChatPageProps) {
  // const { data: session } = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   // Or redirect to login
  //   return notFound();
  // }

  const document = await getDocument(params.documentId);

  if (!document) {
    return notFound();
  }

  // Ensure document has required properties
  if (!document.id || !document.originalFileName || !document.storageUrl) {
    console.error('Document missing required properties:', document);
    return notFound();
  }

  return (
    <ChatClient
      documentId={String(document.id)}
      documentName={String(document.originalFileName)}
      documentUrl={String(document.storageUrl)}
    />
  );
}
