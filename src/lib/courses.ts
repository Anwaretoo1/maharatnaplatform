import { prisma } from './prisma';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  creatorId: string;
  thumbnailUrl?: string;
  content: CourseContent[];
  isFree: boolean;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseContent {
  id: string;
  title: string;
  type: 'video' | 'image' | 'text' | 'file';
  content: string;
  order: number;
}

export async function getAllCourses(filters?: {
  category?: string;
  creatorId?: string;
  isFree?: boolean;
}) {
  try {
    const where: any = {};
    
    if (filters?.category) where.category = filters.category;
    if (filters?.creatorId) where.creatorId = filters.creatorId;
    if (filters?.isFree !== undefined) where.isFree = filters.isFree;

    const courses = await prisma.course.findMany({
      where,
      include: {
        content: true
      }
    });

    return courses.map(course => ({
      ...course,
      content: course.content.map(c => ({
        ...c,
        type: c.type as 'video' | 'image' | 'text' | 'file'
      }))
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getCourseById(id: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        content: true
      }
    });

    if (!course) return null;

    return {
      ...course,
      content: course.content.map(c => ({
        ...c,
        type: c.type as 'video' | 'image' | 'text' | 'file'
      }))
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}


export async function createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const { content, ...data } = courseData;
    const course = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        creatorId: data.creatorId,
        thumbnailUrl: data.thumbnailUrl || '',
        isFree: data.isFree,
        price: data.price || 0,
      },
      include: { content: true }
    });
    return course;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

export async function updateCourse(id: string, courseData: Partial<Course>) {
  try {
    const { content, ...data } = courseData;
    const course = await prisma.course.update({
      where: { id },
      data,
      include: { content: true }
    });
    return course;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

export async function deleteCourse(id: string) {
  try {
    // Delete related content first (cascade should handle it but being explicit)
    await prisma.courseContent.deleteMany({ where: { courseId: id } });
    await prisma.enrollment.deleteMany({ where: { courseId: id } });
    await prisma.course.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}
