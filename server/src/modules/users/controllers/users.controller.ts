import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { QueryUsersDto } from '../dtos/query-users.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { CreatedUserResponseDto, UserResponseDto } from '../dtos/user-response.dto';
import { UserRole } from '../enums/user-role.enum';

/**
 * User administration.
 *
 * **Authorization** (enforced by RolesGuard; the controller-level `@Roles`
 * applies to every route unless a handler overrides it):
 *
 * | Route                       | Roles                        |
 * |-----------------------------|------------------------------|
 * | `GET    /users`             | Admin                        |
 * | `GET    /users/directory`   | any authenticated user       |
 * | `GET    /users/:id`         | Admin                        |
 * | `POST   /users`             | Admin                        |
 * | `PATCH  /users/:id`         | Admin                        |
 * | `PATCH  /users/:id/activate`| Admin                        |
 * | `DELETE /users/:id`         | Admin                        |
 *
 * Controllers here do three things and nothing else: unwrap the request, call
 * a service, map the result to a DTO. No repository access (rule 6), no
 * business rules (rule 1).
 */
@ApiTags('users')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: "The caller's role does not permit this action." })
@Roles(UserRole.ADMIN)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List user accounts',
    description: 'Paginated, filterable. Administrator only — returns full account detail.',
  })
  @ApiOkResponse({ type: PaginatedResponseDto<UserResponseDto> })
  async findAll(@Query() query: QueryUsersDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const [users, total] = await this.usersService.findPaginated(query);
    return new PaginatedResponseDto(
      UserResponseDto.fromMany(users),
      total,
      query.page,
      query.limit,
    );
  }

  /**
   * Reduced projection for pickers — assigning a prospect to a Relationship
   * Manager, choosing meeting attendees, delegating a lead.
   *
   * Overrides the controller-level `@Roles(ADMIN)` with "any authenticated
   * user", so the wider audience is a visible, deliberate exception rather
   * than an accident. The projection is narrow on purpose: name, role and
   * company are what a picker needs; phone numbers, sign-in history and
   * account state are not, and shipping them to all six roles is how the
   * legacy application ended up broadcasting its whole user table.
   */
  @Get('directory')
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.MD,
    UserRole.HEAD_OF_PRODUCTS,
    UserRole.RM,
    UserRole.EMPLOYEE,
  )
  @ApiOperation({
    summary: 'List selectable colleagues',
    description: 'Reduced projection for assignment and attendee pickers. Any authenticated user.',
  })
  @ApiOkResponse({ type: PaginatedResponseDto<UserResponseDto> })
  async findDirectory(
    @Query() query: QueryUsersDto,
  ): Promise<PaginatedResponseDto<Pick<UserResponseDto, 'id' | 'name' | 'role' | 'companyId'>>> {
    // Mutated rather than spread: PaginationQueryDto exposes `skip` as a
    // getter, and spreading a class instance into an object literal drops it.
    query.isActive = true;
    const [users, total] = await this.usersService.findPaginated(query);

    const entries = users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    }));

    return new PaginatedResponseDto(entries, total, query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one user account' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'No user with that id.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.usersService.findById(id));
  }

  @Post()
  @ApiOperation({
    summary: 'Create a user account',
    description:
      'Generates a single-use password, returned once in this response and never ' +
      'retrievable again. The account must change it at first sign-in.',
  })
  @ApiCreatedResponse({ type: CreatedUserResponseDto })
  @ApiConflictResponse({ description: 'Username or email already in use.' })
  async create(@Body() dto: CreateUserDto): Promise<CreatedUserResponseDto> {
    const { user, temporaryPassword } = await this.usersService.create(dto);
    return new CreatedUserResponseDto(user, temporaryPassword);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user account',
    description:
      'Username is immutable. Supply `version` to have a concurrent edit rejected ' +
      'with 409 rather than silently overwritten.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.usersService.update(id, dto));
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate or deactivate an account',
    description:
      'Deactivation is the normal way to end access: the account keeps its history ' +
      'and its records stay resolvable. You cannot deactivate yourself, nor the last ' +
      'remaining administrator.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser('id') actingUserId: string,
  ): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.usersService.setActive(id, isActive, actingUserId));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a user account',
    description:
      'Prefer deactivation. Soft delete hides the account while leaving its rows ' +
      'intact for audit; it is not a hard delete and does not free the username.',
  })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actingUserId: string,
  ): Promise<void> {
    await this.usersService.softDelete(id, actingUserId);
  }
}
