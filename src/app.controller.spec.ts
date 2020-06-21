import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('App Controller', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });


  describe('root', () => {
    it('should return "File Ingester"', () => {
      expect(controller.index()).toContain('File Ingester');
    });
  });
});
