import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { SqliteService } from '../sqlite/sqlite.service';

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: SqliteService,
          useValue: {
            exec: jest.fn(),
            run: jest.fn(),
            get: jest.fn(),
            all: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
