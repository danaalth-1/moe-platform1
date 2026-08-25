import { useEffect, useState } from 'react';
import { UserCheck, XCircle, Loader2, Inbox, Check, X } from 'lucide-react';
import { supabase, type ConnectionRequest } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function ManagerConnectionRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('connection_requests')
      .select(
        'id, employee_id, manager_id, status, created_at, employee:profiles!connection_requests_employee_id_fkey(id, full_name, email, role)'
      )
      .eq('manager_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
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

  const handleAction = async (req: ConnectionRequest, newStatus: 'approved' | 'rejected') => {
    setActionId(req.id);
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: newStatus })
      .eq('id', req.id);

    if (error) {
      setActionId(null);
      return;
    }

    await load();
    setActionId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-center">
        <div className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mb-3">
          <Inbox className="h-7 w-7" />
        </div>
        <p className="text-gray-400 text-sm">لا توجد طلبات ارتباط حاليًا</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
          <Inbox className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-gray-800">طلبات الموظفين</h3>
          <p className="text-sm text-gray-500">
            {requests.filter((r) => r.status === 'pending').length} طلب قيد الانتظار
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {requests.map((req) => {
          const isPending = req.status === 'pending';
          const isApproved = req.status === 'approved';
          const isRejected = req.status === 'rejected';
          const isActing = actionId === req.id;

          return (
            <div
              key={req.id}
              className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-11 w-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold shrink-0">
                  {req.employee?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {req.employee?.full_name ?? 'موظف'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{req.employee?.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(req.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Status or actions */}
              <div className="shrink-0">
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(req, 'approved')}
                      disabled={isActing}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success-600 disabled:opacity-50"
                    >
                      {isActing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      قبول
                    </button>
                    <button
                      onClick={() => handleAction(req, 'rejected')}
                      disabled={isActing}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-error-50 px-4 py-2.5 text-sm font-semibold text-error-600 transition-colors hover:bg-error-100 disabled:opacity-50"
                    >
                      {isActing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      رفض
                    </button>
                  </div>
                ) : isApproved ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 text-success-600 px-3 py-1.5 text-xs font-medium">
                    <UserCheck className="h-3.5 w-3.5" />
                    تمت الموافقة
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-error-50 text-error-600 px-3 py-1.5 text-xs font-medium">
                    <XCircle className="h-3.5 w-3.5" />
                    تم الرفض
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
