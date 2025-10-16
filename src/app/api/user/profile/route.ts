import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        image: true,
        role: true,
        persona: true,
        preferredLanguage: true,
        notificationsEnabled: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            documents: true,
            teamMemberships: true,
            ownedTeams: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(req: NextRequest) {
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
    const {
      firstName,
      lastName,
      image,
      persona,
      preferredLanguage,
      notificationsEnabled
    } = body;

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName?.trim() || null }),
        ...(image !== undefined && { image }),
        ...(persona && { persona }),
        ...(preferredLanguage && { preferredLanguage }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        image: true,
        role: true,
        persona: true,
        preferredLanguage: true,
        notificationsEnabled: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            documents: true,
            teamMemberships: true,
            ownedTeams: true
          }
        }
      }
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
