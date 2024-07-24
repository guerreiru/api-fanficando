import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateCharacterDto } from "./dto/create-character.dto";
import { UpdateCharacterDto } from "./dto/update-character.dto";
import { Repository } from "typeorm";
import { Character } from "./entities/character.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>
  ) {}

  private async findCharacterById(id: string) {
    const chapter = this.findOne(id);

    if (!chapter) {
      throw new NotFoundException("Character not found");
    }

    return chapter;
  }

  async create(createCharacterDto: CreateCharacterDto) {
    const character = this.characterRepository.create(createCharacterDto);
    return await this.characterRepository.save(character);
  }

  async createInLot(createCharactersDto: CreateCharacterDto[]) {
    const characters = this.characterRepository.create(createCharactersDto);
    return this.characterRepository.save(characters);
  }

  async findAll() {
    return await this.characterRepository.findAndCount();
  }

  async findOne(id: string) {
    return await this.characterRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateCharacterDto: UpdateCharacterDto) {
    await this.findCharacterById(id);

    return await this.characterRepository.update(id, updateCharacterDto);
  }

  async remove(id: string) {
    await this.findCharacterById(id);

    return await this.characterRepository.delete(id);
  }
}
