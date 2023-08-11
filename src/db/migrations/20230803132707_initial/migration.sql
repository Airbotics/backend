-- CreateEnum
CREATE TYPE "command_state" AS ENUM ('created', 'sent', 'error', 'executed');

-- CreateEnum
CREATE TYPE "robot_compose_file_state" AS ENUM ('pending_up', 'pending_down', 'up', 'down', 'error');

-- CreateEnum
CREATE TYPE "account_tenant_role" AS ENUM ('owner');

-- CreateEnum
CREATE TYPE "log_level" AS ENUM ('debug', 'info', 'warn', 'error', 'fatal');

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "accounts" (
    "uuid" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "account_tenants" (
    "account_uuid" TEXT NOT NULL,
    "tenant_uuid" TEXT NOT NULL,
    "role" "account_tenant_role" NOT NULL,

    CONSTRAINT "account_tenants_pkey" PRIMARY KEY ("account_uuid","tenant_uuid")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tenant_uuid" TEXT NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "robots" (
    "uuid" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provisioned" BOOLEAN NOT NULL DEFAULT false,
    "token_hint" TEXT NOT NULL,
    "token_value" TEXT NOT NULL,
    "online_updated_at" TIMESTAMP(3),
    "online" BOOLEAN,
    "agent_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logs_enabled" BOOLEAN NOT NULL DEFAULT false,
    "logs_first_recording" TIMESTAMP(3),
    "logs_last_recording" TIMESTAMP(3),
    "logs_num_recordings" INTEGER NOT NULL DEFAULT 0,
    "tenant_uuid" TEXT NOT NULL,

    CONSTRAINT "robots_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "vitals" (
    "uuid" TEXT NOT NULL,
    "cpu" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "ram" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "disk" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "battery" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "robot_uuid" TEXT NOT NULL,
    "tenant_uuid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vitals_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "commands" (
    "uuid" TEXT NOT NULL,
    "interface" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "state" "command_state" NOT NULL DEFAULT 'created',
    "error_code" TEXT,
    "tenant_uuid" TEXT NOT NULL,
    "robot_uuid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commands_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "compose_files" (
    "uuid" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "tenant_uuid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compose_files_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "robot_compose_files" (
    "tenant_uuid" TEXT NOT NULL,
    "robot_uuid" TEXT NOT NULL,
    "compose_file_uuid" TEXT NOT NULL,
    "state" "robot_compose_file_state" NOT NULL,
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "robot_compose_files_pkey" PRIMARY KEY ("tenant_uuid","robot_uuid")
);

-- CreateTable
CREATE TABLE "logs" (
    "uuid" TEXT NOT NULL,
    "stamp" TIMESTAMP(3) NOT NULL,
    "level" "log_level" NOT NULL,
    "name" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "function" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "msg" TEXT NOT NULL,
    "tenant_uuid" TEXT NOT NULL,
    "robot_uuid" TEXT NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "streams" (
    "uuid" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hz" DOUBLE PRECISION NOT NULL,
    "first_recording" TIMESTAMP(3),
    "last_recording" TIMESTAMP(3),
    "num_recordings" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_uuid" TEXT NOT NULL,
    "robot_uuid" TEXT NOT NULL,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "datapoints" (
    "uuid" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "stream_uuid" TEXT NOT NULL,
    "tenant_uuid" TEXT NOT NULL,
    "robot_uuid" TEXT NOT NULL,

    CONSTRAINT "datapoints_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sid_key" ON "sessions"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_uuid_key" ON "tenants"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_uuid_key" ON "accounts"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_uuid_key" ON "api_keys"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_value_key" ON "api_keys"("value");

-- CreateIndex
CREATE UNIQUE INDEX "robots_uuid_key" ON "robots"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "robots_id_tenant_uuid_key" ON "robots"("id", "tenant_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "vitals_uuid_key" ON "vitals"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "commands_uuid_key" ON "commands"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "compose_files_uuid_key" ON "compose_files"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "compose_files_id_tenant_uuid_key" ON "compose_files"("id", "tenant_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "logs_uuid_key" ON "logs"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "streams_uuid_key" ON "streams"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "streams_robot_uuid_source_key" ON "streams"("robot_uuid", "source");

-- CreateIndex
CREATE UNIQUE INDEX "datapoints_uuid_key" ON "datapoints"("uuid");

-- AddForeignKey
ALTER TABLE "account_tenants" ADD CONSTRAINT "account_tenants_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_tenants" ADD CONSTRAINT "account_tenants_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robots" ADD CONSTRAINT "robots_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_robot_uuid_fkey" FOREIGN KEY ("robot_uuid") REFERENCES "robots"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_robot_uuid_fkey" FOREIGN KEY ("robot_uuid") REFERENCES "robots"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compose_files" ADD CONSTRAINT "compose_files_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_compose_files" ADD CONSTRAINT "robot_compose_files_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_compose_files" ADD CONSTRAINT "robot_compose_files_robot_uuid_fkey" FOREIGN KEY ("robot_uuid") REFERENCES "robots"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_compose_files" ADD CONSTRAINT "robot_compose_files_compose_file_uuid_fkey" FOREIGN KEY ("compose_file_uuid") REFERENCES "compose_files"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_robot_uuid_fkey" FOREIGN KEY ("robot_uuid") REFERENCES "robots"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streams" ADD CONSTRAINT "streams_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streams" ADD CONSTRAINT "streams_robot_uuid_fkey" FOREIGN KEY ("robot_uuid") REFERENCES "robots"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoints" ADD CONSTRAINT "datapoints_stream_uuid_fkey" FOREIGN KEY ("stream_uuid") REFERENCES "streams"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoints" ADD CONSTRAINT "datapoints_tenant_uuid_fkey" FOREIGN KEY ("tenant_uuid") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datapoints" ADD CONSTRAINT "datapoints_robot_uuid_fkey" FOREIGN KEY ("robot_uuid") REFERENCES "robots"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
