import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Role } from '../../infrastructure/mongodb/models';
import { MongoDbService } from '../../infrastructure/mongodb/mongodb.service';
import { Environment } from '../../config/environment';
import { AuthenticatedUser, PUBLIC_ROUTE, ROUTE_ROLES } from './access';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly mongo: MongoDbService, private readonly config: ConfigService<Environment, true>) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    const { userId, authenticatedAt } = request.session;
    if (!userId || !authenticatedAt || Date.now() - authenticatedAt >= this.config.get('SESSION_ABSOLUTE_TTL_SECONDS', { infer: true }) * 1000) {
      throw new UnauthorizedException('Authentication required');
    }
    const user = await this.mongo.users.findOne({ _id: userId }, { projection: { passwordHash: 0 } });
    if (!user || user.disabledAt || (request.session.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) throw new UnauthorizedException('Authentication required');
    request.user = { id: user._id, email: user.email, name: user.name, role: user.role };
    const roles = this.reflector.getAllAndOverride<Role[]>(ROUTE_ROLES, [context.getHandler(), context.getClass()]);
    if (roles && !roles.includes(user.role)) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
