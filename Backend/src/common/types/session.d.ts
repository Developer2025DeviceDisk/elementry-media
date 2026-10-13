import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    sessionVersion?: number;
    authenticatedAt?: number;
    csrfToken?: string;
  }
}
