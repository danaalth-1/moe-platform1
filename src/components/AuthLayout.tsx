import type { ReactNode } from 'react';
import { MoELogo } from '@/components/MoELogo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-primary-50/30 flex flex-col">
      {/* Top bar */}
      <header className="bg-white shadow-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MoELogo className="h-10 w-10" />
            <div className="leading-tight">
              <p className="font-heading font-bold text-primary-900 text-sm sm:text-base">
                وزارة التعليم
              </p>
              <p className="text-xs text-gray-500">المملكة العربية السعودية</p>
            </div>
          </div>
          <p className="hidden sm:block text-sm text-gray-500 font-medium">
            منصة المبادرات التعليمية
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <MoELogo className="h-16 w-16" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mb-2">
              {title}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">{subtitle}</p>
          </div>
          <div className="card p-6 sm:p-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        © 2026 وزارة التعليم — المملكة العربية السعودية
      </footer>
    </div>
  );
}
