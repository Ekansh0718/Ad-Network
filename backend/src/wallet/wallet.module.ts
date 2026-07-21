import { Module } from '@nestjs/common';

import { WalletManager } from './wallet-manager.service';

@Module({
  providers: [WalletManager],
  exports: [WalletManager],
})
export class WalletModule {}
