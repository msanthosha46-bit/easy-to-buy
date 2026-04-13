import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/stores/storeContext';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { login, logout } = useStore();

  useEffect(() => {
    /* ✅ 1. Get user ONCE */
    const getInitialUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        login({
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          email: data.user.email || '',
        });
      }
    };

    getInitialUser();

    /* ✅ 2. Listen to auth changes */
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          login({
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            email: session.user.email || '',
          });
        } else {
          logout();
        }
      }
    );

    /* ✅ 3. Cleanup (VERY IMPORTANT) */
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []); // ✅ MUST be empty

  return <>{children}</>;
};