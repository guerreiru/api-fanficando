import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./modules/auth/auth.module";
import { BookModule } from "./modules/book/book.module";
import { Book } from "./modules/book/entities/book.entity";
import { CategoryModule } from "./modules/category/category.module";
import { Category } from "./modules/category/entities/category.entity";
import { ChapterModule } from "./modules/chapter/chapter.module";
import { Chapter } from "./modules/chapter/entities/chapter.entity";
import { CharacterModule } from "./modules/character/character.module";
import { Character } from "./modules/character/entities/character.entity";
import { ReviewModule } from "./modules/review/review.module";
import { Tag } from "./modules/tag/entities/tag.entity";
import { TagModule } from "./modules/tag/tag.module";
import { User } from "./modules/user/entities/user.entity";
import { UserModule } from "./modules/user/user.module";
import { envSchema } from "./schemas/zod.schemas";
import { Review } from "./modules/review/entities/review.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      synchronize: true,
      logging: true,
      entities: [Book, Category, Chapter, Character, Tag, User, Review],
    }),
    AuthModule,
    UserModule,
    CategoryModule,
    CharacterModule,
    BookModule,
    ChapterModule,
    TagModule,
    ReviewModule,
  ],
  controllers: [],
  providers: [TypeOrmModule],
})
export class AppModule {}
