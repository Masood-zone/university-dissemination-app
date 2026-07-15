# How This System Works

## University Information Dissemination System (SIDS)

SIDS is a role-aware university platform that connects applicants, students,
lecturers, department administrators, and university administrators. Its core
purpose is to deliver the right academic and institutional information to the
right audience through the web portal, in-app notifications, email, and SMS.

## Main Capabilities

- Public student enrollment and application review
- Searchable student profiles and approved roster imports
- Academic sessions, semesters, programmes, courses, and offerings
- Targeted announcements with university, department, and course scope
- Course-aware lecturer and student messaging
- Timetables, examinations, and academic calendars
- Role-based dashboards, permissions, profiles, and audit records

## Roles

| Role | Main responsibilities |
| --- | --- |
| Administrator | Configures academic structures, reviews applications, manages students, publishes announcements, and controls access |
| Department Administrator | Manages people, programmes, courses, offerings, and announcements within one department |
| Lecturer | Views assigned courses, maintains schedules, and communicates with enrolled students |
| Student | Views current enrollments, announcements, schedules, examinations, messages, and profile information |

Every protected API route validates the Better Auth session and required role.
After sign-in, each user is routed to the dashboard for their assigned role.

## Enrollment and Student Provisioning

Public applicants complete a four-step enrollment form covering personal
details, department selection, programme selection, and final review. Submission
creates a student account, profile, application, in-app notification, and delivery
attempts through email and SMS. The application remains restricted until an
administrator approves it.

Administrators can also import an existing student roster from CSV. The import
validates department and programme relationships, creates or updates student
profiles, provisions credentials, records an approved imported application, and
enrolls the student in matching active course offerings. Department administrators
use the same provisioning logic but are restricted to their assigned department.

## Academic Structure

```text
Department
  -> Programme
    -> Course
      -> Course Offering (session + semester)
        -> Lecturer Assignment
        -> Student Enrollment
        -> Timetable
        -> Examination
```

An approved student is automatically linked to active course offerings that
match the programme, department, academic session, and current semester.

## Information Dissemination

Announcements support drafts, publishing, archiving, priority, pinning, images,
expiry, and audience scope. When an announcement is published, the system stores
persistent in-app notifications and attempts external email and SMS delivery.
Provider failures do not prevent the database notification from remaining
available.

Messaging stays within academic relationships: lecturers can contact students
enrolled in their assigned offerings, and students can contact lecturers who
teach their enrolled courses.

## Student Dashboard

Approved students see their next class, current enrollment count, relevant
announcements, and upcoming examination or academic deadlines. Students whose
applications are not approved see a restricted state instead of live academic
data.

## Security

- Better Auth manages sessions and credential accounts.
- Passwords use the Better Auth-compatible scrypt format.
- Server routes enforce administrator, department administrator, lecturer, or
  student roles before accessing protected data.
- Department administrator operations are scoped to one department.
- Student import rejects cross-role identity conflicts and mismatched identifiers.
- Role templates, permission overrides, and audit records support finer-grained
  governance.

## Key Routes

| Role | Dashboard | Main routes |
| --- | --- | --- |
| Administrator | `/administrator` | `/administrator/student-profiles`, `/administrator/student-applications`, `/administrator/announcements`, `/administrator/academic-sessions`, `/administrator/programmes-and-courses` |
| Department Administrator | `/department-admin` | `/department-admin/staff-management`, `/department-admin/programmes-and-courses`, `/department-admin/announcements`, `/department-admin/analytics` |
| Lecturer | `/lecturer` | `/lecturer/courses`, `/lecturer/messaging`, `/lecturer/announcements`, `/lecturer/academic-sessions` |
| Student | `/student/dashboard` | `/student/course-offerings`, `/student/academic-calendar`, `/student/announcements`, `/student/messaging`, `/student/profile` |

## Technology

The application uses Next.js and React for the interface, React Query and Axios
for client data access, Prisma with PostgreSQL for durable data, Better Auth for
authentication, Cloudinary for media, and provider-backed email and SMS services
for external delivery.
