import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Role } from '../../infrastructure/mongodb/models';
import { Environment } from '../../config/environment';
import { MongoDbService } from '../../infrastructure/mongodb/mongodb.service';
import { SessionGuard } from './session.guard';

describe('SessionGuard', () => {
  const findOne = jest.fn();
  const getAllAndOverride = jest.fn();
  const guard = new SessionGuard(
    { getAllAndOverride } as unknown as Reflector,
    { users: { findOne } } as unknown as MongoDbService,
    new ConfigService({ SESSION_ABSOLUTE_TTL_SECONDS: 600 }) as ConfigService<Environment, true>,
  );
  const req = { session: { userId: 'user-id', authenticatedAt: Date.now() } };
  const context = { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
  beforeEach(() => {
    req.session.authenticatedAt = Date.now();
    getAllAndOverride.mockReset();
    findOne.mockReset();
  });
  it('rejects sessions beyond absolute expiry without a database read', async () => {
    req.session.authenticatedAt = Date.now() - 601000;
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(findOne).not.toHaveBeenCalled();
  });
  it('rejects disabled users immediately', async () => {
    findOne.mockResolvedValue({ _id: 'user-id', disabledAt: new Date() });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
  it('checks the current database role', async () => {
    getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce([Role.ADMIN]);
    findOne.mockResolvedValue({ _id: 'user-id', role: Role.CUSTOMER, disabledAt: null });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
