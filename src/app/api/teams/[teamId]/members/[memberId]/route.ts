import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// PATCH - Update member role or status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { teamId, memberId } = params;
    const body = await req.json();
    const { role, status } = body;

    // Check if user has permission (owner or admin)
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id
        }
      }
    });

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOwner = team.ownerId === user.id;
    const isAdmin = membership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Can't change owner's role
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId }
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMember.role === 'OWNER' && role && role !== 'OWNER') {
      return NextResponse.json(
        { error: "Cannot change owner's role" },
        { status: 400 }
      );
    }

    // Update member
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ...(role && { role }),
        ...(status && { status }),
        ...(status === 'ACTIVE' && { lastActiveAt: new Date() }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from team
export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { teamId, memberId } = params;

    // Check permissions
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id
        }
      }
    });

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOwner = team.ownerId === user.id;
    const isAdmin = membership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Can't remove owner
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId }
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove team owner' },
        { status: 400 }
      );
    }

    // Remove member
    await prisma.teamMember.delete({
      where: { id: memberId }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'TEAM_MEMBER_REMOVED',
        entityType: 'team_member',
        entityId: memberId,
        userId: user.id,
        details: { teamId },
        success: true,
      }
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
