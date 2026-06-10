// ============================================================
// ENUMS
// ============================================================

export type Plan = "starter" | "pro" | "enterprise";

export type Role = "owner" | "admin" | "staff" | "viewer";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type ConversationChannel = "voice" | "whatsapp" | "sms" | "web";

export type ConversationStatus = "active" | "resolved" | "pending" | "missed";

// ============================================================
// DATABASE ENTITIES
// ============================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  timezone?: string;
  currency?: string;
  language?: string;
  business_hours?: BusinessHours;
  notifications?: NotificationSettings;
  ai_settings?: AISettings;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  enabled: boolean;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export interface AISettings {
  voice_enabled: boolean;
  whatsapp_enabled: boolean;
  language: string;
  personality?: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  lead_score: number;
  metadata: CustomerMetadata;
  created_at: string;
  updated_at: string;
}

export interface CustomerMetadata {
  source?: string;
  notes?: string;
  last_contact?: string;
  preferences?: Record<string, unknown>;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type StaffRole = "admin" | "staff" | "viewer";

export interface StaffMember {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  name: string;
  role: StaffRole;
  availability: StaffAvailability;
  created_at: string;
  updated_at: string;
}

export interface StaffAvailability {
  monday?: AvailabilitySlot[];
  tuesday?: AvailabilitySlot[];
  wednesday?: AvailabilitySlot[];
  thursday?: AvailabilitySlot[];
  friday?: AvailabilitySlot[];
  saturday?: AvailabilitySlot[];
  sunday?: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface Reservation {
  id: string;
  tenant_id: string;
  customer_id: string;
  staff_id: string | null;
  service_id: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  staff?: StaffMember;
  service?: Service;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  messages: Message[];
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface DashboardStats {
  total_reservations: number;
  reservations_trend: number;
  active_conversations: number;
  conversations_trend: number;
  monthly_revenue: number;
  revenue_trend: number;
  satisfaction_score: number;
  satisfaction_trend: number;
}

export interface ActivityItem {
  id: string;
  type: "reservation" | "conversation" | "customer" | "payment";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// AUTH TYPES
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
  tenant?: Tenant;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
  business_name: string;
}

// ============================================================
// PRICING TYPES
// ============================================================

export interface PricingPlan {
  id: Plan;
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

// ============================================================
// NAVIGATION TYPES
// ============================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}
