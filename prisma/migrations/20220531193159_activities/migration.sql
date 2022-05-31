/*
  Warnings:

  - The values [DISCONECT] on the enum `StationActivityType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StationActivityType_new" AS ENUM ('DISCONNECT', 'CONNECT', 'ORDER');
ALTER TABLE "activities" ALTER COLUMN "type" TYPE "StationActivityType_new" USING ("type"::text::"StationActivityType_new");
ALTER TYPE "StationActivityType" RENAME TO "StationActivityType_old";
ALTER TYPE "StationActivityType_new" RENAME TO "StationActivityType";
DROP TYPE "StationActivityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_stationId_fkey";

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_userId_fkey";

-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "stationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
