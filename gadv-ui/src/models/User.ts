export interface Role {
  id: number;
  name: string;
}

export class User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role; 
  phone?: string;
  address?: string;
  city?: string;
  
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;


  constructor(data: Partial<User> = {}) {
    this.id = data.id || 0;
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.email = data.email || '';
    this.password = data.password || '';
    
    // Fix: Properly handle role property - it should be an object with id and name
    if (data.role && typeof data.role === 'object' && 'id' in data.role) {
      this.role = data.role as Role;
    } else if (data.role && typeof data.role === 'number') {
      this.role = { id: data.role, name: '' };
    } else {
      this.role = { id: 0, name: '' };
    }
    
    this.phone = data.phone;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Helper method to get user ID as number for API calls
  get numericId(): number {
    return this.id;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get initials(): string {
    return `${this.firstName[0]}${this.lastName[0]}`.toUpperCase();
  }
} 