
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryUsersDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number) // converts query-string values such as "2" into numbers, working with our global ValidationPipe configured with transform: true
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 10;
}