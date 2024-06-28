import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserPayload } from "src/schemas/zod.schemas";

export const CurrentUser = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.user as UserPayload;
  }
);
