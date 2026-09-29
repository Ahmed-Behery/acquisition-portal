import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordModule } from 'src/modules/password/password.module';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthController } from './controllers/auth.controller';
import { LoginAttempt } from './entities/login-attempt.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginAttemptRepository } from './repositories/login-attempt.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Authentication and session management.
 *
 * `JwtModule.register({})` is deliberately empty: access and refresh tokens
 * are signed with *different* secrets, so each secret is passed per-call in
 * TokenService rather than configured once here. A module-level default would
 * be the thing that quietly gets used for both.
 *
 * Exports TokenService because UsersModule will need to revoke sessions when
 * an account is deactivated. AuthService is not exported — nothing outside
 * this module should be performing authentication.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, LoginAttempt]),
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.register({}),
    UsersModule,
    PasswordModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    RefreshTokenRepository,
    LoginAttemptRepository,
  ],
  exports: [TokenService],
})
export class AuthModule {}
