import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronLeft } from 'lucide-react';
import { MoELogo } from '@/components/MoELogo';
import { useAuth } from '@/context/AuthContext';

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  roleLabel: string;
  children: ReactNode;
}

export function DashboardLayout({
  navItems,
  activeKey,
  onNavigate,
  roleLabel,
  children,
}: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const activeItem = navItems.find((n) => n.key === activeKey);

  const sidebar = (
    <aside className="w-72 bg-white border-l border-gray-100 flex flex-col h-full">
      {/* Logo header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
        <MoELogo className="h-10 w-10" />
        <div className="leading-tight">
          <p className="font-heading font-bold text-primary-900 text-sm">وزارة التعليم</p>
          <p className="text-xs text-gray-500">{roleLabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onNavigate(item.key);
              setSidebarOpen(false);
            }}
            className={`nav-link w-full text-right ${activeKey === item.key ? 'nav-link-active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User + sign out */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
            {profile?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {profile?.full_name ?? 'مستخدم'}
            </p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative mr-auto h-full">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-gray-800 text-base sm:text-lg">
                {activeItem?.label}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="hidden sm:inline">منصة المبادرات التعليمية</span>
            <ChevronLeft className="h-4 w-4" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Close button for mobile */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-white shadow-card text-gray-600"
          aria-label="إغلاق القائمة"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function PlaceholderSection({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
      <div className="h-16 w-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="font-heading text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-md leading-relaxed">{description}</p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-medium text-primary-600">
        قريبًا
      </div>
    </div>
  );
}
