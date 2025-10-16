import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { getTeamStats } from '@/lib/team-utils';

// GET - Fetch team analytics
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

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
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

    // Get team statistics
    const stats = await getTeamStats(teamId);

    if (!stats) {
      return NextResponse.json({ error: 'Failed to fetch team stats' }, { status: 500 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching team analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team analytics' },
      { status: 500 }
    );
  }
}
