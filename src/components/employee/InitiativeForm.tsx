import { useState, type FormEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Send, AlertCircle, Loader2, Info, CheckCircle2, Link2 } from 'lucide-react';
import { supabase, type InitiativeType, type TargetCategory } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface FormData {
  name: string;
  idea_description: string;
  school_or_entity: string;
  coordinator_name: string;
  launch_date: string;
  initiative_type: InitiativeType;
  problem_need: string;
  need_indicators: string;
  general_goal: string;
  detailed_goals: string;
  target_audience: string;
  target_category: TargetCategory;
  execution_actions: string;
  execution_phases: string;
  performance_indicators: string;
  targeted_results: string;
  impact_measurement: string;
  baseline_comparison: string;
  sustainability_plan: string;
  expansion_plan: string;
}

const EMPTY: FormData = {
  name: '',
  idea_description: '',
  school_or_entity: '',
  coordinator_name: '',
  launch_date: '',
  initiative_type: 'educational',
  problem_need: '',
  need_indicators: '',
  general_goal: '',
  detailed_goals: '',
  target_audience: '',
  target_category: 'skill_development',
  execution_actions: '',
  execution_phases: '',
  performance_indicators: '',
  targeted_results: '',
  impact_measurement: '',
  baseline_comparison: '',
  sustainability_plan: '',
  expansion_plan: '',
};

const TOTAL_STEPS = 7;

interface StepProps {
  data: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-error-500 mr-1">*</span>}
    </label>
  );
}

function TextArea({ value, onChange, placeholder, required }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      rows={4}
      className="input-field resize-y min-h-[100px]"
    />
  );
}

