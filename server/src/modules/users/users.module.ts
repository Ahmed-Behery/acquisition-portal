import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from 'src/modules/companies/companies.module';
import { PasswordModule } from 'src/modules/password/password.module';
import { User } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';

/**
 * Owns the users table.
 *
 * Exports UsersService only. AuthModule imports this module and consumes the
 * cross-module methods on the service; it never sees UsersRepository, so the
 * role and company invariants cannot be routed around.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), CompaniesModule, PasswordModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
