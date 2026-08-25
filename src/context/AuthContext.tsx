import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile, type UserRole } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (params: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; profile: Profile | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (!data.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (!newSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        setProfile(null);
      } else {
        setProfile(data as Profile | null);
      }
      setLoading(false);
    })();
  }, [user]);

  const signUp: AuthContextValue['signUp'] = async ({ fullName, email, password, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return { error: 'هذا البريد الإلكتروني مسجل بالفعل' };
      }
      return { error: error.message };
    }
    if (!data.user) return { error: 'تعذر إنشاء الحساب' };

    // The database trigger `handle_new_user` already created a profile row
    // from raw_user_meta_data. Update it with the exact values the user entered
    // so the role and full_name are authoritative (not dependent on metadata).
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      role,
    });
    if (profileError) return { error: profileError.message };
    return { error: null };
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Supabase returns a generic "Invalid login credentials" for both
      // wrong password and non-existing email (by design, for security).
      // We check the profiles table to give the user a clearer Arabic message.
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        const { data: existingUser } = await supabase
          .rpc('lookup_user_by_email', {
            p_email: email.trim().toLowerCase(),
            p_role: 'manager',
          });
        let found = existingUser && existingUser.length > 0;
        if (!found) {
          const { data: empUser } = await supabase
            .rpc('lookup_user_by_email', {
              p_email: email.trim().toLowerCase(),
              p_role: 'employee',
            });
          found = empUser && empUser.length > 0;
        }
        if (!found) {
          return { error: 'لا يوجد حساب بهذا البريد الإلكتروني', profile: null };
        }
        return { error: 'كلمة المرور غير صحيحة', profile: null };
      }
      return { error: error.message, profile: null };
    }

    // Fetch profile immediately so the caller can redirect by role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      return { error: 'تعذر تحميل بيانات المستخدم', profile: null };
    }

    setProfile(profileData as Profile);
    return { error: null, profile: profileData as Profile };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
