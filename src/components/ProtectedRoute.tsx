import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/supabase';
import { MoELogo } from '@/components/MoELogo';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: UserRole;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <MoELogo className="h-16 w-16 animate-pulse" />
      <p className="text-gray-500 font-medium">جارٍ التحميل...</p>
    </div>
  );
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile && profile.role !== allowedRole) {
    const redirect = profile.role === 'manager' ? '/manager' : '/employee';
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
