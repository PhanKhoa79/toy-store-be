import type { UserRole } from './enums';

export type ID = string;
export type ISODateString = string;
export type VndAmount = number;

export type Permission = {
  id: ID;
  module: string;
  action: string;
  description?: string | null;
};

export type CurrentUser = {
  id: ID;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Exclude<UserRole, 'guest'>;
  isActive: boolean;
  permissions: Permission[];
};

export type SortDirection = 'asc' | 'desc';
