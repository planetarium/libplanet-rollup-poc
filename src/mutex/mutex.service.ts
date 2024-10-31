import { Injectable } from '@nestjs/common';
import { Mutex } from 'async-mutex';

@Injectable()
export class MutexService {
  private mutex = new Mutex();

  async runLocked<T>(callback: () => Promise<T>): Promise<T> {
    // acquire lock
    const release = await this.mutex.acquire();
    try {
      return await callback();
    } catch (e) {
      // handle exception
      throw e;
    } finally {
      // release the lock in the end
      release();
    }
  }
}