'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const tokenValue = window.localStorage.getItem('token');
    const authed = typeof tokenValue === 'string' && tokenValue.trim().length > 0;

    if (!authed) {
      router.replace('/login');
    }

    setIsAuthed(authed);
    setIsChecking(false);
  }, [router]);

  if (isChecking) return null;
  if (!isAuthed) return null;

  return <>{children}</>;
}

