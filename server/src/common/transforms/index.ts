import { Transform } from 'class-transformer';

/**
 * Normalising transforms for DTOs.
 *
 * Wrappers rather than inline `@Transform(({ value }) => ...)` for two
 * reasons: `value` is typed `any` in class-transformer's callback, so every
 * inline use silently reintroduces `any` into a validated boundary; and
 * normalisation belongs in one place, so "trimmed and lower-cased" means the
 * same thing on every field that claims it.
 *
 * Each helper leaves a non-string untouched, so the accompanying
 * `@IsString()` / `@IsEmail()` still produces the right error rather than the
 * transform throwing first.
 */

/** Trims surrounding whitespace. */
export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

/**
 * Trims and lower-cases. Used for usernames and email addresses, whose columns
 * are `citext` — this keeps the value stored in a canonical form so it reads
 * consistently in logs and audit rows, while the database enforces the
 * case-insensitive uniqueness itself.
 */
export const TrimLowercase = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

/**
 * Parses the string forms of a boolean that arrive in a query string.
 *
 * `?isActive=false` is the string "false", which is truthy — so without this a
 * filter meant to exclude records silently includes them.
 */
export const ToOptionalBoolean = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  });
