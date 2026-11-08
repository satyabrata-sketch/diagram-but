export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export type DocumentCategory = 'Diagram' | 'Document' | 'Image' | 'PDF' | 'Excel' | 'Archive' | 'Other';

export interface DocumentItem {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  type: string | null;
  category: DocumentCategory | string | null;
  file_url: string | null;
  created_at: string;
  created_by: string | null;
  user_id: string | null;
}

export interface SessionUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
}
