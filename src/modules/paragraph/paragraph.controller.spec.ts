import { Test, TestingModule } from '@nestjs/testing';
import { ParagraphController } from './paragraph.controller';
import { ParagraphService } from './paragraph.service';

describe('ParagraphController', () => {
  let controller: ParagraphController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParagraphController],
      providers: [ParagraphService],
    }).compile();

    controller = module.get<ParagraphController>(ParagraphController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
