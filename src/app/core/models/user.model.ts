export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
