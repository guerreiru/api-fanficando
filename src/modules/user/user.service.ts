import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { hash } from "bcryptjs";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  private async findUserById(id: string) {
    const user = this.findOne(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const userWithSameEmail = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (userWithSameEmail) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await hash(createUserDto.password, 7);

    const result = await this.userRepository.save({
      ...createUserDto,
      password: hashedPassword,
    });

    if (result.id) {
      return {
        ...result,
        password: null,
      };
    }

    return result;
  }

  async findAll() {
    return this.userRepository.findAndCount();
  }

  async findOne(id: string) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findUserById(id);

    return this.userRepository.update(id, updateUserDto);
  }

  async remove(id: string) {
    await this.findUserById(id);

    return this.userRepository.delete(id);
  }
}
