import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail({}, { message: 'Invalid email format' })
  newEmail: string;

  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @Matches(/\S/, { message: 'Password must not be only whitespace' })
  password: string;
}
