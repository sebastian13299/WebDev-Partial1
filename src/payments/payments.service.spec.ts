import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { SqliteService } from '../sqlite/sqlite.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
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

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
