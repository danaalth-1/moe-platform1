import { useEffect, useState } from 'react';
import { FolderOpen, Loader2, Eye, CalendarDays, FileText } from 'lucide-react';
import { supabase, type Initiative } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { InitiativeDetailModal } from '@/components/InitiativeDetailModal';
import { STATUS_LABELS, INITIATIVE_TYPE_LABELS } from '@/lib/supabase';

export default function MyInitiatives() {
  const { user } = useAuth();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Initiative | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('initiatives')
      .select(
        'id, employee_id, manager_id, status, created_at, name, idea_description, school_or_entity, coordinator_name, launch_date, initiative_type, problem_need, need_indicators, general_goal, detailed_goals, target_audience, target_category, execution_actions, execution_phases, performance_indicators, targeted_results, impact_measurement, baseline_comparison, sustainability_plan, expansion_plan'
      )
      .eq('employee_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      setInitiatives([]);
    } else {
      setInitiatives((data ?? []) as unknown as Initiative[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
          <FolderOpen className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-gray-800">مبادراتي</h3>
          <p className="text-sm text-gray-500">
            {initiatives.length === 0 ? 'لم تنشئ أي مبادرة بعد' : `${initiatives.length} مبادرة`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : initiatives.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mb-3">
            <FolderOpen className="h-7 w-7" />
          </div>
          <p className="text-gray-400 text-sm mb-4">لم تنشئ أي مبادرة بعد</p>
          <p className="text-xs text-gray-400">انتقل إلى "إنشاء مبادرة" لبدء مبادرة جديدة</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initiatives.map((init) => (
            <button
              key={init.id}
              onClick={() => setSelected(init)}
              className="card p-5 text-right hover:shadow-soft hover:border-primary-100 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-700">
                  {STATUS_LABELS[init.status] ?? init.status}
                </span>
                <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                  {INITIATIVE_TYPE_LABELS[init.initiative_type] ?? init.initiative_type}
                </span>
              </div>
              <h4 className="font-heading font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                {init.name}
              </h4>
              <div className="space-y-1.5 text-xs text-gray-400">
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  تاريخ الإطلاق: {fmtDate(init.launch_date)}
                </p>
                <p className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  التقديم: {fmtDate(init.created_at)}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-end">
                <span className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
                  <Eye className="h-3.5 w-3.5" />
                  عرض التفاصيل
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <InitiativeDetailModal initiative={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
