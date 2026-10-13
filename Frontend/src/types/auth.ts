export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}
export interface Credentials {
  email: string;
  password: string;
}
export interface Registration extends Credentials {
  name: string;
}
export interface AuthResponse {
  user: User;
  csrfToken: string;
}
export interface SessionResponse {
  user: User;
}
