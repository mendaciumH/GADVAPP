import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['role'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if username already exists
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    // Check if email already exists (if provided)
    if (createUserDto.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.motdepasse, 12);

    // Verify role exists if provided
    if (createUserDto.role_id) {
      const role = await this.roleRepository.findOne({
        where: { id: createUserDto.role_id },
      });

      if (!role) {
        throw new BadRequestException(`Role with ID ${createUserDto.role_id} not found`);
      }
    }

    // Create user
    const user = this.userRepository.create({
      username: createUserDto.username.trim(),
      email: createUserDto.email?.trim() || undefined,
      motdepasse: hashedPassword,
      role_id: createUserDto.role_id || undefined,
    });

    const savedUser = await this.userRepository.save(user);

    // Return user with role relation
    return this.findOne(savedUser.id);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findOne(id);

    // Check if username is being changed and already exists
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }
    }

    // Check if email is being changed and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (updateUserDto.motdepasse) {
      hashedPassword = await bcrypt.hash(updateUserDto.motdepasse, 12);
    }

    // Verify role exists if provided
    if (updateUserDto.role_id !== undefined) {
      if (updateUserDto.role_id !== null) {
        const role = await this.roleRepository.findOne({
          where: { id: updateUserDto.role_id },
        });

        if (!role) {
          throw new BadRequestException(`Role with ID ${updateUserDto.role_id} not found`);
        }
      }
    }

    // Update user
    if (updateUserDto.username !== undefined) {
      user.username = updateUserDto.username.trim();
    }
    if (updateUserDto.email !== undefined) {
      (user as any).email = updateUserDto.email?.trim() || undefined;
    }
    if (hashedPassword) {
      user.motdepasse = hashedPassword;
    }
    if (updateUserDto.role_id !== undefined) {
      (user as any).role_id = updateUserDto.role_id || undefined;
    }

    const updatedUser = await this.userRepository.save(user);

    // Return user with role relation
    return this.findOne(updatedUser.id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);

    // Prevent deletion of admin user (id: 1)
    if (user.id === 1) {
      throw new BadRequestException('Cannot delete the admin user');
    }

    await this.userRepository.remove(user);
  }
}


