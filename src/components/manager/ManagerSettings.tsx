import { useEffect, useState, useCallback, useRef } from 'react';
import { Settings, Upload, Trash2, Loader as Loader2, CircleAlert as AlertCircle, Image as ImageIcon, Check, Star, X } from 'lucide-react';
import { supabase, type ManagerLogo } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function ManagerSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logos, setLogos] = useState<ManagerLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadLogos = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('manager_logos')
      .select('*')
      .eq('manager_id', user!.id)
      .order('created_at', { ascending: false });

    if (queryError) {
      setError('تعذر تحميل الشعارات');
      setLogos([]);
    } else {
      const rows = (data ?? []) as ManagerLogo[];
      // Generate signed URLs for private bucket
      const withUrls = await Promise.all(
        rows.map(async (logo) => {
          const { data: signed } = await supabase.storage
            .from('manager-logos')
            .createSignedUrl(logo.storage_path, 3600);
          return { ...logo, public_url: signed?.signedUrl ?? logo.public_url };
        })
      );
      setLogos(withUrls);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadLogos();
  }, [loadLogos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('يجب اختيار ملف صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    setPendingFile(file);
    setPreviewName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!pendingFile || !user) return;
    setUploading(true);
    setError(null);

    const ext = pendingFile.name.split('.').pop() ?? 'png';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('manager-logos')
      .upload(fileName, pendingFile, { contentType: pendingFile.type });

    if (uploadError) {
      setError('تعذر رفع الصورة: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: signed } = await supabase.storage
      .from('manager-logos')
      .createSignedUrl(fileName, 3600);

    const { error: insertError } = await supabase.from('manager_logos').insert({
      manager_id: user.id,
      storage_path: fileName,
      public_url: signed?.signedUrl ?? '',
      file_name: pendingFile.name,
      selected_for_pdf: false,
    });

    if (insertError) {
      setError('تعذر حفظ الشعار: ' + insertError.message);
      setUploading(false);
      return;
    }

    setPendingFile(null);
    setPreviewUrl(null);
    setPreviewName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    await loadLogos();
    setUploading(false);
  };

  const handleCancelPreview = () => {
    setPendingFile(null);
    setPreviewUrl(null);
    setPreviewName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (logo: ManagerLogo) => {
    setActionId(logo.id);

    const { error: storageError } = await supabase.storage
      .from('manager-logos')
      .remove([logo.storage_path]);

    if (storageError) {
      // Try to delete the DB row anyway — orphaned storage objects are not critical
    }

    const { error: dbError } = await supabase
      .from('manager_logos')
      .delete()
      .eq('id', logo.id);

    if (dbError) {
      setError('تعذر حذف الشعار');
      setActionId(null);
      return;
    }

    setLogos((prev) => prev.filter((l) => l.id !== logo.id));
    setActionId(null);
  };

  const handleToggleSelect = async (logo: ManagerLogo) => {
    setActionId(logo.id);

    if (logo.selected_for_pdf) {
      // Unselect
      const { error } = await supabase
        .from('manager_logos')
        .update({ selected_for_pdf: false })
        .eq('id', logo.id);
      if (error) {
        setError('تعذر تحديث التحديد');
        setActionId(null);
        return;
      }
      setLogos((prev) =>
        prev.map((l) => (l.id === logo.id ? { ...l, selected_for_pdf: false } : l))
      );
    } else {
      // Select — first unselect all others, then select this one
      await supabase
        .from('manager_logos')
        .update({ selected_for_pdf: false })
        .eq('manager_id', user!.id)
        .neq('id', logo.id);

      const { error } = await supabase
        .from('manager_logos')
        .update({ selected_for_pdf: true })
        .eq('id', logo.id);
      if (error) {
        setError('تعذر تحديث التحديد');
        setActionId(null);
        return;
      }
      setLogos((prev) =>
        prev.map((l) => ({
          ...l,
          selected_for_pdf: l.id === logo.id,
        }))
      );
    }
    setActionId(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-800">رفع شعار جديد</h3>
            <p className="text-sm text-gray-500">
              ارفع شعارًا ليُستخدم في ملفات المبادرات المستقبلية (حتى 5 ميجابايت)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="cursor-pointer flex-1 w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-300 transition-colors px-4 py-6 text-center">
              <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {pendingFile ? previewName : 'اختر صورة من جهازك'}
              </p>
            </div>
          </label>

          {pendingFile && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
                {uploading ? 'جارٍ الرفع...' : 'حفظ الشعار'}
              </button>
              <button
                onClick={handleCancelPreview}
                disabled={uploading}
                className="btn-secondary"
              >
                <X className="h-5 w-5" />
                إلغاء
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50/30 p-4">
            <p className="text-xs font-semibold text-primary-700 mb-2">معاينة الشعار</p>
            <div className="flex items-center justify-center bg-white rounded-lg border border-gray-100 p-4">
              <img
                src={previewUrl}
                alt={previewName}
                className="max-h-32 object-contain"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-error-50 border border-error-500/20 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Logo gallery */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-800">الشعارات المحفوظة</h3>
            <p className="text-sm text-gray-500">
              {logos.length === 0
                ? 'لا توجد شعارات محفوظة'
                : `${logos.length} شعار — ${logos.filter((l) => l.selected_for_pdf).length} محدد للملفات`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : logos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mb-3">
              <ImageIcon className="h-7 w-7" />
            </div>
            <p className="text-gray-400 text-sm">لم تقم برفع أي شعار بعد</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {logos.map((logo) => {
              const isActing = actionId === logo.id;
              return (
                <div
                  key={logo.id}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    logo.selected_for_pdf
                      ? 'border-primary-600 bg-primary-50/30'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3 mb-3 h-32">
                    <img
                      src={logo.public_url}
                      alt={logo.file_name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-3" title={logo.file_name}>
                    {logo.file_name}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSelect(logo)}
                      disabled={isActing}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        logo.selected_for_pdf
                          ? 'bg-primary-700 text-white hover:bg-primary-800'
                          : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                      }`}
                    >
                      {isActing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : logo.selected_for_pdf ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Star className="h-3.5 w-3.5" />
                      )}
                      {logo.selected_for_pdf ? 'محدد للملفات' : 'تحديد للملفات'}
                    </button>
                    <button
                      onClick={() => handleDelete(logo)}
                      disabled={isActing}
                      className="inline-flex items-center justify-center rounded-lg bg-error-50 text-error-600 px-3 py-2 transition-colors hover:bg-error-100 disabled:opacity-50"
                      aria-label="حذف الشعار"
                    >
                      {isActing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
