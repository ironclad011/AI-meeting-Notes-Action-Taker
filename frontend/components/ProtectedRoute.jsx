'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireAuth = true, requireGuest = false }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAuthRequired = requireGuest ? false : requireAuth;

  useEffect(() => {
    if (!loading) {
      if (isAuthRequired && !user) {
        router.push('/login');
      } else if (requireGuest && user) {
        router.push('/');
      }
    }
  }, [user, loading, isAuthRequired, requireGuest, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        <p className="text-xs font-medium tracking-wide">Checking authorization...</p>
      </div>
    );
  }

  if (isAuthRequired && !user) {
    return null;
  }

  if (requireGuest && user) {
    return null;
  }

  return <>{children}</>;
}
