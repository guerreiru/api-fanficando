import { Test, TestingModule } from '@nestjs/testing';
import { ParagraphService } from './paragraph.service';

describe('ParagraphService', () => {
  let service: ParagraphService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParagraphService],
    }).compile();

    service = module.get<ParagraphService>(ParagraphService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
