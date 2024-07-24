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
import { CharacterService } from "./character.service";
import { CreateCharacterDto } from "./dto/create-character.dto";
import { UpdateCharacterDto } from "./dto/update-character.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateCharactersDto } from "./dto/create-characters.dto";

@Controller("character")
@UseGuards(JwtAuthGuard)
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  create(@Body() createCharacterDto: CreateCharacterDto) {
    return this.characterService.create(createCharacterDto);
  }

  @Post("/create-in-lot")
  createInLot(@Body() createUsersDto: CreateCharactersDto) {
    return this.characterService.createInLot(createUsersDto.characters);
  }

  @Get()
  findAll() {
    return this.characterService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.characterService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateCharacterDto: UpdateCharacterDto
  ) {
    return this.characterService.update(id, updateCharacterDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.characterService.remove(id);
  }
}
