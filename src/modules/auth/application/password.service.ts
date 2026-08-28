import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PASSWORD_RULES } from '../domain/auth.constants';

@Injectable()
export class PasswordService {
  private dummyHash?: Promise<string>;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, PASSWORD_RULES.bcryptRounds);
  }

  /**
   * Hash ausente ou não-bcrypt (conta social) ainda paga o custo de uma
   * comparação para não vazar, pelo tempo de resposta, se a conta existe.
   */
  async verify(plain: string, hash?: string | null): Promise<boolean> {
    if (!hash?.startsWith('$2')) {
      await bcrypt.compare(plain, await this.getDummyHash());
      return false;
    }

    return bcrypt.compare(plain, hash);
  }

  private getDummyHash(): Promise<string> {
    if (!this.dummyHash) {
      this.dummyHash = bcrypt.hash(
        'timing-safe-dummy',
        PASSWORD_RULES.bcryptRounds,
      );
    }
    return this.dummyHash;
  }
}
