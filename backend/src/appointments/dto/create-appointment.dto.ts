 
import { IsString, IsDateString, IsNumber, IsOptional, IsEmail } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  patientName: string;

  @IsString()
  patientPhone: string;

  @IsOptional()
  @IsEmail()
  patientEmail?: string;

  @IsDateString()
  appointmentDate: Date;

  @IsString()
  appointmentTime: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber()
  doctorId: number;
}