-- Retire the Finance module and its stored data.
DELETE FROM "Notification" WHERE "type" = 'PAYMENT';

ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
CREATE TYPE "NotificationType" AS ENUM ('ANNOUNCEMENT', 'MESSAGE', 'SYSTEM', 'ACADEMIC');
ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE "NotificationType"
  USING ("type"::text::"NotificationType");
DROP TYPE "NotificationType_old";

DROP TABLE IF EXISTS "PaymentTransaction";
DROP TABLE IF EXISTS "Fee";
DROP TABLE IF EXISTS "ProgrammeFee";

DROP TYPE IF EXISTS "PaymentTransactionStatus";
DROP TYPE IF EXISTS "PaymentStatus";
