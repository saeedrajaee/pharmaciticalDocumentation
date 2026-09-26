import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import refreshConfig from '../config/refresh.config';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(
    @Inject(refreshConfig.KEY)
    // private refreshTokenConfig: ConfigType<typeof refreshConfig>,
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh'),
      secretOrKey: configService.getOrThrow('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  // validate(req: Request, payload: AuthJwtPayload) {
  //   const userId = payload.sub;
    
  //   const refreshToken = req.body.refresh;

  //   return this.authService.validateRefreshToken(userId, refreshToken);
  // }
}
