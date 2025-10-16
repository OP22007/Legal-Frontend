import { prisma } from './db';

/**
 * Update team member's last active timestamp
 */
export async function updateMemberActivity(userId: string, teamId: string) {
  try {
    await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        }
      },
      data: {
        lastActiveAt: new Date(),
      }
    });
  } catch (error) {
    console.error('Failed to update member activity:', error);
  }
}

/**
 * Increment member's document reviewed count
 */
export async function incrementDocumentReviewed(userId: string, teamId: string) {
  try {
    await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        }
      },
      data: {
        documentsReviewed: {
          increment: 1,
        },
        lastActiveAt: new Date(),
      }
    });

    // Also update team analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.teamAnalytics.upsert({
      where: {
        teamId_date: {
          teamId,
          date: today,
        }
      },
      update: {
        documentsAnalyzed: {
          increment: 1,
        }
      },
      create: {
        teamId,
        date: today,
        documentsAnalyzed: 1,
        activeMembers: 1,
      }
    });
  } catch (error) {
    console.error('Failed to increment document reviewed:', error);
  }
}

/**
 * Update team daily analytics
 */
export async function updateTeamAnalytics(
  teamId: string,
  updates: {
    documentsUploaded?: number;
    documentsAnalyzed?: number;
    documentsShared?: number;
    chatSessionsCreated?: number;
    commentsAdded?: number;
    activeMembers?: number;
    newMembers?: number;
  }
) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const incrementData: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value > 0) {
        incrementData[key] = { increment: value };
      }
    });

    await prisma.teamAnalytics.upsert({
      where: {
        teamId_date: {
          teamId,
          date: today,
        }
      },
      update: incrementData,
      create: {
        teamId,
        date: today,
        ...Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [key, value || 0])
        ),
      }
    });
  } catch (error) {
    console.error('Failed to update team analytics:', error);
  }
}

/**
 * Get active members count (active in last 24 hours)
 */
export async function getActiveMembersCount(teamId: string): Promise<number> {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const count = await prisma.teamMember.count({
      where: {
        teamId,
        status: 'ACTIVE',
        lastActiveAt: {
          gte: twentyFourHoursAgo,
        }
      }
    });

    return count;
  } catch (error) {
    console.error('Failed to get active members count:', error);
    return 0;
  }
}

/**
 * Get team statistics
 */
export async function getTeamStats(teamId: string) {
  try {
    const [team, activeMembers, analytics] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            where: { status: 'ACTIVE' },
            include: {
              user: true
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
      }),
      getActiveMembersCount(teamId),
      prisma.teamAnalytics.findMany({
        where: { teamId },
        orderBy: { date: 'desc' },
        take: 30,
      })
    ]);

    if (!team) return null;

    const totalDocuments = team.members.reduce(
      (sum, member) => sum + member.documentsReviewed,
      0
    );

    const adminsCount = team.members.filter(
      m => m.role === 'ADMIN' || m.role === 'OWNER'
    ).length;

    return {
      totalMembers: team._count.members,
      activeMembers,
      adminsCount,
      totalDocuments,
      pendingInvitations: team._count.invitations,
      analytics,
    };
  } catch (error) {
    console.error('Failed to get team stats:', error);
    return null;
  }
}

/**
 * Check if user has permission for an action
 */
export async function checkTeamPermission(
  userId: string,
  teamId: string,
  requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
): Promise<boolean> {
  try {
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        }
      },
      include: {
        team: true
      }
    });

    if (!membership) return false;

    const roleHierarchy: Record<string, number> = {
      OWNER: 4,
      ADMIN: 3,
      MEMBER: 2,
      VIEWER: 1,
    };

    // Check if user is owner
    if (membership.team.ownerId === userId) return true;

    // Check role hierarchy
    return roleHierarchy[membership.role] >= roleHierarchy[requiredRole];
  } catch (error) {
    console.error('Failed to check team permission:', error);
    return false;
  }
}
