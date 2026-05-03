-- AlterTable
ALTER TABLE "User" 
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "googleId" TEXT,

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_avatarUrl_key" ON "User"("avatarUrl");