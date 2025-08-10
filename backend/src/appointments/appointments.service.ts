 import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    // Check if doctor exists
    const doctor = await this.doctorsRepository.findOne({
      where: { id: createAppointmentDto.doctorId }
    });
    
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check for conflicts
    const existingAppointment = await this.appointmentsRepository.findOne({
      where: {
        doctorId: createAppointmentDto.doctorId,
        appointmentDate: createAppointmentDto.appointmentDate,
        appointmentTime: createAppointmentDto.appointmentTime,
        status: AppointmentStatus.BOOKED,
      }
    });

    if (existingAppointment) {
      throw new ConflictException('Time slot already booked');
    }

    const appointment = this.appointmentsRepository.create(createAppointmentDto);
    return this.appointmentsRepository.save(appointment);
  }

  async findAll(filters?: { date?: string; doctorId?: number; status?: AppointmentStatus }) {
    const query = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor');

    if (filters?.date) {
      const startDate = new Date(filters.date);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
      
      query.andWhere('appointment.appointmentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (filters?.doctorId) {
      query.andWhere('appointment.doctorId = :doctorId', { doctorId: filters.doctorId });
    }

    if (filters?.status) {
      query.andWhere('appointment.status = :status', { status: filters.status });
    }

    return query.orderBy('appointment.appointmentDate', 'ASC')
                .addOrderBy('appointment.appointmentTime', 'ASC')
                .getMany();
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['doctor'],
    });
    
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    
    return appointment;
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    
    // If rescheduling, check for conflicts
    if (updateAppointmentDto.appointmentDate || updateAppointmentDto.appointmentTime) {
      const conflictingAppointment = await this.appointmentsRepository.findOne({
        where: {
          doctorId: appointment.doctorId,
          appointmentDate: updateAppointmentDto.appointmentDate || appointment.appointmentDate,
          appointmentTime: updateAppointmentDto.appointmentTime || appointment.appointmentTime,
          status: AppointmentStatus.BOOKED,
        }
      });

      if (conflictingAppointment && conflictingAppointment.id !== id) {
        throw new ConflictException('Time slot already booked');
      }
    }

    await this.appointmentsRepository.update(id, updateAppointmentDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentsRepository.update(id, { status: AppointmentStatus.CANCELLED });
  }

  async getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.appointmentsRepository.find({
      where: {
        appointmentDate: Between(startOfDay, endOfDay),
      },
      relations: ['doctor'],
      order: {
        appointmentTime: 'ASC',
      },
    });
  }
}