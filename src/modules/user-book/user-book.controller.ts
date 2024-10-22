import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { UserBookService } from "./user-book.service";
import { CreateUserBookDto } from "./dto/create-user-book.dto";
import { UpdateUserBookDto } from "./dto/update-user-book.dto";

@Controller("user-book")
export class UserBookController {
  constructor(private readonly userBookService: UserBookService) {}

  @Post()
  create(@Body() createUserBookDto: CreateUserBookDto) {
    return this.userBookService.create(createUserBookDto);
  }

  @Get()
  findAll() {
    return this.userBookService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.userBookService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateUserBookDto: UpdateUserBookDto
  ) {
    return this.userBookService.update(id, updateUserBookDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.userBookService.remove(id);
  }

  @Get("user/:userId")
  findByUserId(@Param("userId") userId: string) {
    return this.userBookService.findByUserId(userId);
  }

  @Get("book/:bookId")
  findByBookId(@Param("bookId") bookId: string) {
    return this.userBookService.findByBookId(bookId);
  }

  @Patch(":id/progress")
  updateReadingProgress(
    @Param("id") id: string,
    @Query("progress") progress: number
  ) {
    return this.userBookService.updateReadingProgress(id, progress);
  }
}
