import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Nieprawidłowy adres email' })
  email: string;

  @IsNotEmpty({ message: 'Hasło jest wymagane' })
  password: string;
}
