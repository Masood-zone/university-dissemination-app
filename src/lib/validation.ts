import { z } from "zod";

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().optional(),
    studentId: z.string().optional(),
    batch: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

// ============================================================================
// ANNOUNCEMENT SCHEMAS
// ============================================================================

export const announcementSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters"),
  excerpt: z.string().max(300).optional(),
  category: z.enum([
    "OLD_AFFAIRS",
    "CURRENT_AFFAIRS",
    "DEPARTMENTAL",
    "ACADEMIC",
    "EVENT",
    "MAINTENANCE",
    "OTHER",
  ]),
  departmentId: z.string().optional(),
  courseOfferingId: z.string().optional(),
  imageUrl: z.string().url().optional(),
  priority: z.number().int().min(0).max(10).optional(),
  pinned: z.boolean().optional(),
  publishedAt: z
    .preprocess((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      if (v instanceof Date) return v;
      if (typeof v === "string") {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d;
      }
      return v;
    }, z.date())
    .optional(),
  expiresAt: z
    .preprocess((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      if (v instanceof Date) return v;
      if (typeof v === "string") {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d;
      }
      return v;
    }, z.date())
    .optional(),
});

export const announcementFilterSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  departmentId: z.string().optional(),
  pinned: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

export const messageSchema = z.object({
  recipientId: z.string(),
  content: z.string().min(1, "Message cannot be empty").max(5000),
  attachments: z.array(z.string().url()).optional(),
});

// ============================================================================
// USER MANAGEMENT SCHEMAS (Admin)
// ============================================================================

export const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["ADMIN", "DEPARTMENT_ADMIN", "LECTURER", "STUDENT"]),
});

export const userFilterSchema = z.object({
  role: z.enum(["ADMIN", "DEPARTMENT_ADMIN", "LECTURER", "STUDENT"]).optional(),
  departmentId: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const adminCreateUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    role: z.enum(["ADMIN", "DEPARTMENT_ADMIN", "LECTURER", "STUDENT"]),
    departmentId: z.string().optional(),
    isActive: z.boolean().optional(),

    // Lecturer profile
    employeeId: z.string().optional(),
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    office: z.string().optional(),

    // Department admin profile
    staffId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === "LECTURER") {
      if (!val.departmentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["departmentId"],
          message: "Department is required for lecturers",
        });
      }
      if (!val.employeeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["employeeId"],
          message: "Employee ID is required for lecturers",
        });
      }
      if (!val.qualification) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["qualification"],
          message: "Qualification is required for lecturers",
        });
      }
      if (!val.specialization) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["specialization"],
          message: "Specialization is required for lecturers",
        });
      }
    }

    if (val.role === "DEPARTMENT_ADMIN") {
      if (!val.departmentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["departmentId"],
          message: "Department is required for department admins",
        });
      }
    }
  });

export const adminUpdateUserSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    departmentId: z.string().optional().nullable(),
    isActive: z.boolean().optional(),

    // Keep role fixed per edit screen
    role: z
      .enum(["ADMIN", "DEPARTMENT_ADMIN", "LECTURER", "STUDENT"])
      .optional(),

    // Optional password reset
    password: z.string().min(6).optional(),

    // Lecturer profile
    employeeId: z.string().optional(),
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    office: z.string().optional(),

    // Department admin profile
    staffId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === "LECTURER") {
      if (!val.departmentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["departmentId"],
          message: "Department is required for lecturers",
        });
      }
      if (!val.employeeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["employeeId"],
          message: "Employee ID is required for lecturers",
        });
      }
      if (!val.qualification) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["qualification"],
          message: "Qualification is required for lecturers",
        });
      }
      if (!val.specialization) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["specialization"],
          message: "Specialization is required for lecturers",
        });
      }
    }

    if (val.role === "DEPARTMENT_ADMIN") {
      if (!val.departmentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["departmentId"],
          message: "Department is required for department admins",
        });
      }
    }
  });

// ============================================================================
// USER MANAGEMENT SCHEMAS (Department Admin - Students)
// ============================================================================

export const deptAdminCreateStudentSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().optional(),
    isActive: z.boolean().optional(),

    studentId: z.string().min(1, "Student ID is required"),
    batch: z.string().min(1, "Batch is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const deptAdminUpdateStudentSchema = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    confirmPassword: z.string().optional(),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().optional(),
    isActive: z.boolean().optional(),

    studentId: z.string().min(1, "Student ID is required"),
    batch: z.string().min(1, "Batch is required"),
  })
  .superRefine((data, ctx) => {
    if (data.password || data.confirmPassword) {
      if (!data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password is required when confirming",
        });
      }
      if (!data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Confirm password is required",
        });
      }
      if (
        data.password &&
        data.confirmPassword &&
        data.password !== data.confirmPassword
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords don't match",
        });
      }
    }
  });

// ============================================================================
// PAGINATION SCHEMA
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

// ============================================================================
// ACADEMIC CORE SCHEMAS
// ============================================================================

export const academicSessionSchema = z.object({
  name: z.string().min(4).max(120), // e.g. "2025/2026 Academic Year"
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const courseOfferingSchema = z.object({
  courseId: z.string().min(1),
  sessionId: z.string().min(1),
  semesterId: z.string().min(1),
  capacity: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const courseAssignmentSchema = z.object({
  offeringId: z.string().min(1),
  lecturerId: z.string().min(1),
});

export const enrollmentSchema = z.object({
  offeringId: z.string().min(1),
  studentId: z.string().min(1),
});

export const departmentSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(20),
  description: z.string().max(1000).optional(),
  headOfDept: z.string().max(120).optional(),
  contact: z.string().max(120).optional(),
});

export const courseSchema = z.object({
  code: z.string().min(2).max(20),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  credits: z.number().int().min(0).max(60),
  semester: z.number().int().min(1).max(20),
  capacity: z.number().int().positive().optional(),
  level: z.number().int().positive().optional(),
  prerequisites: z.array(z.string().min(1)).optional(),
  departmentId: z.string().min(1),
});

export const academicCalendarEventSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.string().min(2).max(60),
  academicYear: z.string().min(4).max(20),
});

// Type exports for form usage
export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type AnnouncementInput = z.input<typeof announcementSchema>;
export type MessageInput = z.input<typeof messageSchema>;
export type UpdateUserRoleInput = z.input<typeof updateUserRoleSchema>;
export type AdminCreateUserInput = z.input<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.input<typeof adminUpdateUserSchema>;
export type DeptAdminCreateStudentInput = z.input<
  typeof deptAdminCreateStudentSchema
>;
export type DeptAdminUpdateStudentInput = z.input<
  typeof deptAdminUpdateStudentSchema
>;
export type AcademicSessionInput = z.input<typeof academicSessionSchema>;
export type CourseOfferingInput = z.input<typeof courseOfferingSchema>;
export type CourseAssignmentInput = z.input<typeof courseAssignmentSchema>;
export type EnrollmentInput = z.input<typeof enrollmentSchema>;
export type DepartmentInput = z.input<typeof departmentSchema>;
export type CourseInput = z.input<typeof courseSchema>;
export type AcademicCalendarEventInput = z.input<
  typeof academicCalendarEventSchema
>;
