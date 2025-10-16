import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// GET - Fetch team invitations
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

    // Verify user is a member or owner
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

    if (!membership && team.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: { teamId },
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// POST - Send team invitation
export async function POST(
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
    const { email, role, message } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        _count: {
          select: { members: true }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user has permission to invite
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id
        }
      }
    });

    const isOwner = team.ownerId === user.id;
    const isAdmin = membership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check team capacity
    if (team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { error: 'Team has reached maximum capacity' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        user: { email: email.toLowerCase() }
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        email: email.toLowerCase(),
        status: 'PENDING',
        expiresAt: { gte: new Date() }
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      );
    }

    // Check if invited email belongs to an existing user
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email: email.toLowerCase(),
        role: role || 'MEMBER',
        invitedById: user.id,
        invitedUserId: invitedUser?.id,
        message,
        expiresAt,
      },
      include: {
        team: true,
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/teams/accept-invitation?token=${invitation.token}`;

    try {
      await sendEmail({
        to: email,
        subject: `You've been invited to join ${team.name} on LegisEye`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Team Invitation</h2>
            <p>Hi there!</p>
            <p><strong>${user.firstName} ${user.lastName || ''}</strong> has invited you to join <strong>${team.name}</strong> on LegisEye.</p>
            ${message ? `<p><em>${message}</em></p>` : ''}
            <p>You will be joining as a <strong>${role || 'MEMBER'}</strong>.</p>
            <div style="margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
            <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
        text: `You've been invited to join ${team.name} on LegisEye. Visit ${inviteUrl} to accept the invitation.`
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email sending fails
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'TEAM_INVITATION_SENT',
        entityType: 'team_invitation',
        entityId: invitation.id,
        userId: user.id,
        details: { teamId, email },
        success: true,
      }
    });

    // Create notification for invited user if they have an account
    if (invitedUser) {
      await prisma.notification.create({
        data: {
          userId: invitedUser.id,
          type: 'TEAM_INVITATION',
          title: 'Team Invitation',
          message: `${user.firstName} ${user.lastName || ''} invited you to join ${team.name}`,
          link: `/teams/accept-invitation?token=${invitation.token}`,
          actionLabel: 'View Invitation',
          metadata: {
            teamId,
            teamName: team.name,
            inviterId: user.id,
            inviterName: `${user.firstName} ${user.lastName || ''}`,
            role: role || 'MEMBER'
          }
        }
      });
    }

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel invitation
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

    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    const { teamId } = await params;

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

    // Cancel invitation
    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}
