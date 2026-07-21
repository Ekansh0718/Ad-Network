import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the authenticated profile from the request', () => {
    const user = {
      id: 'user-1',
      email: 'advertiser@example.com',
      role: 'ADVERTISER',
    };

    expect(controller.getProfile({ user })).toEqual({
      message: 'Profile fetched successfully',
      user,
    });
  });

  it('returns advertiser-only payload for guarded advertiser endpoint', () => {
    const user = {
      id: 'user-1',
      email: 'advertiser@example.com',
      role: 'ADVERTISER',
    };

    expect(controller.getAdvertiserOnly({ user })).toEqual({
      message: 'Advertiser access granted',
      user,
    });
  });
});
