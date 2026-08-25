import { useState } from 'react';
import { FolderOpen, CirclePlus as PlusCircle, ChartBar as FileBarChart, Link2 } from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import MyInitiatives from '@/components/employee/MyInitiatives';
import InitiativeForm from '@/components/employee/InitiativeForm';
import EmployeeConnection from '@/components/employee/EmployeeConnection';

const navItems: NavItem[] = [
  { key: 'my-initiatives', label: 'مبادراتي', icon: <FolderOpen className="h-5 w-5" /> },
  { key: 'create', label: 'إنشاء مبادرة', icon: <PlusCircle className="h-5 w-5" /> },
  { key: 'connect', label: 'طلب الارتباط بمدير', icon: <Link2 className="h-5 w-5" /> },
];

export default function EmployeeDashboard() {
  const { profile } = useAuth();
  const [active, setActive] = useState('my-initiatives');

  const content = () => {
    switch (active) {
      case 'my-initiatives':
        return <MyInitiatives />;
      case 'create':
        return <InitiativeForm onSubmitted={() => setActive('my-initiatives')} onGoToConnect={() => setActive('connect')} />;
      case 'connect':
        return <EmployeeConnection />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeKey={active}
      onNavigate={setActive}
      roleLabel="لوحة الموظف"
    >
      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
          مرحبًا، {profile?.full_name?.split(' ')[0] ?? 'الموظف'}
        </h1>
        <p className="text-gray-500 text-sm flex items-center gap-2">
          <FileBarChart className="h-4 w-4" />
          {active === 'create' ? 'أنشئ مبادرة تعليمية جديدة' : 'ابدأ بإنشاء مبادرة تعليمية جديدة'}
        </p>
      </div>
      {content()}
    </DashboardLayout>
  );
}
