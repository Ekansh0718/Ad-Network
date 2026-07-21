import { IsOptional, IsString, MinLength } from 'class-validator';

export class ValidateDomainDto {
  @IsString()
  @MinLength(3)
  domain: string;

  @IsOptional()
  @IsString()
  expectedText?: string;
}
