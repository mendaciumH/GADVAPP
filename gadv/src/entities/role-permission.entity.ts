import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ type: 'bigint' })
  role_id: number;

  @PrimaryColumn({ type: 'bigint' })
  permission_id: number;

  @ManyToOne(() => Role, role => role.permissions)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, permission => permission.roles)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}

