'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const authValue = window.localStorage.getItem('auth');
    const authed = authValue === 'true';

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

