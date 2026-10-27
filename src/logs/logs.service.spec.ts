import { Test, TestingModule } from '@nestjs/testing';
import { LogsService } from './logs.service';
import { SqliteService } from '../sqlite/sqlite.service';

describe('LogsService', () => {
  let service: LogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
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

    service = module.get<LogsService>(LogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
