import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Initiative } from '@/lib/supabase';
import {
  INITIATIVE_TYPE_LABELS,
  TARGET_CATEGORY_LABELS,
  STATUS_LABELS,
} from '@/lib/supabase';

interface Props {
  initiative: Initiative;
  onClose: () => void;
  showEmployee?: boolean;
}

interface FieldDef {
  label: string;
  value: string;
}

function Section({ title, fields }: { title: string; fields: FieldDef[] }) {
  return (
    <div className="mb-6">
      <h3 className="font-heading text-sm font-bold text-primary-700 mb-3 pb-2 border-b border-primary-100">
        {title}
      </h3>
      <dl className="space-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-xs font-semibold text-gray-400 mb-1">{f.label}</dt>
            <dd className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {f.value || '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function InitiativeDetailModal({ initiative, onClose, showEmployee }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-700">
                {STATUS_LABELS[initiative.status] ?? initiative.status}
              </span>
              <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                {INITIATIVE_TYPE_LABELS[initiative.initiative_type]}
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold text-gray-800">{initiative.name}</h2>
            {showEmployee && (
              <p className="text-sm text-gray-500 mt-1">
                مقدّم من: {initiative.employee?.full_name ?? 'موظف'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 shrink-0"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <Section
            title="الصفحة 1 — اسم المبادرة وفكرتها"
            fields={[
              { label: 'اسم المبادرة', value: initiative.name },
              { label: 'وصف فكرة المبادرة', value: initiative.idea_description },
              { label: 'اسم المدرسة أو الجهة', value: initiative.school_or_entity },
              { label: 'اسم منسق المبادرة', value: initiative.coordinator_name },
              { label: 'تاريخ الإطلاق', value: fmtDate(initiative.launch_date) },
              { label: 'نوع المبادرة', value: INITIATIVE_TYPE_LABELS[initiative.initiative_type] },
            ]}
          />
          <Section
            title="الصفحة 2 — مبررات المبادرة واحتياجها"
            fields={[
              { label: 'المشكلة أو الحاجة', value: initiative.problem_need },
              { label: 'المؤشرات والشواهد', value: initiative.need_indicators },
            ]}
          />
          <Section
            title="الصفحة 3 — الهدف والفئة المستهدفة"
            fields={[
              { label: 'الهدف العام', value: initiative.general_goal },
              { label: 'الأهداف التفصيلية', value: initiative.detailed_goals },
              { label: 'الفئة المستهدفة', value: initiative.target_audience },
              {
                label: 'تصنيف الفئة المستهدفة',
                value: TARGET_CATEGORY_LABELS[initiative.target_category],
              },
            ]}
          />
          <Section
            title="الصفحة 4 — خطة التنفيذ"
            fields={[
              { label: 'الإجراءات التنفيذية', value: initiative.execution_actions },
              { label: 'المراحل الأساسية', value: initiative.execution_phases },
            ]}
          />
          <Section
            title="الصفحة 5 — مؤشرات الأداء والنتائج المستهدفة"
            fields={[
              { label: 'مؤشرات الأداء', value: initiative.performance_indicators },
              { label: 'النتائج المستهدفة', value: initiative.targeted_results },
            ]}
          />
          <Section
            title="الصفحة 6 — الأثر وقياس النتائج"
            fields={[
              { label: 'آلية قياس الأثر', value: initiative.impact_measurement },
              { label: 'مقارنة النتائج بخط الأساس', value: initiative.baseline_comparison },
            ]}
          />
          <Section
            title="الصفحة 7 — الاستدامة والتوسع"
            fields={[
              { label: 'آلية الاستمرار', value: initiative.sustainability_plan },
              { label: 'خطة التوسع', value: initiative.expansion_plan },
            ]}
          />
          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
            تاريخ التقديم: {fmtDate(initiative.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
