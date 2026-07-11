# How This System Works

## A Complete Guide to the University Information Dissemination System (SIDS)

---

## Table of Contents

1. [What Is This System?](#1-what-is-this-system)
2. [Technology at a Glance](#2-technology-at-a-glance)
3. [User Roles Overview](#3-user-roles-overview)
4. [The Four User Roles in Detail](#4-the-four-user-roles-in-detail)
5. [Student Enrollment Flow](#5-student-enrollment-flow)
6. [How Information Dissemination Works](#6-how-information-dissemination-workss)
7. [Announcements System](#7-announcements-system)
8. [Messaging System](#8-messaging-system)
9. [Notifications System](#9-notifications-system)
10. [Email and SMS Delivery](#10-email-and-sms-delivery)
11. [Academic Structure](#11-academic-structure)
12. [Finance and Payments](#12-finance-and-payments)
13. [Security and Access Control](#13-security-and-access-control)
14. [How It All Fits Together](#14-how-it-all-fits-together)

---

## 1. What Is This System?

The **University Information Dissemination System (SIDS)** is a web-based platform designed to streamline how a university manages its internal information flow. It connects every level of the institution — from the top-level Super Administrator down to individual Students — through a single, unified portal.

**The core purpose** is simple: ensure the right information reaches the right people at the right time, through the right channel.

The system handles:

- **Announcements** — institution-wide and department-specific communications
- **Messaging** — direct communication between lecturers and students
- **Enrollment** — a guided, step-by-step student admission process
- **Academic management** — sessions, semesters, courses, programmes, and timetables
- **Finance** — fee configuration, payment tracking, and financial analytics
- **Role-based dashboards** — every user type sees only what is relevant to them

---

## 2. Technology at a Glance

| Component | Technology | What It Does |
|-----------|-----------|--------------|
| Frontend | Next.js (React 19) | The user interface — what you see in the browser |
| Database | PostgreSQL | Stores all data — users, announcements, fees, etc. |
| ORM | Prisma | Translates code into database queries |
| Authentication | Better Auth | Handles login, sessions, password reset |
| State Management | Zustand | Manages temporary client-side state (e.g., enrollment draft) |
| Data Fetching | React Query + Axios | Loads data from the server into the UI |
| Email | Nodemailer + React Email | Sends beautifully formatted emails |
| SMS | UelloSend | Sends text message notifications |
| File Uploads | Cloudinary | Stores images and documents in the cloud |
| Validation | Zod | Validates all user input before processing |

---

## 3. User Roles Overview

The system has **four distinct user roles**, each with a dedicated dashboard, permissions, and feature set:

```
┌─────────────────────────────────────────────────┐
│              SUPER ADMINISTRATOR                │
│  Full system control across all departments     │
└──────────────────────┬──────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐
│ DEPARTMENT   │ │ LECTURER  │ │   STUDENT    │
│ ADMIN        │ │           │ │              │
│ Manages one  │ │ Teaches   │ │ Learns and   │
│ department   │ │ courses   │ │ enrolls      │
└──────────────┘ └───────────┘ └──────────────┘
```

After login, each user is automatically routed to their role-specific dashboard.

---

## 4. The Four User Roles in Detail

### 4.1 Super Administrator (`ADMIN`)

The administrator sits at the top of the system and has **unrestricted access** to everything.

**Dashboard and capabilities:**

| Area | What the Admin Can Do |
|------|----------------------|
| **Announcements** | Create, edit, publish, archive, and pin announcements for the entire university or specific departments |
| **Departments** | Create departments, assign Heads of Department, manage department structure |
| **Programmes & Courses** | Create academic programmes, define courses, set credit hours, manage prerequisites |
| **Academic Sessions** | Create and manage academic sessions (e.g., "2025/2026"), set active semesters |
| **Student Applications** | Review enrollment applications, approve or reject applicants, track application status history |
| **Student Profiles** | View all student records, manage student accounts |
| **Faculty Staff Directory** | Browse all staff members across all departments |
| **Finance** | Configure programme fees (tuition, library, facility), view payment analytics, track revenue |
| **Role-Based Access** | Define role templates, assign granular permissions to users |
| **Profile** | Manage their own account settings |

**Admin announcement flow example:**
1. Admin writes an announcement with title, content, category, and optional department targeting
2. Admin publishes it
3. The system immediately fans out notifications to all active users (in-app, email, SMS)
4. The announcement appears in the university-wide feed

### 4.2 Department Administrator (`DEPARTMENT_ADMIN`)

The department admin manages a **single department** and its sub-resources.

**Dashboard and capabilities:**

| Area | What the Department Admin Can Do |
|------|--------------------------------|
| **Announcements** | Create and publish announcements scoped to their department |
| **Programmes & Courses** | Manage programmes and courses within their department |
| **Staff Management** | Import and provision new lecturers and students into their department; accounts are auto-created with temporary passwords sent via email and SMS |
| **Analytics** | View department-specific analytics and statistics |
| **Profile** | Manage their own account settings |

**How department scoping works:**
- When a department admin is assigned to a department, their view is automatically scoped
- Announcements they create are visible to department members AND all administrators
- Course and programme management is restricted to their department's offerings
- Staff imports only affect users within their department

### 4.3 Lecturer (`LECTURER`)

Lecturers manage their teaching responsibilities and communicate with students.

**Dashboard and capabilities:**

| Area | What the Lecturer Can Do |
|------|--------------------------|
| **Announcements** | View announcements relevant to their courses and department |
| **Courses** | View courses assigned to them, see enrolled students |
| **Schedule** | Manage their teaching timetable — set day, time, location for each course |
| **Messaging** | Send and receive messages from students enrolled in their courses |
| **Academic Sessions** | View current and past academic sessions |
| **Profile** | Manage their own account settings |

**Lecturer messaging rules:**
- A lecturer can only message students who are **enrolled in courses they teach**
- Messages are stored in the database and trigger email/SMS notifications
- The lecturer sees only conversations within their course context

### 4.4 Student (`STUDENT`)

Students are the primary consumers of information and the reason the system exists.

**Dashboard and capabilities:**

| Area | What the Student Can Do |
|------|------------------------|
| **Dashboard** | View a personalized overview — recent announcements, notifications, course status |
| **Announcements** | Browse all announcements (university-wide and department-specific) |
| **Course Offerings** | View available courses for the current session and semester |
| **Messaging** | Send and receive messages from lecturers assigned to their courses |
| **Finance** | View fees owed, payment history, and payment status |
| **Academic Calendar** | View upcoming events, deadlines, and academic milestones |
| **Profile** | Manage their own account settings |

**Student messaging rules:**
- A student can only message lecturers who **teach courses they are enrolled in**
- This ensures conversations stay within relevant academic contexts

---

## 5. Student Enrollment Flow

The enrollment process is a **4-step guided wizard** available to anyone who visits the portal. No login is required to start.

### Step-by-Step Breakdown

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ STEP 1   │───▶│ STEP 2   │───▶│ STEP 3   │───▶│ STEP 4   │
│ Personal │    │ Academic │    │ Programme│    │ Review & │
│ Details  │    │ Info     │    │ Selection│    │ Submit   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Step 1 — Personal Details**
- First name, last name, email, phone number
- The system creates a draft application tracked by a unique application ID

**Step 2 — Department Selection**
- The applicant chooses a department from the list created by the administrator

**Step 3 — Programme Selection**
- The applicant chooses a specific programme within the selected department
- Programme details (duration, award type) are displayed

**Step 4 — Review & Submit**
- The applicant reviews all entered information
- On submission, the system:
  1. Creates a user account with the provided credentials
  2. Hashes the password securely
  3. Creates a `StudentProfile` record
  4. Creates an `Application` record with status `SUBMITTED`
  5. Generates fee obligations based on the programme fee configuration
  6. Sends a confirmation **email** with application number and temporary password
  7. Sends a confirmation **SMS** with the application number

**After submission:**
- The application enters the admin review queue
- The administrator can move it through statuses: `SUBMITTED` → `UNDER_REVIEW` → `SHORTLISTED` → `APPROVED` / `REJECTED`
- When approved, the student receives an email and SMS with the decision
- The student can then log in to the portal with their credentials

### Auto-Enrollment into Courses

When a student's application is approved, the system **automatically enrolls** them in all available course offerings for the current session and semester that match their programme and department. This happens behind the scenes so the student sees their courses immediately upon login.

---

## 6. How Information Dissemination Works

This is the **heart of the system**. Information flows through three channels simultaneously:

```
                    ┌──────────────────────┐
                    │   Information Event   │
                    │ (Announcement, Msg,   │
                    │  System Update)       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌────────────────┐ ┌───────────┐ ┌──────────────┐
     │   In-App       │ │   Email   │ │     SMS      │
     │ Notification   │ │  (SMTP)   │ │ (UelloSend)  │
     │                │ │           │ │              │
     │ Stored in DB,  │ │ HTML-rich │ │ Text message │
     │ visible in     │ │ formatted │ │ delivered to │
     │ notification   │ │ emails    │ │ phone number │
     │ bell/center    │ │ sent via  │ │              │
     │                │ │ Nodemailer│ │              │
     └────────────────┘ └───────────┘ └──────────────┘
```

**Every information event tries all three channels.** If email or SMS fails, the in-app notification is still delivered. This is called "best-effort" delivery — the system never blocks the main action because of a failed notification.

### The Dissemination Pipeline (In Detail)

1. **Event occurs** — e.g., an admin publishes an announcement
2. **Recipients are determined** — the system queries all active users (excluding the author)
3. **Scoped recipients** — if the announcement is department-specific, only department members + admins are notified
4. **Batch processing** — recipients are processed in batches of 8 to avoid overwhelming email/SMS providers
5. **For each recipient:**
   - An in-app notification row is created in the database
   - An email is sent with the announcement title, category, and a link to view it
   - An SMS is sent with a brief summary
   - Each channel's delivery status (SENT/FAILED) is recorded in metadata
6. **The notification center** shows all notifications with read/unread status

---

## 7. Announcements System

Announcements are the **primary dissemination mechanism** in the system.

### Announcement Lifecycle

```
DRAFT ──▶ PUBLISHED ──▶ ARCHIVED
```

- **Draft**: Written but not visible to anyone except the author
- **Published**: Visible to target audience; triggers notification fan-out
- **Archived**: No longer in the active feed but still accessible

### Announcement Properties

| Property | Purpose |
|----------|---------|
| `title` | The headline of the announcement |
| `content` | Full body text (supports markdown) |
| `excerpt` | Short summary used in notification emails |
| `category` | One of: `OLD_AFFAIRS`, `CURRENT_AFFAIRS`, `DEPARTMENTAL`, `ACADEMIC`, `EVENT`, `MAINTENANCE`, `OTHER` |
| `status` | `DRAFT`, `PUBLISHED`, or `ARCHIVED` |
| `departmentId` | Optional — if set, announcement is scoped to that department |
| `courseOfferingId` | Optional — if set, announcement is scoped to a specific course |
| `priority` | Numeric priority for ordering |
| `pinned` | Whether the announcement is pinned to the top |
| `viewCount` | Tracks how many people have viewed it |
| `publishedAt` | When it was published |
| `expiresAt` | Optional expiration date |

### Who Sees What

| Role | Can Create? | Sees Announcements From |
|------|-------------|------------------------|
| Admin | Yes (all departments) | All announcements across the university |
| Department Admin | Yes (own department) | Own department + all university-wide announcements |
| Lecturer | No (view only) | Own department + own course announcements |
| Student | No (view only) | Own department + enrolled course announcements |

### Announcement Categories Explained

- **OLD_AFFAIRS** — Historical or archival notices
- **CURRENT_AFFAIRS** — General university news and updates
- **DEPARTMENTAL** — Department-specific notices (e.g., "CS Department meeting on Friday")
- **ACADEMIC** — Academic matters (e.g., "Exam schedule released", "Registration deadline extended")
- **EVENT** — Events, workshops, seminars, and ceremonies
- **MAINTENANCE** — System or campus maintenance notices
- **OTHER** — Anything that doesn't fit the above categories

---

## 8. Messaging System

The messaging system enables **direct, context-aware communication** between lecturers and students.

### How It Works

```
Lecturer                              Student
   │                                     │
   │  "Hello, class will be             │
   │   moved to Room 302"               │
   │────────────────────────────────────▶│
   │                                     │
   │        "Thank you, professor"       │
   │◀────────────────────────────────────│
   │                                     │
```

### Permission Rules

The messaging system is **permission-gated by enrollment**:

- A **lecturer** can only see and message students enrolled in courses they teach
- A **student** can only see and message lecturers assigned to courses they are enrolled in
- This prevents unauthorized or irrelevant conversations

### How Permissions Are Resolved

1. The system looks up the user's role
2. For lecturers: it finds all `CourseAssignment` records linking the lecturer to course offerings, then finds all students enrolled in those offerings
3. For students: it finds all `Enrollment` records for the student, then finds the lecturers assigned to those course offerings
4. Only users who pass this check appear in the messaging interface

### Message Delivery

When a message is sent:
1. The message is stored in the database with status `SENT`
2. In-app notifications are created for all recipients
3. Email notifications are sent with a preview of the message and a link to the messaging center
4. SMS notifications are sent for recipients with phone numbers
5. Status updates to `DELIVERED` and then `READ` as the recipient interacts

---

## 9. Notifications System

Notifications are the **in-app layer** of information dissemination.

### Notification Types

| Type | Trigger | Example |
|------|---------|---------|
| `ANNOUNCEMENT` | An announcement is published | "New Announcement: Exam Schedule Released" |
| `MESSAGE` | A new message is received | "You have a new message from Dr. Smith" |
| `SYSTEM` | System events (role assignment, account creation) | "You have been assigned to Computer Science Dept" |
| `ACADEMIC` | Academic events (enrollment decisions) | "Your enrollment has been approved" |
| `PAYMENT` | Payment-related events | "Fee payment received" |

### Notification Properties

| Property | Purpose |
|----------|---------|
| `userId` | The user receiving the notification |
| `type` | The notification category |
| `title` | Short headline |
| `message` | Detailed description |
| `isRead` | Whether the user has seen it |
| `announcementId` | Link to the source announcement (if applicable) |
| `metadata` | JSON data tracking delivery channels and statuses |

### Notification Center

Every user has a notification center (bell icon) in their dashboard that:
- Shows unread notification count
- Lists all notifications sorted by time
- Marks notifications as read when viewed
- Links directly to the source (announcement, message, etc.)

---

## 10. Email and SMS Delivery

### Email Service

The email service uses **Nodemailer** with **React Email** templates to send rich, formatted emails.

**Email types sent by the system:**

| Email | When Sent | Content |
|-------|-----------|---------|
| Forgot Password | User requests password reset | Reset link with token and expiry |
| Password Reset Confirmation | Password is successfully reset | Confirmation message |
| Enrollment Submitted | Student completes enrollment | Application number, temporary password, portal link |
| Enrollment Decision | Admin approves/rejects application | Decision, reason (if rejected), portal link |
| Announcement Published | New announcement is published | Title, category, summary, link to announcement |
| Staff Welcome | Department admin provisions new staff | Account credentials, login link |

**Email configuration** is done via environment variables:
- `SMTP_HOST` — mail server address
- `SMTP_PORT` — mail server port
- `SMTP_USER` — authentication username
- `SMTP_PASS` — authentication password
- `SMTP_FROM` — sender email address

### SMS Service

The SMS service uses **UelloSend** (a Ghana-based SMS provider) to deliver text messages.

**SMS types sent by the system:**

| SMS | When Sent | Content |
|-----|-----------|---------|
| Enrollment Submitted | Student completes enrollment | Application number, temporary password |
| Enrollment Decision | Admin approves/rejects | Decision summary |
| Announcement Published | New announcement published | Brief summary |
| Staff Welcome | New staff provisioned | Account credentials |
| Password Reset Token | User requests password reset | The reset token |
| Password Reset Confirmation | Password is successfully reset | Confirmation message |
| New Message | Someone sends a message | Sender name, prompt to log in |

**SMS phone number formatting:** The system automatically converts Ghana phone numbers (0XXXXXXXXX) to international format (233XXXXXXXXX).

---

## 11. Academic Structure

The system models the university's academic hierarchy as follows:

```
University
  └── Department (e.g., Computer Science)
        ├── Programme (e.g., BSc Computer Science)
        │     └── ProgrammeFee (tuition, library, facility per semester)
        └── Course (e.g., CS101 - Introduction to Programming)
              └── CourseOffering (a course offered in a specific session + semester)
                    ├── CourseAssignment (lecturer assigned)
                    ├── Enrollment (student enrolled)
                    ├── Timetable (class schedule)
                    └── Exam (exam schedule)
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Academic Session** | A full academic year (e.g., "2025/2026"), with start/end dates and an active flag |
| **Semester** | A session has two semesters: `FIRST` and `SECOND` |
| **Department** | An organizational unit (e.g., "Mathematics Department") |
| **Programme** | A degree programme within a department (e.g., "BSc Mathematics") with award type (Undergraduate, Postgraduate, Diploma) |
| **Course** | A specific subject taught within a department, belonging to a programme, with credits and prerequisites |
| **Course Offering** | A course made available in a specific session and semester — this is what students enroll in |
| **Course Assignment** | Links a lecturer to a course offering |
| **Enrollment** | Links a student to a course offering |
| **Timetable** | Defines when and where a course offering meets (day of week, time, location) |
| **Exam** | Defines exam details for a course offering (date, time, location, marks, duration) |

---

## 12. Finance and Payments

### Fee Configuration

Administrators configure fees per programme, per session, per semester:

| Fee Type | Description |
|----------|-------------|
| Tuition Fee | Core academic fee |
| Library Fee | Access to library resources |
| Facility Fee | Campus facility usage |
| **Total Fee** | Sum of all fee components |

**Currency:** Ghana Cedis (GHS) by default.

### Fee Lifecycle

```
ProgrammeFee configured by Admin
         │
         ▼
Application approved for a student
         │
         ▼
Fee obligations (Fees) created for the student
         │
         ▼
Student views fees in Finance dashboard
         │
         ▼
Payment transactions recorded
         │
         ▼
Fee status updated: PENDING → PAID / OVERDUE / CANCELLED
```

### Payment Tracking

| Model | Purpose |
|-------|---------|
| `Fee` | A specific fee obligation for a student (amount, due date, status) |
| `PaymentTransaction` | A record of a payment attempt (reference number, amount, method, provider, status) |

Payment statuses: `PENDING`, `PAID`, `OVERDUE`, `CANCELLED`
Transaction statuses: `PENDING`, `SUCCESS`, `FAILED`, `REVERSED`, `REFUNDED`, `CANCELLED`

---

## 13. Security and Access Control

### Authentication

- **Better Auth** handles all authentication
- Users log in with email and password
- Passwords are hashed using **bcrypt**
- Sessions are managed via secure tokens
- Password reset flow uses time-limited tokens sent via email and SMS

### Role-Based Access Control (RBAC)

Every API endpoint enforces role-based access:

```
requireSession(request)        → Must be logged in
requireAdmin(request)          → Must have ADMIN role
requireDepartmentAdmin(request) → Must have DEPARTMENT_ADMIN role
requireLecturer(request)       → Must have LECTURER role
requireStudent(request)        → Must have STUDENT role
```

If a user tries to access an endpoint they are not authorized for, the system returns a `403 Forbidden` response.

### Permission System (RBAC Templates)

The system has a more granular permission model in development:

- **Role Templates** define sets of permissions for each role
- **Permissions** are action + resource pairs (e.g., `CREATE` + `ANNOUNCEMENT`)
- Individual users can be assigned specific permission overrides
- This allows fine-grained control beyond the basic four roles

### Audit Logging

The system has an `AuditLog` model that can track:
- Who performed an action (`actorId`)
- What action was performed (`action`)
- What resource was affected (`resource`, `resourceId`)
- Additional details, IP address, and user agent

---

## 14. How It All Fits Together

### The Complete Information Flow

Here is how the entire system works end-to-end, from the administrator's perspective:

```
1. ADMIN creates a Department
   └── Assigns a Department Admin
       └── Department Admin receives email + SMS welcome notification

2. ADMIN creates Programmes and Courses within the Department
   └── Sets fee structures per programme

3. DEPARTMENT ADMIN imports staff (Lecturers and Students)
   └── Each receives email + SMS with login credentials

4. LECTURERS are assigned to Course Offerings
   └── They set up timetables and start messaging students

5. PUBLIC USERS visit the portal and enroll
   └── 4-step wizard creates an application
       └── Confirmation email + SMS sent

6. ADMIN reviews and approves/rejects applications
   └── Decision email + SMS sent to applicant
       └── Approved students are auto-enrolled in courses

7. STUDENTS log in and see their dashboard
   └── Enrolled courses, announcements, notifications, fees

8. ADMIN publishes a university-wide announcement
   └── All active users receive:
       ├── In-app notification (notification center)
       ├── Email (HTML-formatted with summary)
       └── SMS (brief text message)

9. LECTURER sends a message to their class
   └── Enrolled students receive:
       ├── In-app notification
       ├── Email with message preview
       └── SMS notification

10. STUDENT views their finance page
    └── Sees fees owed, payment history, and status
```

### The Three Pillars of Dissemination

| Pillar | Mechanism | Reach | Speed |
|--------|-----------|-------|-------|
| **Announcements** | Publish → fan-out to all users | University-wide or department-scoped | Immediate |
| **Messaging** | Direct sender → recipient(s) | Course-context-aware (enrollment-based) | Immediate |
| **Notifications** | System-generated alerts | Per-user, persistent until read | Immediate |

All three pillars share the same multi-channel delivery infrastructure: every event triggers in-app, email, and SMS delivery simultaneously.

### Data Flow Summary

```
User Action → Frontend (React) → React Query Hook → Axios HTTP Request
    → Next.js API Route → Auth Check → Business Logic → Prisma Query
    → PostgreSQL Database → Response → Frontend Update → Notification Fan-out
    → [In-App] + [Email via Nodemailer] + [SMS via UelloSend]
```

---

## Quick Reference: Page Routes by Role

| Role | Dashboard | Key Pages |
|------|-----------|-----------|
| **Admin** | `/administrator` | `/administrator/announcements`, `/administrator/department-management`, `/administrator/programmes-and-courses`, `/administrator/academic-sessions`, `/administrator/student-applications`, `/administrator/finance`, `/administrator/role-based-access`, `/administrator/student-profiles`, `/administrator/faculty-staff-directory` |
| **Dept Admin** | `/department-admin` | `/department-admin/announcements`, `/department-admin/programmes-and-courses`, `/department-admin/staff-management`, `/department-admin/analytics` |
| **Lecturer** | `/lecturer` | `/lecturer/announcements`, `/lecturer/courses`, `/lecturer/messaging`, `/lecturer/schedule`, `/lecturer/academic-sessions` |
| **Student** | `/student/dashboard` | `/student/announcements`, `/student/course-offerings`, `/student/messaging`, `/student/finance`, `/student/academic-calendar` |
| **Public** | `/` (homepage) | `/enrollment` (4-step wizard) |

---

*This document provides a high-level understanding of how the University Information Dissemination System works. For the technical architecture review, refer to `PROJECT_DEVELOPMENT_ANALYSIS.md`. For getting started with development, refer to `README.md`.*
