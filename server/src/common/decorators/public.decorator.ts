import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from 'src/config/constants';

/**
 * Opts a route out of the globally-applied JwtAuthGuard.
 *
 * Authentication is default-on: the guard is registered as an APP_GUARD, so a
 * new controller is protected the moment it is written. Exposing a route is an
 * explicit, greppable act — which is the right way round. Search for
 * `@Public()` to audit the entire unauthenticated surface of the API.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
