import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // Check if permission name already exists
    const existingPermission = await this.permissionRepository.findOne({
      where: { name: createPermissionDto.name },
    });

    if (existingPermission) {
      throw new BadRequestException('Permission name already exists');
    }

    const permission = this.permissionRepository.create({
      name: createPermissionDto.name.trim(),
    });
    
    return this.permissionRepository.save(permission);
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);

    // Check if name is being changed and already exists
    if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { name: updatePermissionDto.name },
      });

      if (existingPermission) {
        throw new BadRequestException('Permission name already exists');
      }
    }

    if (updatePermissionDto.name !== undefined) {
      permission.name = updatePermissionDto.name.trim();
    }

    return this.permissionRepository.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }

  /**
   * Sync permissions from a list of permission names
   * Creates permissions that don't exist, keeps existing ones
   */
  async syncPermissions(permissionNames: string[]): Promise<Permission[]> {
    const existingPermissions = await this.permissionRepository.find();
    const existingNames = new Set(existingPermissions.map(p => p.name));

    const permissionsToCreate = permissionNames.filter(name => !existingNames.has(name));
    
    if (permissionsToCreate.length > 0) {
      const newPermissions = permissionsToCreate.map(name =>
        this.permissionRepository.create({ name: name.trim() })
      );
      await this.permissionRepository.save(newPermissions);
    }

    // Return all permissions (existing + newly created)
    return this.findAll();
  }

  /**
   * Get all unique permission names from PAGE_PERMISSIONS
   * This should be called from the frontend to sync permissions
   */
  async syncFromPagePermissions(permissionNames: string[]): Promise<Permission[]> {
    return this.syncPermissions(permissionNames);
  }
}

