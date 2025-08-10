import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Create default admin user if not exists
  async onModuleInit() {
    const adminEmail = 'admin@clinic.com';
    const adminExists = await this.findByEmail(adminEmail);
    if (!adminExists) {
      await this.create({
        email: adminEmail,
        password: 'admin123',
        name: 'Admin User',
        role: UserRole.ADMIN,
      });
      console.log('Default admin user created: admin@clinic.com / admin123');
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // if role not provided, ensure default
    // const roleToUse = createUserDto.role ?? UserRole.USER;
    const roleToUse = createUserDto.role ?? UserRole.FRONT_DESK;


    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: roleToUse,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });
  }

  // returns User | null so callers know it may not exist
  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    // include password because some auth flows need it - adjust select as needed
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: number, updateUserDto: Partial<CreateUserDto>): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.usersRepository.update(id, updateUserDto);

    const updated = await this.findOne(id);
    if (!updated) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
