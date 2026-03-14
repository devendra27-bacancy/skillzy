export type UserRole = "teacher" | "student" | "admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  provider?: "google" | "demo";
  schoolId?: string;
  subject?: string;
  classSize?: number;
}

export interface AuthSession {
  user: User | null;
  authenticated: boolean;
  provider: "google" | "demo" | "none";
}
