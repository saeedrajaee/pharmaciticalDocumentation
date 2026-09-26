import { Role } from '@prisma/client';

export interface TokenPayload {
  sub: number;   // ✅ شناسه کاربر
  role: Role;
}
