import { useEffect, useState } from 'react';
import { supabase, getCurrentSession } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: Session; user: User }
  | { status: 'unauthenticated' };

/**
 * Hook d'authentification global.
 * Gère : état de chargement, session courante, écoute des changements.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    // 1. Récupérer la session au démarrage
    (async () => {
      const session = await getCurrentSession();
      if (!mounted) return;

      if (session) {
        setState({ status: 'authenticated', session, user: session.user });
      } else {
        setState({ status: 'unauthenticated' });
      }
    })();

    // 2. Écouter les changements (login, logout, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        if (session) {
          setState({ status: 'authenticated', session, user: session.user });
        } else {
          setState({ status: 'unauthenticated' });
        }
      }
    );

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