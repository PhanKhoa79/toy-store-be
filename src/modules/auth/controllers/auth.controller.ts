import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import type { CurrentUser } from '@/common/contracts';
import type { AuthenticatedRequest } from '@/common/types/authenticated-request.type';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { AuthService, AuthTokens } from '@/modules/auth/services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a customer account' })
  @ApiCreatedResponse({ description: 'Customer registered and authenticated' })
  @ApiStandardErrors()
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(response, result.tokens);
    return { data: { user: result.user } };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login customer, staff or admin account' })
  @ApiOkResponse({ description: 'Authenticated session' })
  @ApiStandardErrors()
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(response, result.tokens);
    return { data: { user: result.user } };
  }

  @Post('logout')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Logout current user' })
  @ApiOkResponse({ description: 'Logged out' })
  @ApiStandardErrors()
  logout(@Res({ passthrough: true }) response: Response) {
    this.clearAuthCookies(response);
    return { data: { loggedOut: true } };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token from refresh cookie' })
  @ApiOkResponse({ description: 'Access token refreshed' })
  @ApiStandardErrors()
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const tokens = await this.authService.refresh(request.cookies?.refresh_token);
    this.setAuthCookies(response, tokens);
    return { data: { refreshed: true } };
  }

  @Get('me')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ description: 'Current user with permissions' })
  @ApiStandardErrors()
  me(@CurrentUserDecorator() user: CurrentUser | undefined, @Req() request: AuthenticatedRequest) {
    return { data: user ?? request.user };
  }

  private setAuthCookies(response: Response, tokens: AuthTokens) {
    const secure = process.env.NODE_ENV === 'production';
    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 15 * 60 * 1000
    });
    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/' });
  }
}
