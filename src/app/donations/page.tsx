import { getAllDonations } from '@/lib/donations';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function DonationsPage() {
  const donations = await getAllDonations();
  const craftsmen = await prisma.user.findMany({
    where: { role: 'craftsman' },
    select: { id: true, name: true, avatar: true, bio: true }
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">دعم المنصة والحرفيين</h1>
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-8 rounded-2xl mb-12 border border-blue-200 dark:border-blue-800">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">ساهم في إحياء التراث</h2>
            <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
              دعمك يساعدنا في الحفاظ على الحرف التقليدية وتمكين الحرفيين من الاستمرار في إبداعهم.
            </p>
          </div>

          {/* How to Donate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm text-center">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">📧</div>
              <h3 className="font-bold mb-2">عبر البريد الإلكتروني</h3>
              <p className="text-sm text-gray-500 mb-3">تواصل معنا لتنسيق عملية التبرع</p>
              <a href="mailto:info@maharat-syria.com?subject=أرغب في التبرع لمنصة مهاراتنا" className="text-blue-600 hover:underline text-sm font-medium">
                info@maharat-syria.com
              </a>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">💬</div>
              <h3 className="font-bold mb-2">تواصل مباشر</h3>
              <p className="text-sm text-gray-500 mb-3">يمكنك التواصل مع الحرفي مباشرة عبر ملفه الشخصي</p>
              <Link href="/craftsmen" className="text-blue-600 hover:underline text-sm font-medium">
                تصفح الحرفيين
              </Link>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm text-center">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🤝</div>
              <h3 className="font-bold mb-2">شراكات</h3>
              <p className="text-sm text-gray-500 mb-3">للمؤسسات والشركات الراغبة بالشراكة</p>
              <a href="mailto:info@maharat-syria.com?subject=طلب شراكة مع منصة مهاراتنا" className="text-blue-600 hover:underline text-sm font-medium">
                تواصل معنا
              </a>
            </div>
          </div>
        </div>

        {/* Support a Craftsman */}
        {craftsmen.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">ادعم حرفيّاً</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {craftsmen.map((c) => (
                <Link key={c.id} href={`/craftsmen/${c.id}`} className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg hover:shadow-md transition-shadow">
                  <img
                    src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=48&background=random`}
                    alt={c.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold">{c.name}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{c.bio || 'حرفي في منصة مهاراتنا'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Donations List */}
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">سجل التبرعات</h2>
        {donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold">
                    💚
                  </div>
                  <div>
                    <p className="font-bold">{donation.donorName}</p>
                    <p className="text-sm text-gray-500">
                      {donation.recipientType === 'platform' ? 'دعم المنصة' : 'دعم حرفي'}
                    </p>
                    {donation.message && (
                      <p className="text-xs text-gray-400 mt-1 italic">&quot;{donation.message}&quot;</p>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg text-green-600">${donation.amount}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(donation.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-dashed border-gray-300 dark:border-neutral-700">
            <p className="text-gray-500 text-lg mb-2">لا توجد تبرعات مسجلة بعد</p>
            <p className="text-sm text-gray-400">كن أول المتبرعين لدعم الحرف التقليدية!</p>
          </div>
        )}
      </div>
    </main>
  );
}
