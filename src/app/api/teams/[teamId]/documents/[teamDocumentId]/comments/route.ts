import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET: Fetch comments for a team document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; teamDocumentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, teamDocumentId } = await params;

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

    // Check if team document exists and belongs to the team
    const teamDocument = await prisma.teamDocument.findFirst({
      where: {
        id: teamDocumentId,
        teamId,
      },
    });

    if (!teamDocument) {
      return NextResponse.json({ error: 'Team document not found' }, { status: 404 });
    }

    // Check if user has permission to view comments
    const canView = ['VIEW', 'COMMENT', 'EDIT', 'ADMIN'].includes(teamDocument.permission);
    if (!canView) {
      return NextResponse.json({ error: 'You do not have permission to view comments' }, { status: 403 });
    }

    // Fetch comments with user information
    const comments = await prisma.teamDocumentComment.findMany({
      where: {
        teamDocumentId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST: Add a comment to a team document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; teamDocumentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, teamDocumentId } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
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

    // Check if team document exists and belongs to the team
    const teamDocument = await prisma.teamDocument.findFirst({
      where: {
        id: teamDocumentId,
        teamId,
      },
    });

    if (!teamDocument) {
      return NextResponse.json({ error: 'Team document not found' }, { status: 404 });
    }

    // Check if user has permission to comment
    const canComment = ['COMMENT', 'EDIT', 'ADMIN'].includes(teamDocument.permission);
    if (!canComment) {
      return NextResponse.json({ error: 'You do not have permission to comment' }, { status: 403 });
    }

    // Create the comment
    const comment = await prisma.teamDocumentComment.create({
      data: {
        teamDocumentId,
        userId: user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.teamDocumentActivity.create({
      data: {
        teamDocumentId,
        userId: user.id,
        action: 'COMMENTED',
        metadata: {
          commentId: comment.id,
          commentLength: content.length,
        },
      },
    });

    // Create notification for team members (except the commenter)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: { not: user.id }, // Don't notify the commenter
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
        type: 'MENTION' as const, // Using MENTION type for comments
        title: 'New Comment',
        message: `${user.firstName} ${user.lastName || ''} commented on "${teamDocument.documentName}"`,
        link: `/teams/${teamId}`,
        metadata: {
          teamId,
          teamDocumentId,
          commentId: comment.id,
        },
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a comment from a team document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; teamDocumentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, teamDocumentId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
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

    // Get the comment
    const comment = await prisma.teamDocumentComment.findUnique({
      where: { id: commentId },
      include: {
        teamDocument: true,
      },
    });

    if (!comment || comment.teamDocument.teamId !== teamId || comment.teamDocumentId !== teamDocumentId) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user can delete (comment author or team admin/owner)
    const canDelete = comment.userId === user.id || membership.role === 'ADMIN' || membership.role === 'OWNER';
    if (!canDelete) {
      return NextResponse.json({ error: 'You do not have permission to delete this comment' }, { status: 403 });
    }

    // Delete the comment
    await prisma.teamDocumentComment.delete({
      where: { id: commentId },
    });

    // Create activity log
    await prisma.teamDocumentActivity.create({
      data: {
        teamDocumentId,
        userId: user.id,
        action: 'COMMENT_DELETED',
        metadata: {
          deletedCommentId: commentId,
          commentAuthorId: comment.userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}