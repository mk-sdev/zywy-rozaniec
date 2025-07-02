import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Nieprawidłowy adres email' })
  email: string;

  @IsNotEmpty({ message: 'Hasło jest wymagane' })
  @MinLength(8, { message: 'Hasło musi mieć co najmniej 8 znaków' })
  @MaxLength(30, { message: 'Hasło musi mieć co najwyżej 30 znaków' })
  @Matches(/(?=.*[a-z])/, {
    message: 'Hasło musi zawierać co najmniej jedną małą literę',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Hasło musi zawierać co najmniej jedną wielką literę',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Hasło musi zawierać co najmniej jedną cyfrę',
  })
  @Matches(/(?=.*[!@#$%^&*()\-_=+{};:,<.>])/, {
    message: 'Hasło musi zawierać co najmniej jeden znak specjalny',
  })
  password: string;
}
