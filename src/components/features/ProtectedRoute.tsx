import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/storeContext';
import { Zap } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, authLoading } = useStore();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-pulse-glow">
            <Zap className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
