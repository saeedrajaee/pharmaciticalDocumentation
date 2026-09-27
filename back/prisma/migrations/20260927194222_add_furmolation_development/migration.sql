-- CreateTable
CREATE TABLE "Step7FurmolationDevelopment" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "furmol" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "manufacturingMethod" TEXT,
    "packaging" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step7FurmolationDevelopment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Step7FurmolationDevelopment" ADD CONSTRAINT "Step7FurmolationDevelopment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step7FurmolationDevelopment" ADD CONSTRAINT "Step7FurmolationDevelopment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
