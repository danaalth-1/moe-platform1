import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  Briefcase,
  Users,
} from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/supabase';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await signUp({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      role,
    });

    if (signUpError) {
      setError(signUpError);
      setSubmitting(false);
      return;
    }

    navigate(role === 'manager' ? '/manager' : '/employee', { replace: true });
  };

  return (
    <AuthLayout
      title="إنشاء حساب جديد"
      subtitle="سجّل في منصة المبادرات التعليمية"
      footer={
        <p>
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-primary-700 font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-500/20 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1.5">
            الاسم الكامل
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="الاسم الثلاثي"
              className="input-field pr-11"
              autoComplete="name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
            البريد الإلكتروني
          </label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@moe.gov.sa"
              className="input-field pr-11"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
            كلمة المرور
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pr-11 pl-11"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
            تأكيد كلمة المرور
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pr-11"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">الصفة الوظيفية</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('manager')}
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-right transition-all duration-200 ${
                role === 'manager'
                  ? 'border-primary-600 bg-primary-50 text-primary-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200'
              }`}
            >
              <Briefcase
                className={`h-6 w-6 ${role === 'manager' ? 'text-primary-600' : 'text-gray-400'}`}
              />
              <div>
                <p className="font-bold text-sm">مدير</p>
                <p className="text-xs text-gray-500">إدارة الموظفين والمبادرات</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('employee')}
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-right transition-all duration-200 ${
                role === 'employee'
                  ? 'border-primary-600 bg-primary-50 text-primary-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200'
              }`}
            >
              <Users
                className={`h-6 w-6 ${role === 'employee' ? 'text-primary-600' : 'text-gray-400'}`}
              />
              <div>
                <p className="font-bold text-sm">موظف</p>
                <p className="text-xs text-gray-500">إنشاء وإدارة المبادرات</p>
              </div>
            </button>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          <UserPlus className="h-5 w-5" />
          {submitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
        </button>
      </form>
    </AuthLayout>
  );
}
