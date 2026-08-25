import { useEffect, useState, type FormEvent } from 'react';
import { UserPlus, Trash2, Mail, AlertCircle, Users, Loader2 } from 'lucide-react';
import { supabase, type Assignment } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function ManagerEmployees() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loadAssignments = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('id, employee_id, created_at, employee:profiles!assignments_employee_id_fkey(id, full_name, email, role)')
      .eq('manager_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError('تعذر تحميل قائمة الموظفين');
      return [];
    }
    return (data ?? []) as unknown as Assignment[];
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const rows = await loadAssignments();
      setAssignments(rows);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setAdding(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === user?.email?.toLowerCase()) {
      setError('لا يمكنك إضافة نفسك كموظف');
      setAdding(false);
      return;
    }

    const { data: empData, error: empError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (empError || !empData) {
      setError('لا يوجد حساب بهذا البريد الإلكتروني');
      setAdding(false);
      return;
    }

    if (empData.role !== 'employee') {
      setError('هذا الحساب ليس موظفًا');
      setAdding(false);
      return;
    }

    const alreadyAssigned = assignments.some((a) => a.employee_id === empData.id);
    if (alreadyAssigned) {
      setError('هذا الموظف مُعين لديك بالفعل');
      setAdding(false);
      return;
    }

    const { error: insertError } = await supabase.from('assignments').insert({
      manager_id: user!.id,
      employee_id: empData.id,
    });

    if (insertError) {
      setError(insertError.message);
      setAdding(false);
      return;
    }

    setEmail('');
    const rows = await loadAssignments();
    setAssignments(rows);
    setAdding(false);
  };

  const handleRemove = async (assignmentId: string) => {
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      setError('تعذر إزالة الموظف');
      return;
    }

    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  return (
    <div className="space-y-6">
      {/* Add employee */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-800">إضافة موظف</h3>
            <p className="text-sm text-gray-500">أدخل البريد الإلكتروني للموظف لإضافته إلى فريقك</p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="بريد الموظف الإلكتروني"
              className="input-field pr-11"
            />
          </div>
          <button type="submit" disabled={adding} className="btn-primary sm:w-auto">
            {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
            إضافة
          </button>
        </form>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-error-50 border border-error-500/20 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Employee list */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-800">الموظفون المعيّنون</h3>
            <p className="text-sm text-gray-500">
              {assignments.length === 0
                ? 'لا يوجد موظفون معيّنون حاليًا'
                : `${assignments.length} موظف`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mb-3">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-gray-400 text-sm">لم تقم بإضافة أي موظف بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {a.employee?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {a.employee?.full_name ?? 'موظف'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{a.employee?.email}</p>
                </div>
                <button
                  onClick={() => handleRemove(a.id)}
                  className="p-2 rounded-lg text-error-500 hover:bg-error-50 transition-colors"
                  aria-label="إزالة الموظف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
