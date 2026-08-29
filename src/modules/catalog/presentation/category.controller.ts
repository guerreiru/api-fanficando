import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../../auth/presentation/guards/admin.guard';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { CategoryService } from '../application/category.service';
import { categoryNotFound } from '../domain/catalog.errors';
import { CategoryNameDto } from './dto/category-name.dto';

/**
 * Id fora do formato não pode existir: responde no contrato de erro da API em
 * vez de vazar o "Validation failed" cru do Nest.
 */
const CategoryId = new ParseUUIDPipe({
  exceptionFactory: () => categoryNotFound(),
});

@Controller('categories')
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Public()
  @Get()
  async list() {
    return { categories: await this.categories.list() };
  }

  @Post()
  @UseGuards(AdminGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(@Body() body: CategoryNameDto) {
    return { category: await this.categories.create(body.name) };
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async rename(
    @Param('id', CategoryId) id: string,
    @Body() body: CategoryNameDto,
  ) {
    return { category: await this.categories.rename(id, body.name) };
  }

  /** As histórias não são apagadas: ficam sem categoria. */
  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  remove(@Param('id', CategoryId) id: string) {
    return this.categories.remove(id);
  }
}
