import { Test, TestingModule } from '@nestjs/testing';
import { UserrepositoryService } from './userrepository.service';

describe('UserrepositoryService', () => {
  let service: UserrepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserrepositoryService],
    }).compile();

    service = module.get<UserrepositoryService>(UserrepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
