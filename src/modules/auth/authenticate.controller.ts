import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import { ZodValidationPipe } from "src/common/pipes/zod-validation-pipe";
import {
  AuthenticateBodySchema,
  authenticateBodySchema,
} from "src/common/schemas/zod.schemas";
import { UserService } from "../user/user.service";

@Controller("session")
export class AuthenticateController {
  constructor(
    private userService: UserService,
    private jwt: JwtService
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { email, password } = body;

    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException("User credentials do not match");
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("User credentials do not match");
    }

    const accessToken = this.jwt.sign({
      sub: user.id,
    });

    return {
      access_token: accessToken,
    };
  }
}
