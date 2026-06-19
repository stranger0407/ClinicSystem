import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('clinic/resolve')
  async resolveClinic(@Query('subdomain') subdomain?: string) {
    return this.authService.resolveClinic(subdomain);
  }

  @Post('clinic/register')
  async registerClinic(@Body() dto: RegisterClinicDto) {
    return this.authService.registerClinic(dto);
  }

  @Post('register')
  async register(@ClinicId() clinicId: string, @Body() dto: RegisterUserDto) {
    return this.authService.registerUser(clinicId, dto);
  }

  @Post('login')
  async login(@ClinicId() clinicId: string, @Body() dto: LoginDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException(
        'Either email or phone must be provided for login',
      );
    }
    return this.authService.login(clinicId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('clinic')
  async getClinic(@ClinicId() clinicId: string) {
    return this.authService.getClinicDetails(clinicId);
  }
}
