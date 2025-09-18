
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
  return document;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { data: session } = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   // Or redirect to login
  //   return notFound();
  // }

  const document = await getDocument(params.documentId);

  if (!document) {
    return notFound();
  }

  return (
    <ChatClient
      documentId={document.id}
      documentName={document.originalFileName}
      documentUrl={document.storageUrl}
    />
  );
}
