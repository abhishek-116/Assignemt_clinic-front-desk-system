// backend/src/queue/dto/update-queue.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { QueueStatus } from '../entities/queue.entity';

export class UpdateQueueDto {
  @IsOptional()
  @IsString()
  patientName?: string;

  @IsOptional()
  @IsString()
  patientPhone?: string;

  @IsOptional()
  @IsNumber()
  doctorId?: number;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isPriority?: boolean;

  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;
}