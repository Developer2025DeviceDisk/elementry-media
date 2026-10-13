import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from '../../infrastructure/mongodb/models';

export const PUBLIC_ROUTE = 'publicRoute';
export const ROUTE_ROLES = 'routeRoles';
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
export const Roles = (...roles: Role[]) => SetMetadata(ROUTE_ROLES, roles);
export interface AuthenticatedUser { id: string; email: string; name: string; role: Role }
export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthenticatedUser => context.switchToHttp().getRequest().user);
