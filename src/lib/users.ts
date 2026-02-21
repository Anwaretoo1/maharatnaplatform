import { prisma } from './prisma';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'craftsman' | 'learner' | 'admin';
  bio?: string;
  skills?: string[];
  avatar?: string;
  createdAt: Date;
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany();
    return users.map(user => ({
      ...user,
      role: user.role as 'craftsman' | 'learner' | 'admin',
      skills: user.skills ? JSON.parse(user.skills) : []
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) return null;

    return {
      ...user,
      role: user.role as 'craftsman' | 'learner' | 'admin',
      skills: user.skills ? JSON.parse(user.skills) : []
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) {
  try {
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password || '', // Should be hashed before calling this or inside here
        role: userData.role,
        bio: userData.bio,
        avatar: userData.avatar,
        skills: JSON.stringify(userData.skills || [])
      }
    });

    return {
      ...user,
      role: user.role as 'craftsman' | 'learner' | 'admin',
      skills: user.skills ? JSON.parse(user.skills) : []
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(id: string, userData: Partial<User>) {
  try {
    const updateData: any = { ...userData };
    if (userData.skills) {
      updateData.skills = JSON.stringify(userData.skills);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return {
      ...user,
      role: user.role as 'craftsman' | 'learner' | 'admin',
      skills: user.skills ? JSON.parse(user.skills) : []
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

