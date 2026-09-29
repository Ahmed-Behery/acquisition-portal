import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema: companies, users, refresh tokens, login attempts.
 *
 * Written as explicit SQL rather than generated from the entities. Generated
 * migrations are convenient and almost right — they routinely miss partial
 * indexes, CHECK constraints, extension setup and index naming, all of which
 * are load-bearing here. A migration is production-change code and gets
 * reviewed as such.
 *
 * Every statement is reversible; `down` drops in dependency order.
 */
export class InitialSchema1735000000000 implements MigrationInterface {
  name = 'InitialSchema1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* ---------------------------------------------------------- extensions */

    // pgcrypto → gen_random_uuid(); citext → case-insensitive text so that
    // username/email uniqueness is enforced by the database rather than by
    // every call site remembering to lower-case its input.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);

    /* --------------------------------------------------------------- enums */

    // Values match the legacy data/store.json exactly so the import migration
    // needs no translation table.
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM (
        'Admin', 'CEO', 'MD', 'Head of Products', 'RM', 'Employee'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "user_group" AS ENUM ('MD', 'C-Level', 'Branch Manager')
    `);

    /* ----------------------------------------------------------- companies */

    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code"       varchar(16)  NOT NULL,
        "name"       varchar(200) NOT NULL,
        "focus"      text,
        "is_active"  boolean      NOT NULL DEFAULT true,
        "sort_order" integer      NOT NULL DEFAULT 0,
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        "updated_at" timestamptz  NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "chk_companies_code_format" CHECK ("code" ~ '^[A-Z][A-Z0-9]{1,15}$')
      )
    `);

    // Partial unique index rather than a UNIQUE constraint: a soft-deleted
    // company must not block re-use of its code.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_companies_code" ON "companies" ("code")
      WHERE "deleted_at" IS NULL
    `);

    /* --------------------------------------------------------------- users */

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "username"             citext       NOT NULL,
        "email"                citext       NOT NULL,
        "name"                 varchar(200) NOT NULL,
        "role"                 "user_role"  NOT NULL,
        "group"                "user_group",
        "company_id"           uuid,
        "job_title"            varchar(200),
        "phone"                varchar(40),
        "password_hash"        text         NOT NULL,
        "password_changed_at"  timestamptz,
        "must_change_password" boolean      NOT NULL DEFAULT false,
        "is_active"            boolean      NOT NULL DEFAULT true,
        "failed_login_count"   integer      NOT NULL DEFAULT 0,
        "locked_until"         timestamptz,
        "last_login_at"        timestamptz,
        "version"              integer      NOT NULL DEFAULT 1,
        "created_at"           timestamptz  NOT NULL DEFAULT now(),
        "updated_at"           timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"           timestamptz,

        CONSTRAINT "fk_users_company"
          FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE RESTRICT,

        -- A Relationship Manager's visibility is scoped by company, so an RM
        -- without one is not a valid record. Enforced here because a check the
        -- application can forget is a check that will eventually be forgotten.
        CONSTRAINT "chk_users_rm_requires_company"
          CHECK ("role" <> 'RM' OR "company_id" IS NOT NULL),

        CONSTRAINT "chk_users_username_format"
          CHECK ("username" ~ '^[a-zA-Z0-9._-]{3,50}$'),

        CONSTRAINT "chk_users_failed_login_count"
          CHECK ("failed_login_count" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_users_username" ON "users" ("username")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_users_company" ON "users" ("company_id") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role")`);
    // Supports the notification-audience query (users in a directory group).
    await queryRunner.query(`
      CREATE INDEX "idx_users_group" ON "users" ("group") WHERE "group" IS NOT NULL
    `);

    /* ------------------------------------------------------ refresh tokens */

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"        uuid        NOT NULL,
        "token_hash"     char(64)    NOT NULL,
        "family_id"      uuid        NOT NULL,
        "expires_at"     timestamptz NOT NULL,
        "revoked_at"     timestamptz,
        "revoked_reason" varchar(40),
        "replaced_by_id" uuid,
        "ip"             inet,
        "user_agent"     varchar(400),
        "created_at"     timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "fk_refresh_tokens_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_refresh_tokens_replaced_by"
          FOREIGN KEY ("replaced_by_id") REFERENCES "refresh_tokens" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_refresh_tokens_hash" ON "refresh_tokens" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id")
    `);
    // Revoking a whole family on reuse detection is a single indexed delete-scan.
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_family" ON "refresh_tokens" ("family_id")
      WHERE "revoked_at" IS NULL
    `);
    // Drives the expired-token cleanup job.
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_expires" ON "refresh_tokens" ("expires_at")
      WHERE "revoked_at" IS NULL
    `);

    /* ------------------------------------------------------ login attempts */

    await queryRunner.query(`
      CREATE TABLE "login_attempts" (
        "id"             bigserial PRIMARY KEY,
        "username"       citext      NOT NULL,
        "user_id"        uuid,
        "successful"     boolean     NOT NULL,
        "failure_reason" varchar(40),
        "ip"             inet,
        "user_agent"     varchar(400),
        "created_at"     timestamptz NOT NULL DEFAULT now()
      )
    `);

    // No FK to users: attempts against non-existent accounts are precisely the
    // ones a security review wants to see.
    await queryRunner.query(`
      CREATE INDEX "idx_login_attempts_username_time"
        ON "login_attempts" ("username", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_login_attempts_ip_time"
        ON "login_attempts" ("ip", "created_at" DESC) WHERE "ip" IS NOT NULL
    `);

    /* ------------------------------------------------- updated_at triggers */

    // Maintained by the database so a raw SQL UPDATE cannot leave a stale
    // timestamp behind. TypeORM's @UpdateDateColumn covers the ORM path only.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
      BEGIN
        NEW."updated_at" = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    for (const table of ['companies', 'users']) {
      await queryRunner.query(`
        CREATE TRIGGER "trg_${table}_updated_at"
        BEFORE UPDATE ON "${table}"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['users', 'companies']) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_${table}_updated_at" ON "${table}"`);
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at()`);

    await queryRunner.query(`DROP TABLE IF EXISTS "login_attempts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "user_group"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);

    // Extensions are intentionally left in place — they may be shared with
    // other schemas in the same database, and dropping them is not this
    // migration's business.
  }
}
