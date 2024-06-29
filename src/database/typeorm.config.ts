import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { Env, envSchema } from "src/common/schemas/zod.schemas";
import { entities } from "./entities";

const config = new ConfigService<Env, true>(envSchema);

console.log(config.get("DB_DATABASE"));

export const typeOrmConfig = (env) => {
  const config: TypeOrmModuleOptions = {
    type: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_DATABASE,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    synchronize: true,
    logging: true,
    entities: [...entities],
  };
  return config;
};
