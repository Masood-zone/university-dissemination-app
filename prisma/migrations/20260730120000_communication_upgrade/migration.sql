ALTER TABLE "user"
  ADD COLUMN "phoneNumber" TEXT,
  ADD COLUMN "phoneNumberVerified" BOOLEAN NOT NULL DEFAULT false;

WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN length(regexp_replace(phone, '\D', '', 'g')) = 10
        AND regexp_replace(phone, '\D', '', 'g') LIKE '0%'
        THEN '233' || substring(regexp_replace(phone, '\D', '', 'g') FROM 2)
      WHEN length(regexp_replace(phone, '\D', '', 'g')) = 12
        AND regexp_replace(phone, '\D', '', 'g') LIKE '233%'
        THEN regexp_replace(phone, '\D', '', 'g')
      ELSE NULL
    END AS value
  FROM "user"
  WHERE phone IS NOT NULL
),
unambiguous AS (
  SELECT value
  FROM normalized
  WHERE value IS NOT NULL
  GROUP BY value
  HAVING count(*) = 1
)
UPDATE "user" AS u
SET "phoneNumber" = n.value
FROM normalized AS n
JOIN unambiguous AS a ON a.value = n.value
WHERE u.id = n.id;

CREATE UNIQUE INDEX "user_phoneNumber_key" ON "user"("phoneNumber");

ALTER TABLE "Announcement"
  ADD COLUMN "audienceAll" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "broadcastClaimedAt" TIMESTAMP(3),
  ADD COLUMN "broadcastedAt" TIMESTAMP(3);

CREATE TABLE "AnnouncementAudienceRole" (
  "announcementId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  CONSTRAINT "AnnouncementAudienceRole_pkey" PRIMARY KEY ("announcementId", "role")
);

CREATE TABLE "AnnouncementAudienceDepartment" (
  "announcementId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  CONSTRAINT "AnnouncementAudienceDepartment_pkey" PRIMARY KEY ("announcementId", "departmentId")
);

CREATE TABLE "AnnouncementAudienceCourseOffering" (
  "announcementId" TEXT NOT NULL,
  "courseOfferingId" TEXT NOT NULL,
  CONSTRAINT "AnnouncementAudienceCourseOffering_pkey" PRIMARY KEY ("announcementId", "courseOfferingId")
);

CREATE TABLE "AnnouncementRecipient" (
  "announcementId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "inAppNotifiedAt" TIMESTAMP(3),
  "emailStatus" TEXT,
  "smsStatus" TEXT,
  "firstViewedAt" TIMESTAMP(3),
  "lastViewedAt" TIMESTAMP(3),
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnnouncementRecipient_pkey" PRIMARY KEY ("announcementId", "userId")
);

CREATE INDEX "Announcement_broadcastedAt_idx" ON "Announcement"("broadcastedAt");
CREATE INDEX "AnnouncementAudienceRole_role_idx" ON "AnnouncementAudienceRole"("role");
CREATE INDEX "AnnouncementAudienceDepartment_departmentId_idx" ON "AnnouncementAudienceDepartment"("departmentId");
CREATE INDEX "AnnouncementAudienceCourseOffering_courseOfferingId_idx" ON "AnnouncementAudienceCourseOffering"("courseOfferingId");
CREATE INDEX "AnnouncementRecipient_userId_idx" ON "AnnouncementRecipient"("userId");
CREATE INDEX "AnnouncementRecipient_firstViewedAt_idx" ON "AnnouncementRecipient"("firstViewedAt");

ALTER TABLE "AnnouncementAudienceRole"
  ADD CONSTRAINT "AnnouncementAudienceRole_announcementId_fkey"
  FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementAudienceDepartment"
  ADD CONSTRAINT "AnnouncementAudienceDepartment_announcementId_fkey"
  FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementAudienceDepartment"
  ADD CONSTRAINT "AnnouncementAudienceDepartment_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementAudienceCourseOffering"
  ADD CONSTRAINT "AnnouncementAudienceCourseOffering_announcementId_fkey"
  FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementAudienceCourseOffering"
  ADD CONSTRAINT "AnnouncementAudienceCourseOffering_courseOfferingId_fkey"
  FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementRecipient"
  ADD CONSTRAINT "AnnouncementRecipient_announcementId_fkey"
  FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementRecipient"
  ADD CONSTRAINT "AnnouncementRecipient_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Announcement"
SET "audienceAll" = ("departmentId" IS NULL AND "courseOfferingId" IS NULL);

INSERT INTO "AnnouncementAudienceDepartment" ("announcementId", "departmentId")
SELECT id, "departmentId"
FROM "Announcement"
WHERE "departmentId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "AnnouncementAudienceCourseOffering" ("announcementId", "courseOfferingId")
SELECT id, "courseOfferingId"
FROM "Announcement"
WHERE "courseOfferingId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "AnnouncementRecipient" ("announcementId", "userId", "createdAt", "updatedAt")
SELECT a.id, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Announcement" a
JOIN "user" u ON u."isActive" = true AND u.id <> a."authorId"
WHERE a."audienceAll" = true
ON CONFLICT DO NOTHING;

INSERT INTO "AnnouncementRecipient" ("announcementId", "userId", "createdAt", "updatedAt")
SELECT a.id, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Announcement" a
JOIN "user" u ON u."departmentId" = a."departmentId" AND u."isActive" = true AND u.id <> a."authorId"
WHERE a."departmentId" IS NOT NULL AND a."courseOfferingId" IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO "AnnouncementRecipient" ("announcementId", "userId", "createdAt", "updatedAt")
SELECT a.id, e."studentId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Announcement" a
JOIN "Enrollment" e ON e."offeringId" = a."courseOfferingId"
JOIN "user" u ON u.id = e."studentId" AND u."isActive" = true
WHERE a."courseOfferingId" IS NOT NULL AND e."studentId" <> a."authorId"
ON CONFLICT DO NOTHING;

INSERT INTO "AnnouncementRecipient" ("announcementId", "userId", "createdAt", "updatedAt")
SELECT a.id, ca."lecturerId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Announcement" a
JOIN "CourseAssignment" ca ON ca."offeringId" = a."courseOfferingId"
JOIN "user" u ON u.id = ca."lecturerId" AND u."isActive" = true
WHERE a."courseOfferingId" IS NOT NULL AND ca."lecturerId" <> a."authorId"
ON CONFLICT DO NOTHING;
