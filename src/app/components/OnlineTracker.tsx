'use client';

import { useEffect } from 'react';

// Component that silently tracks user's online status by pinging /api/online every 2 minutes
export default function OnlineTracker() {
  useEffect(() => {
    const ping = () => {
      fetch('/api/online', { method: 'POST' }).catch(() => {});
    };
    
    // Ping immediately on mount
    ping();
    
    // Then every 2 minutes
    const interval = setInterval(ping, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return null; // This component renders nothing
}
