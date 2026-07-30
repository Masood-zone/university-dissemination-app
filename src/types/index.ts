import {
  Role,
  SemesterName,
  AnnouncementCategory,
  AnnouncementStatus,
  NotificationType,
  ApplicationStatus,
  ApplicationDocumentType,
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

export type StudentAnnouncementPriorityFilter =
  | "ALL"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type StudentAnnouncementsScope = "ALL" | "DEPARTMENTAL";

export type StudentAnnouncementsSort = "RECENT" | "OLDEST";

export type StudentAnnouncementListItem = {
  id: string;
  title: string;
  excerpt: string | null;
  category: AnnouncementCategory;
  priority: number;
  pinned: boolean;
  departmentName: string | null;
  authorName: string;
  publishedAt: string | null; // ISO
  createdAt: string; // ISO
  viewCount: number;
};

export type StudentAnnouncementsCategoryCount = {
  category: AnnouncementCategory;
  label: string;
  count: number;
};

export type StudentAnnouncementsFeedResult = {
  rows: StudentAnnouncementListItem[];
  categories: StudentAnnouncementsCategoryCount[];
  page: number;
  pageSize: number;
  total: number;
  sort: StudentAnnouncementsSort;
};

export type StudentAnnouncementDetail = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: AnnouncementCategory;
  priority: number;
  pinned: boolean;
  departmentName: string | null;
  authorName: string;
  imageUrl: string | null;
  viewCount: number;
  publishedAt: string | null; // ISO
  expiresAt: string | null; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type StudentAnnouncementDetailResult = {
  announcement: StudentAnnouncementDetail;
  related: StudentAnnouncementListItem[];
};

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

// ============================================================================
// ADMIN: STUDENT APPLICATIONS
// ============================================================================

export type AdminStudentApplicationListRow = {
  id: string;
  applicationNo: string;
  status: ApplicationStatus;
  studentName: string;
  departmentId: string;
  departmentName: string;
  programmeId: string;
  programmeName: string;
  submittedAt: string;
  docsCount: number;
  docsVerifiedCount: number;
};

export type AdminStudentApplicationsListResult = {
  total: number;
  rows: AdminStudentApplicationListRow[];
};

export type AdminStudentApplicationDocument = {
  id: string;
  type: ApplicationDocumentType;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  isVerified: boolean;
  verifiedAt: string | null;
  uploadedAt: string;
};

export type AdminStudentApplicationStatusHistoryItem = {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string | null;
  createdAt: string;
  changedBy: { id: string; name: string; email: string } | null;
};

export type AdminStudentApplicationDetail = {
  id: string;
  applicationNo: string;
  status: ApplicationStatus;
  studentName: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  decidedAt: string | null;
  department: { id: string; name: string };
  programme: { id: string; name: string };
  notes: string | null;
  documents: AdminStudentApplicationDocument[];
  statusHistory: AdminStudentApplicationStatusHistoryItem[];
};

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
  unreadNotifications: number;
}

export type StudentDashboardDeadlineKind = "EXAM";

export type StudentDashboardDeadlineItem = {
  id: string;
  kind: StudentDashboardDeadlineKind;
  title: string;
  subtitle: string;
  dueAt: string; // ISO
};

export type StudentDashboardNextClass = {
  offeringId: string | null;
  courseCode: string;
  courseTitle: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  lecturer: string | null;
  startsAt: string; // ISO
};

export type StudentDashboardAnalytics = {
  nextClass: StudentDashboardNextClass | null;
  nextClassInMinutes: number | null;
  enrolledCourseCount: number;
  announcements: Array<{
    id: string;
    title: string;
    excerpt: string | null;
    category: AnnouncementCategory;
    pinned: boolean;
    priority: number;
    departmentName: string | null;
    publishedAt: string | null; // ISO
  }>;
  deadlines: StudentDashboardDeadlineItem[];
};

