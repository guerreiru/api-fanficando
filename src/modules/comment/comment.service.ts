import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../user/entities/user.entity";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { Comment } from "./entities/comment.entity";

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(createCommentDto: CreateCommentDto) {
    const { userId, ...commentData } = createCommentDto;

    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const comment = this.commentRepository.create({
      ...commentData,
      user,
    });

    return await this.commentRepository.save(comment);
  }

  async findAll() {
    return await this.commentRepository.findAndCount({
      relations: {
        user: true,
      },
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} comment`;
  }

  update(id: string, updateCommentDto: UpdateCommentDto) {
    return `This action updates a #${id} comment`;
  }

  remove(id: string) {
    return `This action removes a #${id} comment`;
  }
}