function Step1({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>اسم المبادرة</FieldLabel>
        <input
          type="text"
          required
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          className="input-field"
          placeholder="أدخل اسم المبادرة"
        />
      </div>
      <div>
        <FieldLabel required>وصف فكرة المبادرة</FieldLabel>
        <TextArea
          value={data.idea_description}
          onChange={(v) => update('idea_description', v)}
          placeholder="اشرح فكرة المبادرة بإيجاز"
          required
        />
      </div>
      <div>
        <FieldLabel required>اسم المدرسة أو الجهة</FieldLabel>
        <input
          type="text"
          required
          value={data.school_or_entity}
          onChange={(e) => update('school_or_entity', e.target.value)}
          className="input-field"
          placeholder="اسم المدرسة أو الجهة التابعة لها"
        />
      </div>
      <div>
        <FieldLabel required>اسم منسق المبادرة</FieldLabel>
        <input
          type="text"
          required
          value={data.coordinator_name}
          onChange={(e) => update('coordinator_name', e.target.value)}
          className="input-field"
          placeholder="اسم المنسق المسؤول"
        />
      </div>
      <div>
        <FieldLabel required>تاريخ الإطلاق</FieldLabel>
        <input
          type="date"
          required
          value={data.launch_date}
          onChange={(e) => update('launch_date', e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <FieldLabel required>نوع المبادرة</FieldLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            ['educational', 'تعليمية'],
            ['community', 'مجتمعية'],
            ['developmental', 'تطويرية'],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => update('initiative_type', val)}
              className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                data.initiative_type === val
                  ? 'border-primary-600 bg-primary-50 text-primary-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>المشكلة أو الحاجة التي تستهدفها المبادرة</FieldLabel>
        <TextArea
          value={data.problem_need}
          onChange={(v) => update('problem_need', v)}
          placeholder="صف المشكلة أو الحاجة التي تعالجها المبادرة"
          required
        />
      </div>
      <div>
        <FieldLabel required>المؤشرات والشواهد التي تدعم الحاجة للمبادرة</FieldLabel>
        <TextArea
          value={data.need_indicators}
          onChange={(v) => update('need_indicators', v)}
          placeholder="اذكر الأدلة والإحصاءات التي تبرر الحاجة للمبادرة"
          required
        />
      </div>
    </div>
  );
}

function Step3({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>الهدف العام للمبادرة</FieldLabel>
        <TextArea
          value={data.general_goal}
          onChange={(v) => update('general_goal', v)}
          placeholder="ما الهدف الرئيسي الذي تسعى المبادرة لتحقيقه؟"
          required
        />
      </div>
      <div>
        <FieldLabel required>الأهداف التفصيلية</FieldLabel>
        <TextArea
          value={data.detailed_goals}
          onChange={(v) => update('detailed_goals', v)}
          placeholder="اذكر الأهداف الفرعية بالتفصيل"
          required
        />
      </div>
      <div>
        <FieldLabel required>الفئة المستهدفة</FieldLabel>
        <input
          type="text"
          required
          value={data.target_audience}
          onChange={(e) => update('target_audience', e.target.value)}
          className="input-field"
          placeholder="من هم المستفيدون من المبادرة؟"
        />
      </div>
      <div>
        <FieldLabel required>تصنيف الفئة المستهدفة</FieldLabel>
        <div className="grid grid-cols-1 gap-3">
          {([
            ['skill_development', 'تنمية المهارات'],
            ['academic_support', 'الدعم الأكاديمي'],
            ['community_participation', 'المشاركة المجتمعية'],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => update('target_category', val)}
              className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all text-right ${
                data.target_category === val
                  ? 'border-primary-600 bg-primary-50 text-primary-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>الإجراءات التنفيذية</FieldLabel>
        <TextArea
          value={data.execution_actions}
          onChange={(v) => update('execution_actions', v)}
          placeholder="ما الإجراءات والخطوات التنفيذية للمبادرة؟"
          required
        />
      </div>
      <div>
        <FieldLabel required>المراحل الأساسية في كل مرحلة</FieldLabel>
        <p className="text-xs text-gray-400 mb-2">
          حدد مراحل التنفيذ والمدة الزمنية والأدوار
        </p>
        <TextArea
          value={data.execution_phases}
          onChange={(v) => update('execution_phases', v)}
          placeholder="صف المراحل والمدد الزمنية والمسؤوليات"
          required
        />
      </div>
    </div>
  );
}

function Step5({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>مؤشرات أداء واضحة وقابلة للقياس</FieldLabel>
        <p className="text-xs text-gray-400 mb-2">
          مثال: نسبة رضا المستفيدين، عدد المشاركين
        </p>
        <TextArea
          value={data.performance_indicators}
          onChange={(v) => update('performance_indicators', v)}
          placeholder="حدد مؤشرات الأداء القابلة للقياس"
          required
        />
      </div>
      <div>
        <FieldLabel required>النتائج المستهدفة</FieldLabel>
        <TextArea
          value={data.targeted_results}
          onChange={(v) => update('targeted_results', v)}
          placeholder="ما النتائج التي تسعى المبادرة لتحقيقها؟"
          required
        />
      </div>
    </div>
  );
}

function Step6({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>آلية قياس الأثر بعد التنفيذ</FieldLabel>
        <p className="text-xs text-gray-400 mb-2">
          كيف ستقيس نجاح المبادرة؟ (استبانات، مقارنات قبل وبعد…)
        </p>
        <TextArea
          value={data.impact_measurement}
          onChange={(v) => update('impact_measurement', v)}
          placeholder="صف آلية قياس الأثر"
          required
        />
      </div>
      <div>
        <FieldLabel required>مقارنة النتائج بخط الأساس</FieldLabel>
        <p className="text-xs text-gray-400 mb-2">
          ما الأدوات والشواهد التي ستستخدمها للمقارنة؟
        </p>
        <TextArea
          value={data.baseline_comparison}
          onChange={(v) => update('baseline_comparison', v)}
          placeholder="صف أدوات المقارنة بخط الأساس"
          required
        />
      </div>
    </div>
  );
}

function Step7({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>آلية استمرار المبادرة بعد انتهاء الفترة الزمنية</FieldLabel>
        <TextArea
          value={data.sustainability_plan}
          onChange={(v) => update('sustainability_plan', v)}
          placeholder="كيف ستستمر المبادرة بعد انتهاء فترتها؟"
          required
        />
      </div>
      <div>
        <FieldLabel required>خطة التوسع وتعميم المبادرة</FieldLabel>
        <TextArea
          value={data.expansion_plan}
          onChange={(v) => update('expansion_plan', v)}
          placeholder="ما خطة توسيع المبادرة وتعميمها؟"
          required
        />
      </div>
    </div>
  );
}

const STEPS: { title: string; component: (p: StepProps) => ReactNode }[] = [
  { title: 'اسم المبادرة وفكرتها', component: Step1 },
  { title: 'مبررات المبادرة واحتياجها', component: Step2 },
  { title: 'الهدف والفئة المستهدفة', component: Step3 },
  { title: 'خطة التنفيذ', component: Step4 },
  { title: 'مؤشرات الأداء والنتائج المستهدفة', component: Step5 },
  { title: 'الأثر وقياس النتائج', component: Step6 },
  { title: 'الاستدامة والتوسع', component: Step7 },
];

interface Props {
  onSubmitted: () => void;
  onGoToConnect: () => void;
}

export default function InitiativeForm({ onSubmitted, onGoToConnect }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [noManager, setNoManager] = useState(false);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const isStepValid = (): boolean => {
    const form = document.getElementById('initiative-form') as HTMLFormElement | null;
    if (!form) return false;
    // Trigger native validation for visible fields
    const inputs = form.querySelectorAll('input, textarea, select');
    for (const input of inputs) {
      const el = input as HTMLInputElement;
      if (el.required && !el.value) return false;
    }
    return true;
  };

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (!isStepValid()) {
      // Force native validation popup
      const form = document.getElementById('initiative-form') as HTMLFormElement;
      form?.reportValidity();
      return;
    }
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isStepValid()) {
      const form = document.getElementById('initiative-form') as HTMLFormElement;
      form?.reportValidity();
      return;
    }

    setError(null);
    setSubmitting(true);

    // Find the employee's manager assignment
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .select('manager_id')
      .eq('employee_id', user!.id)
      .maybeSingle();

    if (assignError) {
      setError('تعذر التحقق من تعيين المدير');
      setSubmitting(false);
      return;
    }

    if (!assignment) {
      setError(null);
      setNoManager(true);
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('initiatives').insert({
      employee_id: user!.id,
      manager_id: assignment.manager_id,
      status: 'under_review',
      ...data,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="card p-8 sm:p-12 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-success-50 text-success-600 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="font-heading text-xl font-bold text-gray-800 mb-2">تم إرسال المبادرة بنجاح</h3>
        <p className="text-gray-500 text-sm max-w-md mb-6">
          تم تسجيل مبادرتك ضمن قائمة المبادرات التعليمية وستظهر لدى مديرك للمراجعة.
        </p>
        <button onClick={onSubmitted} className="btn-primary">
          العودة إلى مبادراتي
        </button>
      </div>
    );
  }

  const CurrentStep = STEPS[step].component;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="card p-6 sm:p-8">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading text-lg font-bold text-gray-800">
            {STEPS[step].title}
          </h3>
          <span className="text-sm font-semibold text-primary-600">
            الصفحة {step + 1} من {TOTAL_STEPS}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => i <= step && setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? 'w-8 bg-primary-600'
                  : i < step
                    ? 'w-2 bg-primary-400'
                    : 'w-2 bg-gray-200'
              }`}
              aria-label={`الصفحة ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <form id="initiative-form" onSubmit={handleSubmit} className="space-y-6">
        <CurrentStep data={data} update={update} />

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-500/20 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {noManager && (
          <div className="rounded-lg bg-error-50 border border-error-500/20 px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-error-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-error-700 leading-relaxed mb-4">
                  لا يمكنك إرسال المبادرة قبل الارتباط بمدير. يرجى إرسال طلب ارتباط إلى مديرك أولًا.
                </p>
                <button
                  type="button"
                  onClick={onGoToConnect}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
                >
                  <Link2 className="h-4 w-4" />
                  طلب الارتباط بمدير
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Final step info box */}
        {step === TOTAL_STEPS - 1 && (
          <div className="flex items-start gap-3 rounded-lg bg-primary-50 border border-primary-100 px-4 py-3.5">
            <Info className="h-5 w-5 shrink-0 text-primary-600 mt-0.5" />
            <p className="text-sm text-primary-800 leading-relaxed">
              بعد إرسال المبادرة سيتم تسجيلها ضمن قائمة المبادرات التعليمية لتتمكن من متابعتها
              وتنظيم مراحل تنفيذها.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
            السابق
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button type="button" onClick={handleNext} className="btn-primary">
              التالي
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {submitting ? 'جارٍ الإرسال...' : 'إرسال المبادرة'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
