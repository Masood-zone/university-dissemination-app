$ErrorActionPreference = 'Stop'

$out = Join-Path (Get-Location) 'SIDS-How-This-System-Works.pptx'
$pp = New-Object -ComObject PowerPoint.Application
$pp.Visible = -1
$presentation = $pp.Presentations.Add()

$navy = 0x3B1F0B
$blue = 0xD17A16
$teal = 0xA88D0D
$sky = 0xF4B743
$ink = 0x3A2A1D
$muted = 0x807363
$white = 0xFFFFFF
$pale = 0xF8F4EF

function Set-Text($shape, $text, $size, $color, $bold = $false) {
  $shape.TextFrame.TextRange.Text = $text
  $shape.TextFrame.TextRange.Font.Name = 'Aptos Display'
  $shape.TextFrame.TextRange.Font.Size = $size
  $shape.TextFrame.TextRange.Font.Color.RGB = $color
  $shape.TextFrame.TextRange.Font.Bold = [int]$bold
  $shape.TextFrame.MarginLeft = 0
  $shape.TextFrame.MarginRight = 0
  $shape.TextFrame.MarginTop = 0
  $shape.TextFrame.MarginBottom = 0
}

function Add-Base($slide, $number, $title, $kicker = 'UNIVERSITY INFORMATION DISSEMINATION SYSTEM') {
  $slide.FollowMasterBackground = 0
  $slide.Background.Fill.ForeColor.RGB = $pale
  $bar = $slide.Shapes.AddShape(1, 0, 0, 960, 46)
  $bar.Fill.ForeColor.RGB = $navy; $bar.Line.Visible = 0
  $label = $slide.Shapes.AddTextbox(1, 48, 14, 680, 20)
  Set-Text $label $kicker 10 $white $true
  $n = $slide.Shapes.AddTextbox(1, 875, 14, 38, 20)
  Set-Text $n ('{0:D2}' -f $number) 10 $white $true
  $heading = $slide.Shapes.AddTextbox(1, 48, 78, 850, 48)
  Set-Text $heading $title 28 $navy $true
  $line = $slide.Shapes.AddShape(1, 48, 137, 116, 5)
  $line.Fill.ForeColor.RGB = $teal; $line.Line.Visible = 0
}

function Add-Bullets($slide, $items, $x = 58, $y = 174, $w = 820, $h = 300, $fontSize = 18) {
  $box = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
  $range = $box.TextFrame.TextRange
  $range.Text = ($items -join "`r")
  $range.Font.Name = 'Aptos'; $range.Font.Size = $fontSize; $range.Font.Color.RGB = $ink
  $box.TextFrame.WordWrap = -1
  for ($i = 1; $i -le $range.Paragraphs().Count; $i++) {
    $p = $range.Paragraphs($i,1)
    $p.ParagraphFormat.Bullet.Visible = -1
    $p.ParagraphFormat.SpaceAfter = 11
  }
}

function Add-Card($slide, $x, $y, $w, $h, $title, $body, $accent = $blue) {
  $card = $slide.Shapes.AddShape(5, $x, $y, $w, $h)
  $card.Fill.ForeColor.RGB = $white; $card.Line.ForeColor.RGB = 0xE6DDD4
  $strip = $slide.Shapes.AddShape(1, $x, $y, $w, 7)
  $strip.Fill.ForeColor.RGB = $accent; $strip.Line.Visible = 0
  $t = $slide.Shapes.AddTextbox(1, $x + 16, $y + 22, $w - 32, 27); Set-Text $t $title 16 $navy $true
  $b = $slide.Shapes.AddTextbox(1, $x + 16, $y + 58, $w - 32, $h - 70); Set-Text $b $body 12 $ink $false
  $b.TextFrame.WordWrap = -1
}

