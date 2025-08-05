import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Login musi być stringiem' })
  @IsNotEmpty({ message: 'Login nie może być pusty' })
  login: string;

  @IsNotEmpty({ message: 'Hasło nie może być puste' })
  @IsString({ message: 'Hasło musi być w formie tekstowej' })
  @Matches(/\S/, {
    message: 'Hasło nie może składać się wyłącznie ze znaków białych',
  })
  password: string;
}
