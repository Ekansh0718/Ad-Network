import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  ADVERTISER = 'ADVERTISER',
  PUBLISHER = 'PUBLISHER',
}

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}