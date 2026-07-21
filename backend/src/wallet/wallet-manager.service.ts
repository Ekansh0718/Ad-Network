import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

type WalletAmount = Prisma.Decimal | number | string;

type LockedWalletRow = {
  balance_usd: Prisma.Decimal | number | string;
};

@Injectable()
export class WalletManager {
  constructor(private readonly prisma: PrismaService) {}

  async deduct(userId: string, amountUsd: WalletAmount) {
    const amount = this.normalizeAmount(amountUsd);

    return this.prisma.$transaction(async (tx) => {
      const [wallet] = await tx.$queryRaw<LockedWalletRow[]>`
        SELECT balance_usd
        FROM "User"
        WHERE id = ${userId}
        FOR UPDATE
      `;

      if (!wallet) {
        throw new NotFoundException('Wallet owner not found');
      }

      const currentBalance = new Prisma.Decimal(wallet.balance_usd);

      if (currentBalance.lessThan(amount)) {
        throw new ConflictException('Insufficient wallet balance');
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          balance_usd: {
            decrement: amount,
          },
        },
        select: {
          id: true,
          balance_usd: true,
        },
      });
    });
  }

  async credit(userId: string, amountUsd: WalletAmount) {
    const amount = this.normalizeAmount(amountUsd);

    return this.prisma.$transaction(async (tx) => {
      const [wallet] = await tx.$queryRaw<LockedWalletRow[]>`
        SELECT balance_usd
        FROM "User"
        WHERE id = ${userId}
        FOR UPDATE
      `;

      if (!wallet) {
        throw new NotFoundException('Wallet owner not found');
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          balance_usd: {
            increment: amount,
          },
        },
        select: {
          id: true,
          balance_usd: true,
        },
      });
    });
  }

  private normalizeAmount(amountUsd: WalletAmount) {
    const amount = new Prisma.Decimal(amountUsd);

    if (!amount.isFinite() || amount.lessThanOrEqualTo(0)) {
      throw new ConflictException('Wallet amount must be greater than zero');
    }

    return amount;
  }
}
