'use client';

import { useState, useEffect } from 'react';

interface OnlineUser {
  id: string;
  name: string;
  role: string;
  lastSeen: string;
}

export default function OnlineUsersCard({ initialCount }: { initialCount: number }) {
  const [onlineCount, setOnlineCount] = useState(initialCount);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const res = await fetch('/api/online');
        if (res.ok) {
          const data = await res.json();
          setOnlineCount(data.onlineCount);
          setOnlineUsers(data.onlineUsers || []);
        }
      } catch {
        // Silently fail
      }
    };

    fetchOnline();
    const interval = setInterval(fetchOnline, 30 * 1000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 relative">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">المتصلون الآن</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">{onlineCount}</p>
        </div>
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-2xl relative">
          🟢
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
        </div>
      </div>
      <div className="mt-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-600 hover:underline"
        >
          {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
        </button>
      </div>
      {showDetails && onlineUsers.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-gray-100 dark:border-neutral-800 pt-2">
          {onlineUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="font-medium">{u.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                u.role === 'admin' ? 'bg-red-100 text-red-600' :
                u.role === 'craftsman' ? 'bg-green-100 text-green-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {u.role === 'admin' ? 'مسؤول' : u.role === 'craftsman' ? 'حرفي' : 'متعلم'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
