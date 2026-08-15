import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, getCurrentSession } from '../lib/supabase';

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: Session; user: User }
  | { status: 'unauthenticated' };

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const session = await getCurrentSession();
      if (!mounted) return;
      setState(
        session
          ? { status: 'authenticated', session, user: session.user }
          : { status: 'unauthenticated' }
      );
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState(
        session
          ? { status: 'authenticated', session, user: session.user }
          : { status: 'unauthenticated' }
      );
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    isLoading: state.status === 'loading',
    isAuthenticated: state.status === 'authenticated',
    user: state.status === 'authenticated' ? state.user : null,
    session: state.status === 'authenticated' ? state.session : null,
  };
}