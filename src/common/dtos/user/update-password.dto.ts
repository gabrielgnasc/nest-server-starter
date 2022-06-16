import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, Length } from 'class-validator';

export class UpdatePasswordDTO {
  @IsNotEmpty({ message: 'The password cannot be empty.' })
  @IsString({ message: 'The password must to be a string' })
  @Length(6, 20, { message: 'The password must be 6 to 20 characters' })
  @ApiProperty()
  password: string;

  @IsNotEmpty({ message: 'The password cannot be empty.' })
  @IsEmail({ message: 'The password is not valid' })
  @Length(6, 20, { message: 'The password must be 6 to 20 characters' })
  @ApiProperty()
  newPassword: string;
}
