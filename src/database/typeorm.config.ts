import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { entities } from "./entities";

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
