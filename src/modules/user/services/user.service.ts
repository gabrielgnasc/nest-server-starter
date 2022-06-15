import { BadRequestException, Inject, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { CreateUserDTO } from '../../../common/dtos/user/create-user.dto';
import { UpdatePasswordDTO } from '../../../common/dtos/user/update-password.dto';
import { UpdateUserDTO } from '../../../common/dtos/user/update-user.dto';
import { UserDTO } from '../../../common/dtos/user/user.dto';
import { IEmailService } from '../../email/interfaces/email-service.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { CreateUserMapper } from '../mappers/create-user.mapper';
import { UpdatePasswordMapper } from '../mappers/update-password.mapper';
import { UpdateUserMapper } from '../mappers/update-user.mapper';

import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserService {
  @Inject(UserMapper)
  private readonly userMapper: UserMapper;

  @Inject(CreateUserMapper)
  private readonly createUserMapper: CreateUserMapper;

  @Inject(UpdateUserMapper)
  private readonly updateUserMapper: UpdateUserMapper;

  @Inject(UpdatePasswordMapper)
  private readonly updatePasswordMapper: UpdatePasswordMapper;

  @Inject(IUserRepository)
  private readonly userRepository: IUserRepository;

  @Inject(IEmailService)
  private readonly emailService: IEmailService;

  constructor() {}

  async create(data: CreateUserDTO): Promise<UserDTO> {
    let user = await this.userRepository.findBy({ email: data.email, login: data.login, method: 'OR' });

    if (user?.email === data.email) throw new NotAcceptableException('this email is already used!');
    if (user?.login === data.login) throw new NotAcceptableException('this login is already used!');

    user = await this.userRepository.create(this.createUserMapper.toEntity(data));
    return this.userMapper.fromEntity(user);
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserDTO> {
    const users = await this.userRepository.findAll({ email: data.email, id: id, method: 'OR' });

    if (users.length > 1) throw new NotAcceptableException('email already exists!');

    const user = await this.userRepository.update(id, this.updateUserMapper.toEntity(data));
    return this.userMapper.fromEntity(user);
  }

  async findById(id: string): Promise<UserDTO> {
    const user = await this.userRepository.find(id);

    if (!user) throw new NotFoundException('User dont exists');

    return this.userMapper.fromEntity(user);
  }

  async updatePassword(id: string, data: UpdatePasswordDTO): Promise<void> {
    let user = await this.userRepository.find(id);

    if (!user) throw new NotFoundException('User dont exists');
    if (!user.newPasswordIsValid(data.newPassword)) throw new NotAcceptableException('New password is not valid');

    user = await this.userRepository.update(id, this.updatePasswordMapper.toEntity(data));
  }

  async recoverPassword(email: string): Promise<string> {
    let user = await this.userRepository.findBy({ email });
    if (!user) throw new NotFoundException('Unregistered Email');
    await this.emailService.sendRecoverPasswordEmail(user.id);
    return 'Email successfully sent!';
  }
}