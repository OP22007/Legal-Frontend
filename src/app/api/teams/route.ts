import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET - Fetch all teams for the current user
export async function GET(req: NextRequest) {
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

    // Fetch teams where user is owner
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: user.id },
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
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            invitations: {
              where: { status: 'PENDING' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch teams where user is a member
    const memberTeams = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      include: {
        team: {
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
                  }
                }
              }
            },
            _count: {
              select: {
                members: true,
                invitations: {
                  where: { status: 'PENDING' }
                }
              }
            }
          }
        }
      }
    });

    const teams = [
      ...ownedTeams.map(team => ({ ...team, userRole: 'OWNER' })),
      ...memberTeams.map(membership => ({
        ...membership.team,
        userRole: membership.role
      }))
    ];

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST - Create a new team
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
    const { name, description, color, maxMembers, allowInvites, requireApproval } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Create the team
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        ownerId: user.id,
        color: color || '#0ea5e9',
        maxMembers: maxMembers || 50,
        allowInvites: allowInvites !== undefined ? allowInvites : true,
        requireApproval: requireApproval !== undefined ? requireApproval : true,
      },
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
        _count: {
          select: {
            members: true,
            invitations: true
          }
        }
      }
    });

    // Add owner as a team member with OWNER role
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'TEAM_CREATED',
        entityType: 'team',
        entityId: team.id,
        userId: user.id,
        details: { teamName: team.name },
        success: true,
      }
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
