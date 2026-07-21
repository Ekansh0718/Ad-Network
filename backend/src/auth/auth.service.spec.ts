import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hashes passwords with 12 bcrypt rounds and does not return the hash', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockImplementation(async (data) => ({
      id: 'user-1',
      ...data,
      balance_usd: 0,
    }));

    const result = await service.register({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'secret12',
      role: 'ADVERTISER' as any,
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: expect.stringMatching(/^\$2[aby]\$12\$/),
      }),
    );
    expect(result.user).not.toHaveProperty('password');
  });

  it('sets the JWT in an httpOnly sameSite=lax cookie during login', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      password: await bcrypt.hash('secret12', 12),
      role: 'ADVERTISER',
    });
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const response = {
      cookie: jest.fn(),
    } as any;

    await service.login(
      {
        email: 'ada@example.com',
        password: 'secret12',
      },
      response,
    );

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'ada@example.com',
      role: 'ADVERTISER',
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'token',
      'jwt-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
      }),
    );
  });
});
