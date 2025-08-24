import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Obecne hasło musi być stringiem' })
  @IsNotEmpty({ message: 'Obecne hasło nie może być puste' })
  @Matches(/\S/, {
    message: 'Obecne hasło nie może składać się wyłącznie ze znaków białych',
  })
  password: string;

  @IsNotEmpty({ message: 'Hasło jest puste' })
  @IsString({ message: 'Hasło nie jest stringiem' })
  @MinLength(8, { message: 'Hasło musi składać się z co najmniej 8 znaków' })
  @MaxLength(30, { message: 'Hasło musi składać się z co najwyżej 30 znaków' })
  @Matches(/(?=.*[a-z])/, {
    message: 'Hasło nie zawiera żadnej małej litery',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Hasło nie zawiera żadnej dużej litery',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Hasło nie zawiera żadnej cyfry',
  })
  @Matches(/(?=.*[!@#$%^&*()\-_=+{};:,<.>])/, {
    message: 'Hasło nie zawiera żadnego znaku specjalnego',
  })
  newPassword: string;
}
