import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoPlayer from './VideoPlayer';

export default async function CourseLearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?redirect=/courses/${id}/learn`);
  }

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: id
      }
    }
  });

  // If not enrolled and not creator/admin, redirect to course page
  const course = await prisma.course.findUnique({
    where: { id },
    include: { content: { orderBy: { order: 'asc' } } }
  });

  if (!course) return <div>الدورة غير موجودة</div>;

  if (!enrollment && course.creatorId !== session.user.id && session.user.role !== 'admin') {
    redirect(`/courses/${id}`);
  }

  // Get progress
  const progress = await prisma.progress.findMany({
    where: {
      userId: session.user.id,
      content: { courseId: id }
    }
  });

  // Progress is passed to VideoPlayer component

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 dark:bg-neutral-950">
      {/* Main Content Area (Video) */}
      <div className="flex-1 overflow-y-auto">
        <VideoPlayer course={course} initialProgress={progress} userId={session.user.id} />
      </div>
    </div>
  );
}
