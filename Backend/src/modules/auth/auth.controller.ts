import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { Request, Response } from 'express';
import { Environment } from '../../config/environment';
import { AuthenticatedUser, CurrentUser, Public } from '../../common/security/access';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService<Environment, true>) {}

  @Public()
  @Get('csrf')
  async csrf(@Req() request: Request) {
    request.session.csrfToken ??= randomBytes(32).toString('hex');
    await new Promise<void>((resolve, reject) => request.session.save((error) => error ? reject(error) : resolve()));
    return { csrfToken: request.session.csrfToken };
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() request: Request) {
    const { sessionVersion, ...user } = await this.auth.register(dto);
    return { user, csrfToken: await this.createSession(request, user.id, sessionVersion) };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    const { sessionVersion, ...user } = await this.auth.login(dto);
    return { user, csrfToken: await this.createSession(request, user.id, sessionVersion) };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) { return { user }; }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await new Promise<void>((resolve, reject) => request.session.destroy((error) => error ? reject(error) : resolve()));
    const production = this.config.get('NODE_ENV') === 'production';
    response.clearCookie(production ? '__Host-sid' : 'sid', { path: '/', httpOnly: true, secure: production, sameSite: this.config.get('COOKIE_SAME_SITE', { infer: true }) });
  }

  private async createSession(request: Request, userId: string, sessionVersion: number) {
    await new Promise<void>((resolve, reject) => request.session.regenerate((error) => error ? reject(error) : resolve()));
    request.session.userId = userId;
    request.session.sessionVersion = sessionVersion;
    request.session.authenticatedAt = Date.now();
    request.session.csrfToken = randomBytes(32).toString('hex');
    await new Promise<void>((resolve, reject) => request.session.save((error) => error ? reject(error) : resolve()));
    return request.session.csrfToken;
  }
}
