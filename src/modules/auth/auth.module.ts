import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getJWTSettings } from '../../config/auth';
import { UserModule } from '../user/user.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './controller/auth.controller';
import { IAuthService, IGenericStrategy } from '../../common/interfaces/auth-interfaces';
import { LocaStrategy } from './strategies/local.strategy';
import { IJwtService } from '../../common/interfaces/auth-interfaces/jwt-service.interface';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserMapper } from '../user/mappers';

const authService = {
  provide: IAuthService,
  useClass: AuthService,
};

const jwtService = {
  provide: IJwtService,
  useClass: JwtService,
};

const jwtStategy = {
  provide: IGenericStrategy,
  useClass: JwtStrategy,
};

@Global()
@Module({
  imports: [
    PassportModule.register({ session: true, defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getJWTSettings(configService),
    }),
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [authService, jwtService, LocaStrategy, jwtStategy, ConfigService, UserMapper],
  exports: [authService],
})
export class AuthModule {}

