import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateAdZoneDto {
  @IsString()
  @MinLength(2)
  zoneName: string;

  @IsInt()
  @Min(1)
  @Max(4000)
  width: number;

  @IsInt()
  @Min(1)
  @Max(4000)
  height: number;

  @IsString()
  @MinLength(2)
  layoutType: string;
}
