import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from '../../entities/project.entity';
import { User } from '../../entities/user.entity';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      createdById: userId,
    });

    return this.projectRepository.save(project);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: string,
    userRole?: string,
  ): Promise<{
    projects: Project[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.createdBy', 'createdBy')
      .leftJoinAndSelect('project.assets', 'assets')
      .leftJoinAndSelect('project.reports', 'reports');

    // Filter by user if not admin
    if (userRole !== 'admin' && userId) {
      queryBuilder.where('project.createdById = :userId', { userId });
    }

    const [projects, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('project.createdAt', 'DESC')
      .getManyAndCount();

    return {
      projects,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<Project> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.createdBy', 'createdBy')
      .leftJoinAndSelect('project.assets', 'assets')
      .leftJoinAndSelect('project.reports', 'reports')
      .where('project.id = :id', { id });

    // Check permissions
    if (userRole !== 'admin' && userId) {
      queryBuilder.andWhere('project.createdById = :userId', { userId });
    }

    const project = await queryBuilder.getOne();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
    userRole?: string,
  ): Promise<Project> {
    const project = await this.findOne(id, userId, userRole);

    // Check if user can update this project
    if (userRole !== 'admin' && project.createdById !== userId) {
      throw new ForbiddenException('You can only update your own projects');
    }

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string, userId: string, userRole?: string): Promise<void> {
    const project = await this.findOne(id, userId, userRole);

    // Check if user can delete this project
    if (userRole !== 'admin' && project.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own projects');
    }

    await this.projectRepository.remove(project);
  }

  async getDashboardStats(userId?: string, userRole?: string): Promise<{
    totalProjects: number;
    pendingProjects: number;
    inProgressProjects: number;
    completedProjects: number;
    cancelledProjects: number;
  }> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project');

    // Filter by user if not admin
    if (userRole !== 'admin' && userId) {
      queryBuilder.where('project.createdById = :userId', { userId });
    }

    const [
      totalProjects,
      pendingProjects,
      inProgressProjects,
      completedProjects,
      cancelledProjects,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('project.status = :status', { status: ProjectStatus.PENDING }).getCount(),
      queryBuilder.clone().andWhere('project.status = :status', { status: ProjectStatus.IN_PROGRESS }).getCount(),
      queryBuilder.clone().andWhere('project.status = :status', { status: ProjectStatus.COMPLETED }).getCount(),
      queryBuilder.clone().andWhere('project.status = :status', { status: ProjectStatus.CANCELLED }).getCount(),
    ]);

    return {
      totalProjects,
      pendingProjects,
      inProgressProjects,
      completedProjects,
      cancelledProjects,
    };
  }

  async updateStatus(
    id: string,
    status: ProjectStatus,
    userId: string,
    userRole?: string,
  ): Promise<Project> {
    const project = await this.findOne(id, userId, userRole);

    // Check if user can update this project
    if (userRole !== 'admin' && project.createdById !== userId) {
      throw new ForbiddenException('You can only update your own projects');
    }

    project.status = status;
    return this.projectRepository.save(project);
  }
}
