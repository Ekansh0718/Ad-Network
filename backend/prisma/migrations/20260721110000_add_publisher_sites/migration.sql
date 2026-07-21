CREATE TABLE "PublisherSite" (
    "id" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "adsTxtUrl" TEXT NOT NULL,
    "expectedText" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublisherSite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublisherSite_publisherId_domain_key" ON "PublisherSite"("publisherId", "domain");
CREATE INDEX "PublisherSite_publisherId_idx" ON "PublisherSite"("publisherId");
CREATE INDEX "PublisherSite_verified_idx" ON "PublisherSite"("verified");

ALTER TABLE "PublisherSite" ADD CONSTRAINT "PublisherSite_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
