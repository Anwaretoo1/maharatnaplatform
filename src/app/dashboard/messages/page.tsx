'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  subject: string | null;
  content: string;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; role: string };
  receiver: { id: string; name: string; role: string };
}

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BlockedUser {
  id: string;
  name: string;
  role: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [compose, setCompose] = useState({ receiverId: '', subject: '', content: '', imageUrl: '' });
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'' | 'all' | 'learners' | 'craftsmen'>('');

  const fetchMessages = async () => {
    const res = await fetch(`/api/messages?type=${tab}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  };

  const fetchContacts = async () => {
    const res = await fetch('/api/contacts');
    if (res.ok) {
      const data = await res.json();
      setContacts(data.contacts || []);
    }
  };

  const fetchBlockedUsers = async () => {
    const res = await fetch('/api/block');
    if (res.ok) {
      const data = await res.json();
      setBlockedUsers(data.blockedUsers || []);
    }
  };

  const fetchUserRole = async () => {
    const res = await fetch('/api/profile');
    if (res.ok) {
      const data = await res.json();
      setCurrentUserRole(data.user?.role || '');
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [tab]);

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (showCompose) fetchContacts();
  }, [showCompose]);

  const markAsRead = async (messageId: string) => {
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    });
    fetchMessages();
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setCompose(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        alert('فشل رفع الصورة');
      }
    } catch {
      alert('خطأ في رفع الصورة');
    }
    setUploading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compose.content) return;
    // For broadcast, no receiverId needed
    if (!broadcastTarget && !compose.receiverId) return;
    setSending(true);
    try {
      const payload: any = {
        subject: compose.subject,
        content: compose.content,
        imageUrl: compose.imageUrl || null,
      };
      if (broadcastTarget) {
        payload.broadcast = broadcastTarget;
      } else {
        payload.receiverId = compose.receiverId;
      }
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCompose(false);
        setCompose({ receiverId: '', subject: '', content: '', imageUrl: '' });
        setImageFile(null);
        setBroadcastTarget('');
        setTab('sent');
        fetchMessages();
        if (data.count) {
          alert(`تم إرسال الرسالة إلى ${data.count} مستخدم`);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'فشل إرسال الرسالة');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
    setSending(false);
  };

  const handleBlock = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حظر هذا المستخدم؟ لن يتمكن من مراسلتك.')) return;
    try {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert(data.error || 'فشل حظر المستخدم');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const res = await fetch('/api/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: userId }),
      });
      if (res.ok) {
        fetchBlockedUsers();
      }
    } catch {
      alert('حدث خطأ');
    }
  };

  // Check if selected receiver is admin or if sender is admin
  const selectedReceiver = contacts.find(c => c.id === compose.receiverId);
  const isAdminReceiver = selectedReceiver?.role === 'admin';
  const isAdmin = currentUserRole === 'admin';
  // Admin can always send images, others only when messaging admin
  const canSendImage = isAdmin || isAdminReceiver;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">مسؤول</span>;
      case 'craftsman': return <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">معلم</span>;
      default: return <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">متعلم</span>;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">الرسائل</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowBlocked(true); fetchBlockedUsers(); }}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-3 rounded-md transition-colors text-xs sm:text-sm"
          >
            🚫 المحظورون
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded-md transition-colors text-xs sm:text-sm"
          >
            ✉️ رسالة جديدة
          </button>
        </div>
      </div>

      {/* Blocked Users Modal */}
      {showBlocked && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="font-bold text-lg">🚫 المستخدمون المحظورون</h2>
              <button onClick={() => setShowBlocked(false)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <div className="p-4">
              {blockedUsers.length > 0 ? (
                <div className="space-y-2">
                  {blockedUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{u.name}</span>
                        {getRoleBadge(u.role)}
                      </div>
                      <button
                        onClick={() => handleUnblock(u.id)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded"
                      >
                        إلغاء الحظر
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">لا يوجد مستخدمون محظورون</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="font-bold text-lg">رسالة جديدة</h2>
              <button onClick={() => { setShowCompose(false); setCompose({ receiverId: '', subject: '', content: '', imageUrl: '' }); setImageFile(null); setBroadcastTarget(''); }} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSend} className="p-4 space-y-4">
              {/* Broadcast options for admin */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium mb-1">نوع الإرسال</label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setBroadcastTarget(''); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!broadcastTarget ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'}`}>
                      👤 فردي
                    </button>
                    <button type="button" onClick={() => { setBroadcastTarget('all'); setCompose(prev => ({ ...prev, receiverId: '' })); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${broadcastTarget === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'}`}>
                      📢 الكل
                    </button>
                    <button type="button" onClick={() => { setBroadcastTarget('learners'); setCompose(prev => ({ ...prev, receiverId: '' })); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${broadcastTarget === 'learners' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'}`}>
                      🎓 جميع الطلاب
                    </button>
                    <button type="button" onClick={() => { setBroadcastTarget('craftsmen'); setCompose(prev => ({ ...prev, receiverId: '' })); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${broadcastTarget === 'craftsmen' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'}`}>
                      � جميع المعلمين
                    </button>
                  </div>
                </div>
              )}

              {/* Recipient selector (only for individual messages) */}
              {!broadcastTarget && (
                <div>
                  <label className="block text-sm font-medium mb-1">إلى</label>
                  <select
                    required={!broadcastTarget}
                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                    value={compose.receiverId}
                    onChange={(e) => setCompose({ ...compose, receiverId: e.target.value })}
                  >
                    <option value="">اختر المستلم</option>
                    {contacts.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) - {u.role === 'admin' ? 'مسؤول' : u.role === 'craftsman' ? 'معلم' : 'متعلم'}
                      </option>
                    ))}
                  </select>
                  {contacts.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">لا يوجد جهات اتصال متاحة. سجّل في دورة لتتمكن من مراسلة معلمها.</p>
                  )}
                </div>
              )}

              {broadcastTarget && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-md p-3 text-sm text-purple-700 dark:text-purple-300">
                  📢 سيتم إرسال الرسالة إلى {broadcastTarget === 'all' ? 'جميع المستخدمين' : broadcastTarget === 'learners' ? 'جميع الطلاب' : 'جميع المعلمين'}
                </div>
              )}
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

              {/* Image attachment - available when messaging admin OR when admin sends */}
              {canSendImage && (
                <div>
                  <label className="block text-sm font-medium mb-1">📎 إرفاق صورة (إيصال دفع، لقطة شاشة...)</label>
                  {compose.imageUrl ? (
                    <div className="relative">
                      <img src={compose.imageUrl} alt="مرفقة" className="max-h-40 rounded-md border" />
                      <button
                        type="button"
                        onClick={() => { setCompose({ ...compose, imageUrl: '' }); setImageFile(null); }}
                        className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            handleImageUpload(file);
                          }
                        }}
                        className="text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                      />
                      {uploading && <span className="text-xs text-blue-600 animate-pulse">جاري الرفع...</span>}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={sending || uploading}
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
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="font-bold text-lg">{selectedMessage.subject || 'بدون موضوع'}</h2>
              <button onClick={() => setSelectedMessage(null)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mb-4">
                <span>من: <strong>{selectedMessage.sender.name}</strong></span>
                {getRoleBadge(selectedMessage.sender.role)}
                <span className="mr-auto">{new Date(selectedMessage.createdAt).toLocaleString('ar-SA')}</span>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 whitespace-pre-wrap text-sm">
                {selectedMessage.content}
              </div>
              {selectedMessage.imageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">📎 صورة مرفقة:</p>
                  <a href={selectedMessage.imageUrl} target="_blank" rel="noopener noreferrer">
                    <img src={selectedMessage.imageUrl} alt="مرفقة" className="max-w-full max-h-60 rounded-lg border cursor-pointer hover:opacity-90" />
                  </a>
                </div>
              )}
              {/* Block sender button (if sender is not admin) */}
              {tab === 'received' && selectedMessage.sender.role !== 'admin' && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-neutral-700">
                  <button
                    onClick={() => { handleBlock(selectedMessage.sender.id); setSelectedMessage(null); }}
                    className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center gap-1"
                  >
                    🚫 حظر {selectedMessage.sender.name}
                  </button>
                </div>
              )}
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
                      {m.imageUrl && <span className="text-xs text-gray-400">📎</span>}
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
