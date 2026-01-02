import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Check if role name already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new BadRequestException('Role name already exists');
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name.trim(),
    });
    
    const savedRole = await this.roleRepository.save(role);

    // Assign permissions if provided
    if (createRoleDto.permission_ids && createRoleDto.permission_ids.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(createRoleDto.permission_ids) },
      });
      savedRole.permissions = permissions;
      await this.roleRepository.save(savedRole);
    }
    
    return this.findOne(savedRole.id);
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    console.log('RolesService.update - Called with:', { id, updateRoleDto });
    const role = await this.findOne(id);

    // Prevent update of admin role (id: 1)
    if (role.id === 1) {
      throw new BadRequestException('Cannot update the admin role');
    }

    // Check if name is being changed and already exists
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new BadRequestException('Role name already exists');
      }
    }

    if (updateRoleDto.name !== undefined) {
      role.name = updateRoleDto.name.trim();
    }

    // Update permissions if provided
    if (updateRoleDto.permission_ids !== undefined) {
      if (updateRoleDto.permission_ids.length === 0) {
        role.permissions = [];
      } else {
        const permissions = await this.permissionRepository.find({
          where: { id: In(updateRoleDto.permission_ids) },
        });
        role.permissions = permissions;
      }
    }

    await this.roleRepository.save(role);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    
    // Prevent deletion of admin role (id: 1)
    if (role.id === 1) {
      throw new BadRequestException('Cannot delete the admin role');
    }

    await this.roleRepository.remove(role);
  }
}


