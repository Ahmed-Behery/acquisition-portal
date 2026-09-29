import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { User } from '../entities/user.entity';
import type { UserGroup } from '../enums/user-group.enum';
import type { UserRole } from '../enums/user-role.enum';

/**
 * Outbound shape for a user.
 *
 * Built by explicit assignment, never by spreading the entity. `passwordHash`
 * is already `select: false`, but relying on a single mechanism for a secret
 * is how secrets escape — a future `findOne({ select: [...] })` that asks for
 * it would otherwise flow straight to the client. Two independent barriers.
 *
 * Also absent: `failedLoginCount`, `lockedUntil`, `deletedAt`. They are
 * operational state, not part of the client contract, and the first two tell
 * an attacker how close they are to triggering a lockout.
 */
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id: string;

  @ApiProperty({ example: 'y.fahmy' })
  readonly username: string;

  @ApiProperty({ example: 'y.fahmy@contact.eg' })
  readonly email: string;

  @ApiProperty({ example: 'Youssef Fahmy' })
  readonly name: string;

  @ApiProperty({ enum: ['Admin', 'CEO', 'MD', 'Head of Products', 'RM', 'Employee'] })
  readonly role: UserRole;

  @ApiPropertyOptional({ nullable: true, enum: ['MD', 'C-Level', 'Branch Manager'] })
  readonly group: UserGroup | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  readonly companyId: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'FACT' })
  readonly companyCode?: string | null;

  @ApiProperty({ nullable: true })
  readonly jobTitle: string | null;

  @ApiProperty({ nullable: true })
  readonly phone: string | null;

  @ApiProperty()
  readonly isActive: boolean;

  @ApiProperty({ description: 'The account cannot be used until the password is changed.' })
  readonly mustChangePassword: boolean;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  readonly lastLoginAt: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  readonly createdAt: Date;

  @ApiProperty({ description: 'Pass back as `version` on update to detect concurrent edits.' })
  readonly version: number;

  private constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.name = user.name;
    this.role = user.role;
    this.group = user.group;
    this.companyId = user.companyId;
    this.companyCode = user.company?.code ?? null;
    this.jobTitle = user.jobTitle;
    this.phone = user.phone;
    this.isActive = user.isActive;
    this.mustChangePassword = user.mustChangePassword;
    this.lastLoginAt = user.lastLoginAt;
    this.createdAt = user.createdAt;
    this.version = user.version;
  }

  static from(user: User): UserResponseDto {
    return new UserResponseDto(user);
  }

  static fromMany(users: User[]): UserResponseDto[] {
    return users.map((user) => UserResponseDto.from(user));
  }
}

/**
 * Returned exactly once, from POST /users.
 *
 * The generated password is never persisted in readable form and cannot be
 * retrieved again — if it is lost, the administrator issues a reset. That is
 * the point: a credential an administrator can look up later is a credential
 * that outlives its purpose.
 */
export class CreatedUserResponseDto {
  @ApiProperty({ type: UserResponseDto })
  readonly user: UserResponseDto;

  @ApiProperty({
    description:
      'Single-use password. Shown only in this response — deliver it to the user ' +
      'over a separate channel. They must change it at first sign-in.',
  })
  readonly temporaryPassword: string;

  constructor(user: User, temporaryPassword: string) {
    this.user = UserResponseDto.from(user);
    this.temporaryPassword = temporaryPassword;
  }
}
