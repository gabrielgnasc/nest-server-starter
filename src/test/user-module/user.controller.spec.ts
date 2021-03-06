import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../modules/user/controller/user.controller';
import { NotAcceptableException, NotFoundException } from '@nestjs/common';
import { UpdateUserDTO } from '../../common/dtos/user/update-user.dto';
import { CreateUserDTO } from '../../common/dtos/user/create-user.dto';
import { UpdatePasswordDTO } from '../../common/dtos/user/update-password.dto';
import { IUserService } from '../../common/interfaces/user-interfaces/user-service.interface';
import { UserMapper } from '../../modules/user/mappers';
import { RequestDTO } from '../../common/dtos/auth';
import { ErrorMessageHelper } from '../../common/helpers';

describe('UserController', () => {
  let userController: UserController;
  let userService: IUserService;

  const request = new RequestDTO();
  request.user = { id: 'any_id', login: 'any_login' };

  const mockUserService = {
    create: jest.fn((dto) => ({
      id: Date.now().toString(),
      name: dto.name,
      email: dto.email,
      login: dto.login,
    })),
    update: jest.fn((id, dto) => ({
      id,
      ...dto,
      login: 'any_login',
    })),
    updatePassword: jest.fn((id, dto) => {
      return null;
    }),
    recoverPassword: jest.fn((email) => ''),
    findById: jest.fn((id) => ({
      id: Date.now().toString(),
      name: 'any_name',
      login: 'any_login',
      email: 'any_email@mail.com',
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: IUserService,
          useValue: mockUserService,
        },
        UserMapper,
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<IUserService>(IUserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('find user', () => {
    it('should throw an exception', () => {
      jest.spyOn(userService, 'findById').mockImplementationOnce(() => {
        throw new Error();
      });
      expect(userController.findById(request, 'any_id')).rejects.toThrowError();
    });

    it('should status 404 when id dont exists', async () => {
      jest.spyOn(userService, 'findById').mockImplementationOnce(() => {
        throw new NotFoundException(ErrorMessageHelper.USER_DONT_EXISTS);
      });

      try {
        await userController.findById(request, 'any_id');
      } catch (error) {
        expect(error.status).toBe(404);
      }
    });

    it('should status 403 when id dont match with user', async () => {
      const _request = new RequestDTO();
      _request.user = { id: 'any', login: 'any_login' };
      try {
        await userController.findById(_request, 'any_id');
      } catch (error) {
        expect(error.status).toBe(403);
      }
    });

    it('should status 403 when dont have id', async () => {
      const _request = { user: null };
      try {
        await userController.findById(_request, 'any_id');
      } catch (error) {
        expect(error.status).toBe(403);
      }
    });

    it('should return user if find successfully', async () => {
      const result = await userController.findById(request, 'any_id');

      expect(result).toEqual({
        id: expect.any(String),
        name: 'any_name',
        login: 'any_login',
        email: 'any_email@mail.com',
      });

      expect(mockUserService.findById).toHaveBeenCalledWith('any_id');
    });
  });

  describe('create user', () => {
    const userCreate = new CreateUserDTO();
    userCreate.name = 'any_name';
    userCreate.login = 'any_login';
    userCreate.email = 'any_email@mail.com';
    userCreate.password = 'any_password';

    it('should throw an exception', () => {
      jest.spyOn(userService, 'create').mockImplementationOnce(() => {
        throw new Error();
      });
      expect(userController.create(userCreate)).rejects.toThrowError();
    });

    it('should status 406 when email already exists', async () => {
      jest.spyOn(userService, 'create').mockImplementationOnce(() => {
        throw new NotAcceptableException(ErrorMessageHelper.EMAIL_ALREADY_USED);
      });

      try {
        await userController.create(userCreate);
      } catch (error) {
        expect(error.status).toBe(406);
      }
    });

    it('should return user if created successfully', async () => {
      const result = await userController.create(userCreate);

      expect(result).toEqual({
        id: expect.any(String),
        name: 'any_name',
        login: 'any_login',
        email: 'any_email@mail.com',
      });

      expect(mockUserService.create).toHaveBeenCalledWith(userCreate);
    });
  });

  describe('update user', () => {
    const userUpdate = new UpdateUserDTO();
    userUpdate.name = 'any_name';
    userUpdate.email = 'any_email@mail.com';

    it('should throw an exception', async () => {
      const spy = jest.spyOn(userService, 'update').mockImplementationOnce(() => {
        throw new Error();
      });

      expect(userController.update(request, 'any_id', userUpdate)).rejects.toThrowError();

      expect(spy).toHaveBeenCalled();
    });

    it('should return status 406 when email updated already in use', async () => {
      const spy = jest.spyOn(userService, 'update').mockImplementationOnce(() => {
        throw new NotAcceptableException(ErrorMessageHelper.EMAIL_ALREADY_USED);
      });

      try {
        await userController.update(request, 'any_id', userUpdate);
      } catch (error) {
        expect(error.status).toBe(406);
      }
      expect(spy).toHaveBeenCalled();
    });

    it('should status 403 when id dont match with user', async () => {
      const _request = new RequestDTO();
      _request.user = { id: 'any', login: 'any_login' };
      try {
        await userController.update(_request, 'any_id', userUpdate);
      } catch (error) {
        expect(error.status).toBe(403);
      }
    });

    it('should status 403 when dont have id', async () => {
      const _request = { user: null };
      try {
        await userController.update(_request, 'any_id', userUpdate);
      } catch (error) {
        expect(error.status).toBe(403);
      }
    });

    it('should return user if updated successfully', async () => {
      const result = await userController.update(request, 'any_id', userUpdate);

      expect(result).toEqual({
        id: 'any_id',
        name: 'any_name',
        login: 'any_login',
        email: 'any_email@mail.com',
      });

      expect(mockUserService.update).toHaveBeenCalledWith('any_id', userUpdate);
    });
  });

  describe('update password', () => {
    const updatePassword = new UpdatePasswordDTO();
    updatePassword.password = 'any_password';
    updatePassword.newPassword = 'new_password';

    it('should throw an exception', async () => {
      const spy = jest.spyOn(userService, 'updatePassword').mockImplementationOnce(() => {
        throw new Error();
      });

      expect(userController.updatePassword(request, 'any_id', updatePassword)).rejects.toThrowError();

      expect(spy).toHaveBeenCalled();
    });

    it('should return 406 if old password dont match', async () => {
      jest.spyOn(userService, 'updatePassword').mockImplementationOnce(() => {
        throw new NotAcceptableException();
      });

      try {
        await userController.updatePassword(request, 'any_id', updatePassword);
      } catch (error) {
        expect(error.status).toBe(406);
      }
    });

    it('should status 403 when id dont match with user', async () => {
      const _request = new RequestDTO();
      _request.user = { id: 'any', login: 'any_login' };
      try {
        await userController.updatePassword(_request, 'any_id', updatePassword);
      } catch (error) {
        expect(error.status).toBe(403);
      }
    });

    it('should status 403 when dont have id', async () => {
      const _request = { user: null };
      try {
        await userController.updatePassword(_request, 'any_id', updatePassword);
      } catch (error) {
        expect(error.status).toBe(403);
      }
    });

    it('should update is succefully', async () => {
      const spy = jest.spyOn(userController, 'updatePassword');
      const updatePassword = new UpdatePasswordDTO();
      updatePassword.password = 'any_password';
      updatePassword.newPassword = '';

      await userController.updatePassword(request, 'any_id', updatePassword);
      expect(spy).toHaveBeenCalledWith(request, 'any_id', updatePassword);
    });
  });

  describe('recover password', () => {
    it('should throw an exception', () => {
      jest.spyOn(userService, 'recoverPassword').mockImplementationOnce(() => {
        throw new Error();
      });
      expect(userController.recoverPassword({ email: 'any_email@mail.com' })).rejects.toThrowError();
    });

    it('should return 406 if email is not registered', async () => {
      jest.spyOn(userService, 'recoverPassword').mockImplementationOnce(() => {
        throw new NotAcceptableException(ErrorMessageHelper.UNREGISTERED_EMAIL);
      });

      try {
        await userController.recoverPassword({ email: 'any_email@mail.com' });
      } catch (error) {
        expect(error.status).toBe(406);
      }
    });

    it('should recover with success', async () => {
      const spy = jest.spyOn(userController, 'recoverPassword');
      await userController.recoverPassword({ email: 'any_email@mail.com' });
      expect(spy).toHaveBeenCalledWith({ email: 'any_email@mail.com' });
      expect(userService.recoverPassword).toBeDefined();
    });
  });
});
