'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; role: string };
  receiver: { id: string; name: string; role: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [compose, setCompose] = useState({ receiverId: '', subject: '', content: '' });
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    const res = await fetch(`/api/messages?type=${tab}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || data);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [tab]);

  useEffect(() => {
    if (showCompose && users.length === 0) fetchUsers();
  }, [showCompose]);

  const markAsRead = async (messageId: string) => {
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    });
    fetchMessages();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compose.receiverId || !compose.content) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compose),
      });
      if (res.ok) {
        setShowCompose(false);
        setCompose({ receiverId: '', subject: '', content: '' });
        setTab('sent');
        fetchMessages();
      } else {
        const data = await res.json();
        alert(data.error || 'فشل إرسال الرسالة');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
    setSending(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">مسؤول</span>;
      case 'craftsman': return <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">حرفي</span>;
      default: return <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">متعلم</span>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">الرسائل</h1>
        <button
          onClick={() => setShowCompose(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          ✉️ رسالة جديدة
        </button>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="font-bold text-lg">رسالة جديدة</h2>
              <button onClick={() => setShowCompose(false)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSend} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">إلى</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                  value={compose.receiverId}
                  onChange={(e) => setCompose({ ...compose, receiverId: e.target.value })}
                >
                  <option value="">اختر المستلم</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role === 'admin' ? 'مسؤول' : u.role === 'craftsman' ? 'حرفي' : 'متعلم'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الموضوع (اختياري)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                  value={compose.subject}
                  onChange={(e) => setCompose({ ...compose, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الرسالة</label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                  value={compose.content}
                  onChange={(e) => setCompose({ ...compose, content: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
              >
                {sending ? 'جاري الإرسال...' : 'إرسال'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="font-bold text-lg">{selectedMessage.subject || 'بدون موضوع'}</h2>
              <button onClick={() => setSelectedMessage(null)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span>من: <strong>{selectedMessage.sender.name}</strong></span>
                {getRoleBadge(selectedMessage.sender.role)}
                <span className="mr-auto">{new Date(selectedMessage.createdAt).toLocaleString('ar-SA')}</span>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 whitespace-pre-wrap text-sm">
                {selectedMessage.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('received')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            tab === 'received' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }`}
        >
          📥 الواردة
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            tab === 'sent' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }`}
        >
          📤 المرسلة
        </button>
      </div>

      {/* Messages List */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800">
        {messages.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors ${
                  !m.isRead && tab === 'received' ? 'bg-blue-50 dark:bg-blue-900/10 border-r-4 border-r-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedMessage(m);
                  if (!m.isRead && tab === 'received') markAsRead(m.id);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                    {tab === 'received' ? m.sender.name.charAt(0) : m.receiver.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {tab === 'received' ? m.sender.name : m.receiver.name}
                      </span>
                      {getRoleBadge(tab === 'received' ? m.sender.role : m.receiver.role)}
                      {!m.isRead && tab === 'received' && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {m.subject || 'بدون موضوع'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{m.content}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(m.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">📭</p>
            <p>{tab === 'received' ? 'لا توجد رسائل واردة' : 'لا توجد رسائل مرسلة'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
