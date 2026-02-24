import {
  Role,
  SemesterName,
  AnnouncementCategory,
  AnnouncementStatus,
  NotificationType,
  ProgrammeAwardType,
} from "@prisma/client";

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar?: string;
  departmentId?: string;
}

export interface UserProfile extends UserSession {
  phone?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface StudentData {
  studentId: string;
  batch: string;
  gpa?: number;
  enrolledCourses?: string[];
}

export interface LecturerData {
  employeeId: string;
  senderId: string;
  recipientId: string;
  qualification: string;
  specialization: string;
  office?: string;
  officeHours?: string;
  taughtCourses?: string[];
}

// ============================================================================
// ANNOUNCEMENT TYPES
// ============================================================================

export interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  department?: {
    id: string;
    name: string;
  };
  imageUrl?: string;
  priority: number;
  viewCount: number;
  pinned: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnouncementFeed {
  announcements: AnnouncementData[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ============================================================================
// ACADEMIC TYPES
// ============================================================================

export interface CourseData {
  id: string;
  code: string;
  title: string;
  description?: string;
  credits: number;
  semester: number;
  capacity?: number;
}

// ============================================================================
// ENROLLMENT TYPES
// ============================================================================

export interface EnrollmentDepartment {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

export interface EnrollmentProgramme {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  awardType: ProgrammeAwardType;
  awardTypeLabel: string;
  durationYears?: number | null;
  totalSemesters?: number | null;
  durationLabel: string;
}

export interface EnrollmentCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: number;
}

export interface EnrollmentSubmitInput {
  draftId: string;
  personal: {
    firstName: string;
    lastName: string;
    otherNames: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    address?: string;
  };
  academic: {
    departmentId: string;
    programmeId: string;
    sessionId?: string;
    level?: string;
  };
  acceptedDeclaration: boolean;
}

export interface EnrollmentSubmitResult {
  applicationNo: string;
  status: string;
  accountCreated: boolean;
  temporaryPassword?: string;
}

export interface EnrollmentStatusResult {
  applicationNo: string;
  status: string;
  submittedAt?: string | null;
  departmentName: string;
  programmeName: string;
}

export interface ProgrammeListItem {
  id: string;
  name: string;
  code: string;
  departmentName: string;
  awardType: ProgrammeAwardType;
  awardTypeLabel: string;
  durationLabel: string;
  activeCourses: number;
}

export interface CreateProgrammeInput {
  name: string;
  code: string;
  departmentId: string;
  awardType: ProgrammeAwardType;
  durationYears?: number;
  totalSemesters?: number;
  minCredits?: number;
}

export interface ProgrammeSummary {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName: string;
  awardType: ProgrammeAwardType;
  awardTypeLabel: string;
  durationYears?: number;
  durationLabel: string;
  totalSemesters?: number;
  minCredits?: number;
}

export interface ProgrammeDetailsResponse {
  programme: ProgrammeSummary;
  coursesCount: number;
  prerequisiteOptions: Array<{ code: string; title: string }>;
}

export interface CreateProgrammeCourseInput {
  programmeId: string;
  title: string;
  code: string;
  credits: number;
  description?: string;
  semester?: number;
  prerequisites?: string[];
}

export interface TimetableEntry {
  id: string;
  course: CourseData;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  lecturer?: string;
  semester: number;
  academicYear: string;
}

export interface ExamData {
  id: string;
  course: CourseData;
  examType: string;
  examDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  totalMarks: number;
  duration: number;
  academicYear: string;
  semester: number;
}

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: string;
  academicYear: string;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface MessageData {
  id: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  senderId: string;
  recipientId: string;
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  content: string;
  status: "SENT" | "DELIVERED" | "READ";
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Backwards-compatible alias (some pages import `Message`)
export type Message = MessageData;

export interface Conversation {
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  announcement?: {
    id: string;
    title: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Backwards-compatible alias (some components import `Notification`)
export type Notification = NotificationData;

// ============================================================================
// FEE TYPES
// ============================================================================

export interface FeeData {
  id: string;
  studentId: string;
  feeType: string;
  amount: number;
  dueDate: Date;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  paidDate?: Date;
  semester: number;
  academicYear: string;
  createdAt: Date;
}

export interface FeeStatement {
  totalFees: number;
  totalPaid: number;
  totalPending: number;
  overdueFees: number;
  feeDetails: FeeData[];
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalUsers: number;
  totalAnnouncements: number;
  totalMessages: number;
  activeUsers: number;
  lastUpdated: Date;
}

export interface StudentDashboard {
  upcomingExams: ExamData[];
  timetable: TimetableEntry[];
  announcements: AnnouncementData[];
  fees: FeeStatement;
  unreadNotifications: number;
}

export interface AdminDashboard {
  stats: DashboardStats;
  recentAnnouncements: AnnouncementData[];
  activeUsers: UserProfile[];
  systemHealth: {
    dbStatus: boolean;
    apiStatus: boolean;
    lastChecked: Date;
  };
}

// ============================================================================
// ADMIN OVERVIEW (DASHBOARD OVERVIEW PAGE)
// ============================================================================

export interface AdminOverviewStatCard {
  label: string;
  value: string;
  note: string;
  icon: string;
}

export interface AdminOverviewQuickAction {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export interface AdminOverviewData {
  stats: AdminOverviewStatCard[];
  quickActions: AdminOverviewQuickAction[];
}

// ============================================================================
// DEPARTMENT MANAGEMENT TYPES
// ============================================================================

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  headOfDept?: string | null;
  contact?: string | null;
  programmesCount: number;
  studentsCount: number;
}

export interface DepartmentInfoResponse {
  stats: {
    totalDepartments: number;
    totalProgrammes: number;
    totalStudents: number;
  };
  departments: DepartmentSummary[];
}

export interface DepartmentHeadCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  departmentId?: string | null;
}

export interface UpdateDepartmentHodInput {
  departmentId: string;
  headUserId: string | null;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
  headOfDept?: string;
  contact?: string;
}

// ============================================================================
// ACADEMIC SESSIONS TYPES
// ============================================================================

export interface AcademicSessionSemester {
  id: string;
  name: SemesterName;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AcademicSessionSummary {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  currentSemester?: SemesterName | null;
  semesters: AcademicSessionSemester[];
}

export interface AcademicSessionsOverviewResponse {
  sessions: AcademicSessionSummary[];
  activeSession: AcademicSessionSummary | null;
  activeSemesterName: SemesterName | null;
}

export interface CreateAcademicSessionInput {
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  currentSemester?: SemesterName;
  semesters?: Array<{
    name: SemesterName;
    enabled?: boolean;
    startDate?: string;
    endDate?: string;
  }>;
}

export interface UpdateAcademicSessionInput {
  id: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  currentSemester?: SemesterName | null;
}

export interface DeleteAcademicSessionInput {
  id: string;
}

export interface UpsertSessionSemesterInput {
  sessionId: string;
  name: SemesterName;
  enabled: boolean;
  startDate?: string;
  endDate?: string;
}

export interface SetCurrentSemesterInput {
  sessionId: string;
  semesterName: SemesterName;
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface UserPermission {
  action: string;
  resource: string;
  granted: boolean;
}

export interface RolePermissions {
  role: Role;
  permissions: UserPermission[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class SidsError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "SidsError";
  }
}
