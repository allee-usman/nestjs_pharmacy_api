import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    isEmail,
} from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password: string;
}