function Add-Flow($slide, $labels, $y = 270) {
  $count = $labels.Count; $width = 150; $gap = [int]((840 - ($count * $width)) / [Math]::Max(1, ($count - 1))); $x = 58
  for ($i=0; $i -lt $count; $i++) {
    $box = $slide.Shapes.AddShape(5, $x, $y, $width, 76)
    $box.Fill.ForeColor.RGB = $white; $box.Line.ForeColor.RGB = $blue
    $txt = $slide.Shapes.AddTextbox(1, $x + 10, $y + 19, $width - 20, 38); Set-Text $txt $labels[$i] 14 $navy $true
    $txt.TextFrame.TextRange.ParagraphFormat.Alignment = 2
    if ($i -lt $count-1) {
      $arrow = $slide.Shapes.AddShape(33, $x + $width + 8, $y + 28, $gap - 16, 20)
      $arrow.Fill.ForeColor.RGB = $teal; $arrow.Line.Visible = 0
    }
    $x += $width + $gap
  }
}

$slides = @(
  @{title='How This System Works'; kicker='SIDS PROJECT WALKTHROUGH'; body=@('University Information Dissemination System (SIDS)','A complete, end-to-end guide for the project group','One portal. The right information. The right audience. The right channel.')},
  @{title='The problem SIDS solves'; body=@('University information often moves through fragmented, informal channels.','SIDS brings announcements, admissions, teaching communication, academic structure and academic visibility into one platform.','The goal: make communication targeted, timely, traceable and role-aware.')},
  @{title='System at a glance'; body=@('Public applicants enter through the enrollment portal.','Four authenticated roles use separate dashboards: Administrator, Department Administrator, Lecturer and Student.','Information is delivered through in-app alerts, email and SMS.')},
  @{title='Role-based experience'; body=@('Administrator — university-wide configuration, applications, students, announcements and access control.','Department Administrator — people, programmes, courses and announcements within one department.','Lecturer — assigned courses, schedules and course-context messaging.','Student — dashboard, announcements, courses, calendar, messaging and profile.')},
  @{title='Technical architecture'; body=@('Next.js + React renders the web interface.','React Query and Axios call protected Next.js API routes.','Business logic performs authentication, authorization and validation.','Prisma maps data access to PostgreSQL, the source of truth.','Supporting services: Better Auth, Zod, Zustand, Cloudinary, Nodemailer and UelloSend.')},
  @{title='Core academic data model'; body=@('Department contains users, programmes, courses and course offerings.','Academic Session and Semester organize when courses are available.','A Course Offering joins a course to a session, semester, department, lecturer assignment and enrolled students.','Students accumulate applications, enrollments, messages and notifications.')},
  @{title='Academic setup workflow'; body=@('Administrator creates departments, sessions and semesters.','Programmes and courses are defined.','Department Administrator creates active offerings and assigns lecturers.','Lecturers publish timetable details.','This setup controls who sees a course and who can communicate.')},
  @{title='Public enrollment journey'; body=@('1. Personal details','2. Academic selection','3. Programme selection','4. Review, declaration and submit','The server validates the programme belongs to the selected department and creates a unique application number.')},
  @{title='From application to active student'; body=@('A new applicant receives a Student account, Student Profile and secure temporary credential.','The application enters SUBMITTED status for administrator review.','Administrator reviews the application and approves or rejects it.','Approval automatically enrolls the student in matching active offerings for the current semester.')},
  @{title='Announcements: the broadcast channel'; body=@('Lifecycle: DRAFT to PUBLISHED to ARCHIVED.','Announcements support category, markdown content, priority, pinned state, image, expiry and view count.','Scope can be university-wide, department-specific or course-offering-specific.','Only the relevant audience sees an announcement in its feed.')},
  @{title='Announcement delivery pipeline'; body=@('Recipients are selected from active users; department announcements include the department plus administrators.','A persistent, unread in-app notification is created for every recipient.','The system then attempts HTML email and SMS delivery.','Metadata records the per-channel status. Processing runs in batches of 8.','A provider failure never prevents the announcement from being published.')},
  @{title='Direct messaging stays academic'; body=@('Lecturers message only students enrolled in their assigned course offerings, including batch messages to a class.','Students message only lecturers who teach a course they are enrolled in.','Messages are stored with SENT, DELIVERED and READ status.','Lecturer messages create in-app MESSAGE notifications and also attempt email/SMS; student replies attempt email/SMS to the lecturer.')},
  @{title='Notifications and reliable delivery'; body=@('The notification center stores read/unread history for announcement, message, system and academic events.','Examples: enrollment submission, application decision, password reset and published announcement.','Channel status metadata makes delivery observable.','The database notification remains available even if an external email or SMS provider is unavailable.')},
  @{title='Student academic experience'; body=@('The student dashboard brings current information and action items together.','Students see current enrollments, course offerings and academic-calendar events.','Live academic data powers the next-class and enrollment summaries.','Upcoming examinations and announcements keep each student informed.')},
  @{title='Security, governance and data quality'; body=@('Better Auth manages login sessions; passwords are securely hashed and reset links expire after 15 minutes.','Protected API routes require an authenticated session and the correct role.','Role templates and individual permission overrides enable finer access control.','Audit logs can capture actor, action, resource and request context.','Zod and server-side checks validate input and protect academic relationships.')},
  @{title='The complete SIDS story'; body=@('University configures academic structure and assigns staff.','Applicant enrolls; administrator reviews and approves.','The system connects approved students to their current course offerings.','Staff communicate through targeted announcements and course-aware messages.','Students receive resilient, persistent information in one personalized portal.','SIDS is a secure operating system for campus information flow.')}
)

