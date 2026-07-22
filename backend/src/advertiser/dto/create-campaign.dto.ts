import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  campaignName: string;

  @IsNumber()
  @Min(1)
  totalBudget: number;

  @IsNumber()
  @Min(1)
  dailyBudget: number;

  @IsNumber()
  @Min(0.01)
  maxCpc: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  targetCountries: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  targetDevices: string[];

  @IsString()
  @IsIn(['image', 'html'])
  creativeType: string;

  @ValidateIf((dto: CreateCampaignDto) => dto.creativeType === 'image')
  @IsString()
  @MinLength(8)
  creativeUrl?: string;

  @ValidateIf((dto: CreateCampaignDto) => dto.creativeType === 'html')
  @IsString()
  @MinLength(8)
  @MaxLength(5000)
  creativeHtml?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
