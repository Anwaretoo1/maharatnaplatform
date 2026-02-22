import Link from 'next/link';
import { getAllUsers } from '@/lib/users';

export const dynamic = 'force-dynamic';

export default async function CraftsmenPage() {
  const users = await getAllUsers();
  const craftsmen = users.filter(user => user.role === 'craftsman');

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <h1 className="text-4xl font-bold mb-12 text-center">الحرفيون المبدعون</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {craftsmen.map((craftsman) => (
          <div key={craftsman.id} className="flex flex-col items-center p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-neutral-900 dark:border-neutral-800">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-gray-100 dark:border-neutral-800">
              <img 
                src={craftsman.avatar || craftsman.bio && `https://ui-avatars.com/api/?name=${craftsman.name}` || `https://ui-avatars.com/api/?name=${craftsman.name}`} 
                alt={craftsman.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold mb-2">{craftsman.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{craftsman.email}</p>
            
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {craftsman.skills?.map((skill: string, index: number) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                  {skill}
                </span>
              ))}
            </div>
            
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3">
              {craftsman.bio || 'لا يوجد نبذة تعريفية'}
            </p>
            
            <Link 
              href={`/craftsmen/${craftsman.id}`} 
              className="mt-auto text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
            >
              عرض الملف الشخصي
            </Link>
          </div>
        ))}
      </div>
      
      {craftsmen.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">لا يوجد حرفيون مسجلون حالياً.</p>
        </div>
      )}
    </main>
  );
}
