import { IsString } from 'class-validator';
export class CreateUserDto {
  @IsString()
  name: string;
  @IsString()
  mobile: string;
  @IsString()
  password: string;
}
