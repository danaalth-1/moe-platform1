import { useState } from 'react';
import { ClipboardList, Users, Settings, FileBarChart, Inbox } from 'lucide-react';
import { DashboardLayout, PlaceholderSection, type NavItem } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import ManagerEmployees from '@/components/manager/ManagerEmployees';
import ManagerInitiatives from '@/components/manager/ManagerInitiatives';
import ManagerConnectionRequests from '@/components/manager/ManagerConnectionRequests';

const navItems: NavItem[] = [
  { key: 'initiatives', label: 'المبادرات', icon: <ClipboardList className="h-5 w-5" /> },
  { key: 'employees', label: 'الموظفون', icon: <Users className="h-5 w-5" /> },
  { key: 'requests', label: 'طلبات الموظفين', icon: <Inbox className="h-5 w-5" /> },
  { key: 'settings', label: 'الشعارات والإعدادات', icon: <Settings className="h-5 w-5" /> },
];

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const [active, setActive] = useState('initiatives');

  const content = () => {
    switch (active) {
      case 'initiatives':
        return <ManagerInitiatives />;
      case 'employees':
        return <ManagerEmployees />;
      case 'requests':
        return <ManagerConnectionRequests />;
      case 'settings':
        return (
          <PlaceholderSection
            icon={<Settings className="h-8 w-8" />}
            title="الشعارات والإعدادات"
            description="إدارة الشعارات الرسمية وإعدادات النظام العامة."
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeKey={active}
      onNavigate={setActive}
      roleLabel="لوحة المدير"
    >
      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
          مرحبًا، {profile?.full_name?.split(' ')[0] ?? 'المدير'}
        </h1>
        <p className="text-gray-500 text-sm flex items-center gap-2">
          <FileBarChart className="h-4 w-4" />
          نظرة عامة على المبادرات التعليمية
        </p>
      </div>
      {content()}
    </DashboardLayout>
  );
}
