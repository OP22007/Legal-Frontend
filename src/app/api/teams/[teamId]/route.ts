import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET - Fetch team details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
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

    const { teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
                lastLoginAt: true,
                status: true,
                statusMessage: true,
              }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        invitations: {
          where: {
            status: 'PENDING',
            expiresAt: { gte: new Date() }
          },
          include: {
            invitedBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is a member or owner
    const membership = team.members.find(m => m.userId === user.id);
    const isOwner = team.ownerId === user.id;

    if (!membership && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Determine user's role in the team
    const userRole = isOwner ? 'OWNER' : (membership?.role || 'MEMBER');

    return NextResponse.json({ ...team, userRole });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

// PATCH - Update team details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
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

    const { teamId } = await params;
    const body = await req.json();

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

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() }),
        ...(body.color && { color: body.color }),
        ...(body.maxMembers && { maxMembers: body.maxMembers }),
        ...(body.allowInvites !== undefined && { allowInvites: body.allowInvites }),
        ...(body.requireApproval !== undefined && { requireApproval: body.requireApproval }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE - Delete team
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
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

    const { teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Only owner can delete team
    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only team owner can delete the team' }, { status: 403 });
    }

    // Delete team (cascade will delete members, invitations, etc.)
    await prisma.team.delete({
      where: { id: teamId }
    });

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
