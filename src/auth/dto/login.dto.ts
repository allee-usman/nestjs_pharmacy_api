import {
    IsEmail,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { RegisterDto } from './register.dto.js';

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password: string;
}