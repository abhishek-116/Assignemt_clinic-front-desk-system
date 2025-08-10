
import { IsString, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { Gender } from '../entities/doctor.entity';

export class CreateDoctorDto {
  @IsString()
  name: string;

  @IsString()
  specialization: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}