import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get current user profile
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        skills: true,
        avatar: true,
        profileImage: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// PATCH: Update profile (bio, profileImage, name)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { bio, profileImage, name } = body;

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
      updateData.avatar = profileImage; // Also update avatar
    }
    if (name !== undefined && name.trim()) updateData.name = name.trim();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        bio: true,
        profileImage: true,
        avatar: true,
      },
    });

    return NextResponse.json({ user, message: 'تم تحديث الملف الشخصي' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
