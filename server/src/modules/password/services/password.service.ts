import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { AppConfig } from 'src/config/configuration';

/**
 * Password hashing and verification.
 *
 * Argon2id, not bcrypt. The legacy application used `bcryptjs` — a pure-JS
 * implementation roughly an order of magnitude slower than native bcrypt,
 * which in practice forces a low cost factor to keep logins responsive, so
 * the weakest link ends up being the algorithm chosen to protect the
 * passwords. Argon2id is the current OWASP first choice and resists GPU and
 * ASIC attack in a way bcrypt does not.
 *
 * Parameters come from configuration (OWASP's baseline: 19 MiB, t=2, p=1) so
 * they can be raised as hardware improves without a code change. Measure
 * before raising: the target is 250-500 ms per hash on the production
 * instance type.
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly options: argon2.Options;

  /**
   * A real hash of a random value, used to spend the same CPU time when the
   * username does not exist as when it does. Without it, an unknown username
   * returns in microseconds and a known one in ~300 ms — a timing oracle that
   * enumerates valid accounts regardless of how carefully the error messages
   * are worded (section 4).
   */
  private dummyHash: string | null = null;

  constructor(configService: ConfigService<AppConfig, true>) {
    const config = configService.get('password', { infer: true });
    this.options = {
      type: argon2.argon2id,
      memoryCost: config.memoryKib,
      timeCost: config.timeCost,
      parallelism: config.parallelism,
    };
  }

  async hash(plaintext: string): Promise<string> {
    return argon2.hash(plaintext, this.options);
  }

  /**
   * Verifies a password against a stored digest.
   *
   * Returns false rather than throwing on a malformed digest: a corrupt row
   * must read as "wrong password", not as a 500 that tells the caller this
   * particular account is interesting.
   */
  async verify(digest: string, plaintext: string): Promise<boolean> {
    try {
      return await argon2.verify(digest, plaintext);
    } catch (error: unknown) {
      this.logger.error(
        `Password verification failed for a stored digest: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return false;
    }
  }

  /**
   * Burns equivalent CPU time on the unknown-user path. Callers must await
   * this before returning InvalidCredentialsException so both branches cost
   * the same.
   */
  async verifyDummy(plaintext: string): Promise<void> {
    this.dummyHash ??= await argon2.hash(randomBytes(32).toString('hex'), this.options);
    await this.verify(this.dummyHash, plaintext);
  }

  /**
   * True when a stored digest was produced with weaker parameters than the
   * current configuration — the signal to re-hash transparently on the next
   * successful sign-in, so raising the cost factor upgrades existing accounts
   * without a forced reset.
   */
  needsRehash(digest: string): boolean {
    try {
      return argon2.needsRehash(digest, this.options);
    } catch {
      // Unparseable digest (e.g. a legacy bcrypt hash): treat as needing a
      // rehash so it is replaced at the next opportunity.
      return true;
    }
  }

  /**
   * Generates the single-use credential handed to a newly created account.
   *
   * Drawn from a reduced alphabet — no `0/O`, `1/l/I` — because this string is
   * read aloud or retyped from a message, and an ambiguous character becomes a
   * support call. 20 characters of this alphabet is ~103 bits of entropy,
   * which is ample for a credential that must be changed at first use.
   */
  generateTemporaryPassword(length = 20): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const bytes = randomBytes(length * 2);
    let password = '';

    // Rejection sampling: `% alphabet.length` on a raw byte biases the first
    // few characters of the alphabet. Discarding out-of-range bytes keeps the
    // distribution uniform.
    const limit = Math.floor(256 / alphabet.length) * alphabet.length;
    for (let i = 0; i < bytes.length && password.length < length; i += 1) {
      const byte = bytes[i];
      if (byte < limit) password += alphabet[byte % alphabet.length];
    }

    return password.length === length ? password : this.generateTemporaryPassword(length);
  }

  /** Constant-time comparison for opaque tokens (not passwords — those use argon2). */
  safeCompare(a: string, b: string): boolean {
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');
    if (bufferA.length !== bufferB.length) return false;
    return timingSafeEqual(bufferA, bufferB);
  }
}
