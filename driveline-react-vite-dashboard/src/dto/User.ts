
export interface GetAllUsersResponse {
  users: User[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'tech' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface GetUserByIdResponse {
  user: FullUser;
}

export interface FullUser {
  id: string;
  name: string;
  phone: string;
  role: 'tech' | 'user';
  email: string;
  age?: number;
  address?: string;
  image?: string;
  stripeId?: string;
  location?: Location;
  createdAt?: string;
  updatedAt?: string;
  password?: string; // Only used when creating user
}

export interface Location {
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  building?: string;
  floor?: string;
  unit?: string;
  postal_code?: string;
}