for ($i = 0; $i -lt $slides.Count; $i++) {
  $slide = $presentation.Slides.Add($i + 1, 12)
  $s = $slides[$i]
  if ($i -eq 0) {
    $slide.Background.Fill.ForeColor.RGB = $navy
    $accent = $slide.Shapes.AddShape(1, 0, 0, 960, 38); $accent.Fill.ForeColor.RGB = $teal; $accent.Line.Visible = 0
    $tag = $slide.Shapes.AddTextbox(1, 66, 120, 600, 24); Set-Text $tag $s.kicker 13 $sky $true
    $h = $slide.Shapes.AddTextbox(1, 66, 165, 760, 80); Set-Text $h $s.title 39 $white $true
    $sub = $slide.Shapes.AddTextbox(1, 66, 275, 690, 100); Set-Text $sub ($s.body -join "`r") 18 0xE8E1D9 $false
    $network = $slide.Shapes.AddShape(5, 705, 130, 170, 170); $network.Fill.ForeColor.RGB = $blue; $network.Line.Visible = 0
    $circle = $slide.Shapes.AddShape(9, 748, 173, 84, 84); $circle.Fill.ForeColor.RGB = $teal; $circle.Line.Visible = 0
    continue
  }
  Add-Base $slide ($i + 1) $s.title
  if ($i -eq 2) { Add-Flow $slide @('Applicant','Role-based portal','Information services','In-app / Email / SMS') 255; Add-Bullets $slide $s.body 58 170 820 75 16 }
  elseif ($i -eq 4) { Add-Flow $slide @('Browser UI','Protected API','Business logic','PostgreSQL') 265; Add-Bullets $slide $s.body 58 170 840 80 15 }
  elseif ($i -eq 6) { Add-Flow $slide @('Departments','Programmes + courses','Offerings + lecturers','Student access') 275; Add-Bullets $slide $s.body 58 170 820 75 16 }
  elseif ($i -eq 7) { Add-Flow $slide @('Personal','Academic','Programme','Review + submit') 270; Add-Bullets $slide $s.body 58 170 820 80 16 }
  elseif ($i -eq 10) { Add-Flow $slide @('Publish','Select recipients','Create in-app','Attempt email + SMS') 265; Add-Bullets $slide $s.body 58 170 850 82 15 }
  elseif ($i -eq 15) { Add-Flow $slide @('Configure','Enroll','Approve','Communicate','Inform') 260; Add-Bullets $slide $s.body 58 170 820 75 16 }
  elseif ($i -eq 3) { Add-Card $slide 58 185 195 165 'Administrator' 'University-wide control' $blue; Add-Card $slide 275 185 195 165 'Department Admin' 'Department-level management' $teal; Add-Card $slide 492 185 195 165 'Lecturer' 'Teaching and course messaging' $sky; Add-Card $slide 709 185 195 165 'Student' 'Personalized information portal' $blue; Add-Bullets $slide $s.body 58 385 820 115 14 }
  else { Add-Bullets $slide $s.body }
}

$presentation.PageSetup.SlideSize = 15
$presentation.SaveAs($out)
$presentation.Close()
$pp.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($pp) | Out-Null
Write-Output "Created $out"
