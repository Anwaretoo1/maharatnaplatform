import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUserById, createUser } from '@/lib/users';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Get specific user by ID
      const user = await getUserById(id);
      
      if (!user) {
        return NextResponse.json(
          { error: 'المستخدم غير موجود' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ user });
    }
    
    // Get all users
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in users GET route:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات المستخدمين' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.role || !data.password) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني وكلمة المرور والدور مطلوبة' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create new user
    const newUser = await createUser({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      bio: data.bio || '',
      skills: data.skills || [],
      avatar: data.avatar || '',
    });
    
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Error in users POST route:', error);
    
    // Check for unique constraint violation (e.g., email already exists)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    );
  }
}
