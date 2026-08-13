import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthTokenPayload } from "./auth.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthTokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