export type StudentAcademicCalendarEvent = {
  id: string;
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  start: string; // ISO
  end: string; // ISO
  location: string;
  lecturer: string | null;
};

export type StudentAcademicCalendarResponse = {
  weekStart: string; // ISO (Monday)
  weekEnd: string; // ISO (exclusive)
  events: StudentAcademicCalendarEvent[];
};

export type StudentCourseOfferingRow = {
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  credits: number;
  semester: number;
  level: number | null;
  departmentName: string | null;
  sessionName: string;
  semesterName: SemesterName;
  lecturers: Array<{ id: string; name: string }>;
  timetable: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string;
    lecturer: string | null;
  }>;
};

export type StudentCourseOfferingsResponse = {
  sessionName: string | null;
  semesterName: SemesterName | null;
  rows: StudentCourseOfferingRow[];
};

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

export type AdminStudentImportRow = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  studentId: string;
  batch: string;
  departmentCode: string;
  programmeCode: string;
  password?: string;
};

export type ImportedStudentCredential = {
  email: string;
  studentId: string;
  password: string;
};

export type AdminStudentImportResult = {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  credentials: ImportedStudentCredential[];
};

export type AdminStudentListRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  studentId: string;
  batch: string;
  departmentId: string | null;
  departmentName: string | null;
  programmeId: string | null;
  programmeName: string | null;
  applicationStatus: ApplicationStatus | null;
  isActive: boolean;
  createdAt: string;
};

export type AdminStudentListResult = {
  stats: {
    total: number;
    approved: number;
    pending: number;
    active: number;
  };
  rows: AdminStudentListRow[];
  page: number;
  pageSize: number;
  total: number;
};

// ============================================================================
// DEPARTMENT ADMIN OVERVIEW (DASHBOARD OVERVIEW PAGE)
// ============================================================================

export type DepartmentAdminOverviewStatCard = {
  label: string;
  value: string;
  note: string;
  icon: string;
  badge?: string | null;
};

export type DepartmentAdminOverviewQuickAction = {
  title: string;
  description: string;
  href: string;
  icon: string;
};

export type DepartmentAdminActivityItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  createdAt: string; // ISO
};

export type DepartmentAdminCalendarCard = {
  title: string;
  description: string;
  startDate: string; // ISO
  endDate: string; // ISO
};

export type DepartmentAdminOverviewData = {
  stats: DepartmentAdminOverviewStatCard[];
  activities: DepartmentAdminActivityItem[];
  quickActions: DepartmentAdminOverviewQuickAction[];
  calendar: DepartmentAdminCalendarCard | null;
};

// ============================================================================
// DEPARTMENT ADMIN - STAFF MANAGEMENT
// ============================================================================

export type DepartmentAdminStaffRoleFilter = "ALL" | "LECTURER" | "STUDENT";

export type DepartmentAdminStaffStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "DEACTIVATED"
  | "PENDING_AUTH";

export type DepartmentAdminStaffStats = {
  totalUsers: number;
  lecturers: number;
  students: number;
  pendingAuth: number;
};

export type DepartmentAdminStaffListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: "LECTURER" | "STUDENT";
  systemId: string | null;
  departmentName: string;
  levelOrMeta: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string; // ISO
};

export type DepartmentAdminStaffListResult = {
  stats: DepartmentAdminStaffStats;
  rows: DepartmentAdminStaffListRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type DepartmentAdminStaffUserDetail = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "LECTURER" | "STUDENT";
  isActive: boolean;
  emailVerified: boolean;
  departmentId: string;
  departmentName: string;

  lecturerProfile: {
    employeeId: string;
    qualification: string;
    specialization: string;
    office: string | null;
  } | null;
  studentProfile: {
    studentId: string;
    batch: string;
  } | null;
};

export type DepartmentAdminCreateStaffUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "LECTURER" | "STUDENT";

  employeeId?: string;
  qualification?: string;
  specialization?: string;
  office?: string;

  studentId?: string;
  batch?: string;
  programmeCode?: string;
};

