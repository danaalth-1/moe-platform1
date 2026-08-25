import { useEffect, useState, type FormEvent } from 'react';
import { Mail, CircleAlert as AlertCircle, Loader as Loader2, UserCheck, Clock, Circle as XCircle, Link2 } from 'lucide-react';
import { supabase, type ConnectionRequest } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CONNECTION_STATUS_LABELS } from '@/lib/supabase';

export default function EmployeeConnection() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('connection_requests')
      .select(
        'id, employee_id, manager_id, status, created_at, manager:profiles!connection_requests_manager_id_fkey(id, full_name, email, role)'
      )
      .eq('employee_id', user!.id)
      .order('created_at', { ascending: false });

    if (queryError) {
      setRequests([]);
    } else {
      setRequests((data ?? []) as unknown as ConnectionRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === user?.email?.toLowerCase()) {
      setError('لا يمكنك إرسال طلب لنفسك');
      setSending(false);
      return;
    }

    const { data: mgrRows, error: mgrError } = await supabase
      .rpc('lookup_manager_for_employee', { p_email: normalizedEmail });

    if (mgrError || !mgrRows || mgrRows.length === 0) {
      setError('لم يتم العثور على البريد الإلكتروني');
      setSending(false);
      return;
    }

    const manager = mgrRows[0] as { id: string; full_name: string; email: string; role: string };

    const { error: insertError } = await supabase.from('connection_requests').insert({
      employee_id: user!.id,
      manager_id: manager.id,
      status: 'pending',
    });

    if (insertError) {
      if (insertError.code === '23505') {
        setError('لقد أرسلت طلبًا لهذا المدير من قبل');
      } else {
        setError(insertError.message);
      }
      setSending(false);
      return;
    }

    setEmail('');
    await load();
    setSending(false);
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50' },
    approved: { icon: UserCheck, color: 'text-success-600', bg: 'bg-success-50' },
    rejected: { icon: XCircle, color: 'text-error-600', bg: 'bg-error-50' },
  };

  const hasApproved = requests.some((r) => r.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Send request */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-800">طلب الارتباط بمدير</h3>
            <p className="text-sm text-gray-500">
              أدخل البريد الإلكتروني للمدير لإرسال طلب ارتباط
            </p>
          </div>
        </div>

        <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="بريد المدير الإلكتروني"
              className="input-field pr-11"
            />
          </div>
          <button type="submit" disabled={sending} className="btn-primary sm:w-auto">
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Link2 className="h-5 w-5" />}
            إرسال الطلب
          </button>
        </form>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-error-50 border border-error-500/20 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {hasApproved && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-success-50 border border-success-500/20 px-4 py-3 text-sm text-success-700">
            <UserCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <span>تمت الموافقة على طلبك. يمكنك الآن إنشاء وإرسال المبادرات.</span>
          </div>
        )}
      </div>

      {/* Request history */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-800">طلباتي</h3>
            <p className="text-sm text-gray-500">
              {requests.length === 0 ? 'لم ترسل أي طلب بعد' : `${requests.length} طلب`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mb-3">
              <Link2 className="h-7 w-7" />
            </div>
            <p className="text-gray-400 text-sm">لم ترسل أي طلب ارتباط بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => {
              const cfg = statusConfig[req.status];
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3"
                >
                  <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {req.manager?.full_name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {req.manager?.full_name ?? 'مدير'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {new Date(req.created_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} ${cfg.color} px-3 py-1.5 text-xs font-medium`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {CONNECTION_STATUS_LABELS[req.status]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
