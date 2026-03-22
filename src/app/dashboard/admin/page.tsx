import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DeleteUserButton, ChangeRoleButton, ResetPasswordButton, DeleteCourseAdminButton, SendMessageButton, GenerateCodeButton, DiscountManager } from './AdminActions';
import OnlineUsersCard from './OnlineUsersCard';
import ImportCourseButton from './ImportCourseButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) return null;

  if (session.user.role !== 'admin') {
    redirect('/dashboard/learner');
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const [userCount, courseCount, enrollmentCount, donationSum, allUsers, allCourses, recentDonations, onlineCount] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.donation.aggregate({ _sum: { amount: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    }),
    prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { name: true } }, _count: { select: { enrollments: true } } }
    }),
    prisma.donation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where: { lastSeen: { gte: fiveMinutesAgo } } }),
  ]);

  const craftsmanCount = await prisma.user.count({ where: { role: 'craftsman' } });
  const learnerCount = await prisma.user.count({ where: { role: 'learner' } });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">لوحة المسؤول</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <OnlineUsersCard initialCount={onlineCount} />
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">إجمالي المستخدمين</h3>
              <p className="text-3xl font-bold mt-2">{userCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl">👥</div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <span className="text-green-600 font-medium">{craftsmanCount} حرفي</span> · <span className="text-blue-600 font-medium">{learnerCount} متعلم</span>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">الدورات المنشورة</h3>
              <p className="text-3xl font-bold mt-2">{courseCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-2xl">📚</div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">عمليات التسجيل</h3>
              <p className="text-3xl font-bold mt-2">{enrollmentCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-2xl">📝</div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">إجمالي التبرعات</h3>
              <p className="text-3xl font-bold mt-2">${donationSum._sum.amount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-2xl">💰</div>
          </div>
        </div>
      </div>

      {/* ===== استيراد دورات + رموز التسجيل + الخصومات ===== */}
      <div className="flex flex-wrap gap-3 justify-end mb-4">
        <ImportCourseButton />
        <DiscountManager courses={allCourses.map(c => ({ id: c.id, title: c.title, isFree: c.isFree, price: c.price }))} role="admin" />
        <GenerateCodeButton courses={allCourses.map(c => ({ id: c.id, title: c.title, isFree: c.isFree, price: c.price }))} />
      </div>

      {/* ===== إدارة المستخدمين ===== */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">إدارة المستخدمين ({allUsers.length})</h2>
          <div className="flex gap-2 text-xs text-gray-500">
            <span>🗑️ حذف</span>
            <span>🔄 تغيير الدور</span>
            <span>🔑 إعادة تعيين كلمة المرور</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-neutral-800">
                <th className="text-right py-3 px-2 font-medium text-gray-500">#</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">الاسم</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">البريد الإلكتروني</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">الدور</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">تاريخ التسجيل</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {allUsers.map((u, index) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                  <td className="py-3 px-2 text-gray-400 text-xs">{index + 1}</td>
                  <td className="py-3 px-2 font-medium">{u.name}</td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{u.email}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      u.role === 'craftsman' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {u.role === 'admin' ? 'مسؤول' : u.role === 'craftsman' ? 'معلم' : 'متعلم'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{u.createdAt.toLocaleDateString('ar-SA')}</td>
                  <td className="py-3 px-2">
                    {u.role !== 'admin' ? (
                      <div className="flex items-center gap-3">
                        <SendMessageButton userId={u.id} userName={u.name} />
                        <ResetPasswordButton userId={u.id} userName={u.name} />
                        <ChangeRoleButton userId={u.id} currentRole={u.role} />
                        <DeleteUserButton userId={u.id} userName={u.name} />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== إدارة الدورات ===== */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">إدارة الدورات ({allCourses.length})</h2>
        {allCourses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-right py-3 px-2 font-medium text-gray-500">#</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">عنوان الدورة</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">المنشئ</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">التصنيف</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">الطلاب</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">السعر</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">التاريخ</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {allCourses.map((c, index) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="py-3 px-2 text-gray-400 text-xs">{index + 1}</td>
                    <td className="py-3 px-2 font-medium">
                      <Link href={`/courses/${c.id}`} className="hover:text-blue-600">{c.title}</Link>
                    </td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{c.creator.name}</td>
                    <td className="py-3 px-2 text-xs">{c.category}</td>
                    <td className="py-3 px-2 text-center">{c._count.enrollments}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-bold ${c.isFree ? 'text-green-600' : 'text-amber-600'}`}>
                        {c.isFree ? 'مجاني' : `$${c.price}`}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{c.createdAt.toLocaleDateString('ar-SA')}</td>
                    <td className="py-3 px-2">
                      <DeleteCourseAdminButton courseId={c.id} courseTitle={c.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">لا توجد دورات بعد</p>
        )}
      </div>

      {/* ===== أحدث التبرعات ===== */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
        <h2 className="text-xl font-bold mb-4">أحدث التبرعات</h2>
        {recentDonations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-right py-3 px-2 font-medium text-gray-500">المتبرع</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">البريد</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">المبلغ</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">النوع</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {recentDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="py-3 px-2 font-medium">{d.donorName}</td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{d.donorEmail}</td>
                    <td className="py-3 px-2 font-bold text-green-600">${d.amount}</td>
                    <td className="py-3 px-2 text-xs">{d.recipientType === 'platform' ? 'للمنصة' : 'لحرفي'}</td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{d.createdAt.toLocaleDateString('ar-SA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">لا توجد تبرعات بعد</p>
        )}
      </div>
    </div>
  );
}
