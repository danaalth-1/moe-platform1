import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'manager' | 'employee';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Assignment {
  id: string;
  manager_id: string;
  employee_id: string;
  created_at: string;
  employee?: Profile;
}

export type InitiativeType = 'educational' | 'community' | 'developmental';
export type TargetCategory = 'skill_development' | 'academic_support' | 'community_participation';
export type InitiativeStatus = 'under_review';

export interface Initiative {
  id: string;
  employee_id: string;
  manager_id: string | null;
  status: InitiativeStatus;
  created_at: string;
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
  employee?: Profile;
}

export const INITIATIVE_TYPE_LABELS: Record<InitiativeType, string> = {
  educational: 'تعليمية',
  community: 'مجتمعية',
  developmental: 'تطويرية',
};

export const TARGET_CATEGORY_LABELS: Record<TargetCategory, string> = {
  skill_development: 'تنمية المهارات',
  academic_support: 'الدعم الأكاديمي',
  community_participation: 'المشاركة المجتمعية',
};

export type ConnectionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ConnectionRequest {
  id: string;
  employee_id: string;
  manager_id: string;
  status: ConnectionRequestStatus;
  created_at: string;
  manager?: Profile;
  employee?: Profile;
}

export const CONNECTION_STATUS_LABELS: Record<ConnectionRequestStatus, string> = {
  pending: 'قيد الانتظار',
  approved: 'تمت الموافقة',
  rejected: 'تم الرفض',
};

export const STATUS_LABELS: Record<string, string> = {
  under_review: 'قيد المراجعة',
};
