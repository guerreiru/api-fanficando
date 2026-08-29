import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { TagService } from '../application/tag.service';
import { CreateTagsDto } from './dto/create-tags.dto';
import { ListTagsDto } from './dto/list-tags.dto';

@Controller('tags')
export class TagController {
  constructor(private readonly tags: TagService) {}

  @Public()
  @Get()
  async list(@Query() query: ListTagsDto) {
    return { tags: await this.tags.search(query) };
  }

  /**
   * Autenticado e limitado: qualquer autor pode criar tag ao escrever, então a
   * rota é a porta de entrada natural para poluir o catálogo.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async create(@Body() body: CreateTagsDto) {
    return { tags: await this.tags.resolveOrCreate(body.names, body.type) };
  }

  // Declarada por último para não capturar a listagem.
  @Public()
  @Get(':slug')
  async bySlug(@Param('slug') slug: string) {
    return { tag: await this.tags.getBySlug(slug) };
  }
}
