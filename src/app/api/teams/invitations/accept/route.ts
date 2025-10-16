import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// POST - Accept team invitation
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if email matches
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 400 }
      );
    }

    // Check team capacity
    if (invitation.team._count.members >= invitation.team.maxMembers) {
      return NextResponse.json(
        { error: 'Team has reached maximum capacity' },
        { status: 400 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: invitation.teamId,
          userId: user.id
        }
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 400 }
      );
    }

    // Create team membership
    const member = await prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: user.id,
        role: invitation.role,
        status: 'ACTIVE',
        invitedBy: invitation.invitedById,
        lastActiveAt: new Date(),
      },
      include: {
        team: true,
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

    // Update invitation status
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
        invitedUserId: user.id,
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'TEAM_MEMBER_ADDED',
        entityType: 'team_member',
        entityId: member.id,
        userId: user.id,
        details: { teamId: invitation.teamId, invitationId: invitation.id },
        success: true,
      }
    });

    // Create notification for the team owner
    const team = await prisma.team.findUnique({
      where: { id: invitation.teamId },
      select: { ownerId: true, name: true }
    });

    if (team) {
      await prisma.notification.create({
        data: {
          userId: team.ownerId,
          type: 'TEAM_INVITATION_ACCEPTED',
          title: 'New Team Member',
          message: `${user.firstName} ${user.lastName || ''} has joined ${team.name}`,
          link: `/teams/${invitation.teamId}`,
          actionLabel: 'View Team',
          metadata: {
            teamId: invitation.teamId,
            memberId: user.id,
            memberName: `${user.firstName} ${user.lastName || ''}`,
            teamName: team.name
          }
        }
      });
    }

    return NextResponse.json({
      message: 'Successfully joined the team',
      member,
      team: invitation.team
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