export type DepartmentAdminUpdateStaffUserInput = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  isActive?: boolean;
  password?: string;

  employeeId?: string;
  qualification?: string;
  specialization?: string;
  office?: string | null;

  studentId?: string;
  batch?: string;
};

export type DepartmentAdminBulkImportRow = DepartmentAdminCreateStaffUserInput;

export type DepartmentAdminBulkImportResult = {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  credentials?: ImportedStudentCredential[];
};

// ============================================================================
// DEPARTMENT ADMIN - PROGRAMMES & COURSES
// ============================================================================

export type DepartmentAdminProgrammeOption = {
  id: string;
  name: string;
  code: string;
  awardType: string;
};

export type DepartmentAdminLecturerOption = {
  id: string;
  name: string;
  loadCredits: number;
  loadPercent: number;
  overload: boolean;
};

export type DepartmentAdminCourseOfferingView = "CURRENT" | "ARCHIVES";

export type DepartmentAdminCourseOfferingRow = {
  offeringId: string;
  createdAt: string;
  sessionName: string;
  sessionIsActive: boolean;
  semesterName: string;

  courseId: string;
  courseCode: string;
  courseTitle: string;
  credits: number;
  level: number | null;
  courseSemester: number;
  programmeName: string | null;

  lecturerId: string | null;
  lecturerName: string | null;
  loadPercent: number;
};

export type DepartmentAdminCourseOfferingListResult = {
  departmentName: string;
  activeSessionName: string | null;
  view: DepartmentAdminCourseOfferingView;
  rows: DepartmentAdminCourseOfferingRow[];
};

export type DepartmentAdminCourseListRow = {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: number;
  level: number | null;
  programmeId: string | null;
  programmeName: string | null;
  createdAt: string;
};

export type DepartmentAdminCourseListResult = {
  rows: DepartmentAdminCourseListRow[];
};

export type DepartmentAdminCreateCourseInput = {
  programmeId?: string | null;
  code: string;
  title: string;
  credits: number;
  semester: number;
  level?: number | null;
};

export type DepartmentAdminUpdateCourseInput = {
  programmeId?: string | null;
  code?: string;
  title?: string;
  credits?: number;
  semester?: number;
  level?: number | null;
};

// ============================================================================
// ADMIN ANNOUNCEMENTS
// ============================================================================

export type AdminAnnouncementStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "SCHEDULED"
  | "DRAFT"
  | "ARCHIVED";

export type AdminAnnouncementPriorityLevel =
  | "NORMAL"
  | "IMPORTANT"
  | "CRITICAL";

export type AdminAnnouncementListRow = {
  id: string;
  title: string;
  excerpt: string | null;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  priority: number;
  pinned: boolean;
  departmentName: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
};

export type AdminAnnouncementsStats = {
  totalActive: number;
  scheduled: number;
  highPriority: number;
  readRate: number | null;
};

export type AdminAnnouncementsListResult = {
  stats: AdminAnnouncementsStats;
  rows: AdminAnnouncementListRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminAnnouncementDetail = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  priority: number;
  pinned: boolean;
  imageUrl: string | null;
  department: { id: string; name: string } | null;
  audienceAll?: boolean;
  audienceRoles?: Role[];
  audienceDepartmentIds?: string[];
  audienceCourseOfferingIds?: string[];
  viewCount: number;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
};

export type UpsertAnnouncementInput = {
  id?: string;
  title: string;
  content: string;
  excerpt?: string | null;
  category: AnnouncementCategory;
  priority: number;
  pinned?: boolean;
  departmentId?: string | null;
  audienceAll?: boolean;
  audienceRoles?: Role[];
  audienceDepartmentIds?: string[];
  audienceCourseOfferingIds?: string[];
  imageUrl?: string | null;
  mode: "DRAFT" | "PUBLISH_NOW" | "SCHEDULE";
  publishedAt?: string | null;
  expiresAt?: string | null;
};

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
  headUserId?: string | null;
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
