import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET: Fetch all documents shared with the team
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Check if user is member of team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        user: { email: session.user.email },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
    }

    // Fetch team documents with details
    const teamDocuments = await prisma.teamDocument.findMany({
      where: {
        teamId,
      },
      include: {
        document: {
          select: {
            id: true,
            originalFileName: true,
            fileSize: true,
            mimeType: true,
            documentType: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            activity: true,
          },
        },
      },
      orderBy: {
        sharedAt: 'desc',
      },
    });

    return NextResponse.json(teamDocuments);
  } catch (error) {
    console.error('Error fetching team documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team documents' },
      { status: 500 }
    );
  }
}

// POST: Share a document with the team
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;
    const { documentId, permission, canDownload, canShare, expiresAt } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is member of team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
    }

    // Check if document exists and belongs to user
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== user.id) {
      return NextResponse.json({ error: 'You can only share your own documents' }, { status: 403 });
    }

    // Check if already shared
    const existing = await prisma.teamDocument.findFirst({
      where: {
        teamId,
        documentId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Document already shared with this team' }, { status: 400 });
    }

    // Create team document
    const teamDocument = await prisma.teamDocument.create({
      data: {
        teamId,
        documentId,
        sharedById: user.id,
        permission: permission || 'VIEW',
        documentName: document.originalFileName,
        documentType: document.documentType,
        fileSize: document.fileSize,
        canDownload: canDownload ?? true,
        canShare: canShare ?? false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        document: {
          select: {
            originalFileName: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.teamDocumentActivity.create({
      data: {
        teamDocumentId: teamDocument.id,
        userId: user.id,
        action: 'SHARED',
        metadata: {
          permission: permission || 'VIEW',
          canDownload,
          canShare,
        },
      },
    });

    // Create notification for team members
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: { not: user.id }, // Don't notify the sharer
          },
          select: {
            userId: true,
          },
        },
      },
    });

    if (team) {
      const notifications = team.members.map((member: { userId: string }) => ({
        userId: member.userId,
        type: 'DOCUMENT_SHARED' as const,
        title: 'Document Shared',
        message: `${user.firstName} ${user.lastName || ''} shared "${document.originalFileName}" with ${team.name}`,
        link: `/chat/${document.id}`,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json(teamDocument, { status: 201 });
  } catch (error) {
    console.error('Error sharing document:', error);
    return NextResponse.json(
      { error: 'Failed to share document' },
      { status: 500 }
    );
  }
}

// DELETE: Remove document from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;
    const { searchParams } = new URL(request.url);
    const teamDocumentId = searchParams.get('teamDocumentId');

    if (!teamDocumentId) {
      return NextResponse.json({ error: 'Team document ID is required' }, { status: 400 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get team document
    const teamDocument = await prisma.teamDocument.findUnique({
      where: { id: teamDocumentId },
      include: {
        document: true,
      },
    });

    if (!teamDocument || teamDocument.teamId !== teamId) {
      return NextResponse.json({ error: 'Team document not found' }, { status: 404 });
    }

    // Check if user is the sharer or team admin/owner
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
    }

    const canDelete = 
      teamDocument.sharedById === user.id ||
      membership.role === 'ADMIN' ||
      membership.role === 'OWNER';

    if (!canDelete) {
      return NextResponse.json({ error: 'You do not have permission to remove this document' }, { status: 403 });
    }

    // Create activity log before deletion
    await prisma.teamDocumentActivity.create({
      data: {
        teamDocumentId: teamDocument.id,
        userId: user.id,
        action: 'REMOVED',
      },
    });

    // Delete the team document
    await prisma.teamDocument.delete({
      where: { id: teamDocumentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing team document:', error);
    return NextResponse.json(
      { error: 'Failed to remove document' },
      { status: 500 }
    );
  }
}
