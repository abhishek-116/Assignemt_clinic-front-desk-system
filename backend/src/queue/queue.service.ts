 import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Queue, QueueStatus } from './entities/queue.entity';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(Queue)
    private queueRepository: Repository<Queue>,
  ) {}

  async create(createQueueDto: CreateQueueDto): Promise<Queue> {
    // Get next queue number for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const lastQueue = await this.queueRepository.findOne({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
      order: { queueNumber: 'DESC' },
    });

    const queueNumber = lastQueue ? lastQueue.queueNumber + 1 : 1;

    const queueItem = this.queueRepository.create({
      ...createQueueDto,
      queueNumber,
    });

    return this.queueRepository.save(queueItem);
  }

  async findAll(): Promise<Queue[]> {
    return this.queueRepository.find({
      order: { 
        isPriority: 'DESC',
        queueNumber: 'ASC' 
      },
    });
  }

  async findOne(id: number): Promise<Queue> {
    const queueItem = await this.queueRepository.findOne({ where: { id } });
    if (!queueItem) {
      throw new NotFoundException(`Queue item with ID ${id} not found`);
    }
    return queueItem;
  }

  async update(id: number, updateQueueDto: UpdateQueueDto): Promise<Queue> {
    await this.queueRepository.update(id, updateQueueDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.queueRepository.delete(id);
  }

  async getTodayQueue(): Promise<Queue[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.queueRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
      order: { 
        isPriority: 'DESC',
        queueNumber: 'ASC' 
      },
    });
  }
}