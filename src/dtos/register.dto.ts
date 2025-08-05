import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Login musi być stringiem' })
  @IsNotEmpty({ message: 'Login nie może być pusty' })
  @Matches(/\S/, { message: 'Login nie może składać się wyłącznie ze spacji' })
  @MinLength(3, { message: 'Login musi składać się z co najmniej 3 znaki' })
  @MaxLength(30, { message: 'Login musi składać się z co najwyżej 30 znaków' })
  login: string;

  @IsNotEmpty({ message: 'Hasło nie może być puste' })
  @IsString({ message: 'Hasło musi być stringiem' })
  @MinLength(8, { message: 'Hasło musi składać się z co najmniej 8 znaków' })
  @MaxLength(30, { message: 'Hasło musi składać się z co najwyżej 30 znaków' })
  @Matches(/(?=.*[a-z])/, {
    message: 'Hasło musi zawierać co najmniej jedną małą literę',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Hasło musi zawierać co najmniej jedną dużą literę',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Hasło musi zawierać co najmniej jedną cyfrę',
  })
  @Matches(/(?=.*[!@#$%^&*()\-_=+{};:,<.>])/, {
    message: 'Hasło musi zawierać co najmniej jeden znak specjalny',
  })
  password: string;
}
