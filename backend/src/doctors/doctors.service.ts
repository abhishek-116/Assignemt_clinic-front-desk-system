 import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const doctor = this.doctorsRepository.create(createDoctorDto);
    return this.doctorsRepository.save(doctor);
  }

  async findAll(filters?: { specialization?: string; location?: string; search?: string }) {
    const query = this.doctorsRepository.createQueryBuilder('doctor');

    if (filters?.specialization) {
      query.andWhere('doctor.specialization = :specialization', { 
        specialization: filters.specialization 
      });
    }

    if (filters?.location) {
      query.andWhere('doctor.location = :location', { 
        location: filters.location 
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(doctor.name LIKE :search OR doctor.specialization LIKE :search)', 
        { search: `%${filters.search}%` }
      );
    }

    query.andWhere('doctor.isActive = :isActive', { isActive: true });

    return query.getMany();
  }

  async findOne(id: number): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findOne({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  async update(id: number, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    await this.doctorsRepository.update(id, updateDoctorDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.doctorsRepository.update(id, { isActive: false });
  }

  async getAvailability(doctorId: number, date: string) {
    const doctor = await this.findOne(doctorId);
    
    // Default availability if not set
    const defaultAvailability = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];

    const availability = doctor.availability 
      ? JSON.parse(doctor.availability) 
      : defaultAvailability;

    return {
      doctorId,
      date,
      availableSlots: availability,
    };
  }
}