// ユーザー関連の型定義
export interface User {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  email: string | null;
  role: 'admin' | 'user';
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserWithoutPassword extends Omit<User, 'password_hash'> {}

// 法人情報関連の型定義
export interface Company {
  id: number;
  name: string;
  name_kana: string | null;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  employee_count: number | null;
  capital: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// 取引先担当者関連の型定義
export interface Contact {
  id: number;
  company_id: number;
  name: string;
  name_kana: string | null;
  department: string | null;
  position: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// 当方担当者割り当て関連の型定義
export interface CompanyAssignment {
  id: number;
  company_id: number;
  user_id: number;
  is_primary: number;
  assigned_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// 活動履歴関連の型定義
export type ActivityType = 'visit' | 'phone' | 'email' | 'web_meeting' | 'other';

export interface ActivityLog {
  id: number;
  company_id: number;
  user_id: number;
  activity_date: string;
  activity_type: ActivityType;
  content: string;
  next_action_date: string | null;
  next_action_content: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// セッション関連の型定義
export interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'user';
}

// Express Request拡張
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}
