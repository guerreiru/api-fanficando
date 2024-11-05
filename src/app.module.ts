import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { envSchema } from "./common/schemas/zod.schemas";
import { typeOrmConfig } from "./database/typeorm.config";
import { modules } from "./modules";

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig(process.env)),
    ...modules,
  ],
  controllers: [],
  providers: [TypeOrmModule],
})
export class AppModule {}
