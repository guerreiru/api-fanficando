import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ParagraphService } from "./paragraph.service";
import { CreateParagraphDto } from "./dto/create-paragraph.dto";
import { UpdateParagraphDto } from "./dto/update-paragraph.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("paragraph")
@UseGuards(JwtAuthGuard)
export class ParagraphController {
  constructor(private readonly paragraphService: ParagraphService) {}

  @Post()
  create(@Body() createParagraphDto: CreateParagraphDto) {
    return this.paragraphService.create(createParagraphDto);
  }

  @Post("/createInLot")
  saveParagraphs(@Body() createParagraphDto: CreateParagraphDto[]) {
    return this.paragraphService.saveParagraphs(createParagraphDto);
  }

  @Get(":id/comments")
  findAllComments(@Param("id") id: string) {
    return this.paragraphService.findAllComments(id);
  }

  @Get()
  findAll() {
    return this.paragraphService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.paragraphService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateParagraphDto: UpdateParagraphDto
  ) {
    return this.paragraphService.update(+id, updateParagraphDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.paragraphService.remove(+id);
  }
}
