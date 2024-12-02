-- CreateTable
CREATE TABLE "User" (
    "npub" TEXT NOT NULL PRIMARY KEY,
    "adminNpub" TEXT NOT NULL,
    "addTimestamp" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Sender" (
    "user" TEXT NOT NULL,
    "npub" TEXT NOT NULL,
    "nip46Key" TEXT NOT NULL,
    "addTimestamp" INTEGER NOT NULL,

    PRIMARY KEY ("user", "npub")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "user" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "addTimestamp" INTEGER NOT NULL,

    PRIMARY KEY ("user", "id")
);

-- CreateTable
CREATE TABLE "Send" (
    "user" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "dmId" TEXT NOT NULL,
    "senderNpub" TEXT NOT NULL,
    "npub" TEXT NOT NULL,
    "addTimestamp" INTEGER NOT NULL,
    "whenTimestamp" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    PRIMARY KEY ("user", "id")
);
