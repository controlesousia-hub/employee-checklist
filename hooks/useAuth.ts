import { useCallback, useEffect, useState } from 'react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, getCurrentSession, signOutClean } from '../lib/supabase';

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: Session; user: User }
  | { status: 'unauthenticated' };

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Initialisation
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

    // Écoute des changements d'état (login, logout, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT' || !session) {
          setState({ status: 'unauthenticated' });
        } else {
          setState({ status: 'authenticated', session, user: session.user });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await signOutClean();
    // L'event SIGNED_OUT va automatiquement mettre à jour l'état
  }, []);

  return {
    isLoading: state.status === 'loading',
    isAuthenticated: state.status === 'authenticated',
    user: state.status === 'authenticated' ? state.user : null,
    session: state.status === 'authenticated' ? state.session : null,
    logout,
  };
}