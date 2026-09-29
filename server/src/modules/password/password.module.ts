import { Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';

/**
 * Hashing as its own module.
 *
 * Both AuthModule (sign-in, change password) and UsersModule (generating the
 * credential for a new account) need it. Putting it in either one would make
 * the other import it and produce the circular dependency that architecture
 * rule 9 forbids — AuthModule already imports UsersModule. A small shared
 * module is the honest answer, and it keeps the hashing parameters in exactly
 * one place.
 */
@Module({
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
