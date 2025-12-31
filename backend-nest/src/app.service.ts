import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
<<<<<<< HEAD
  getHello(): string {
    return 'Hello World!';
  }
=======
    getHello(): string {
        return 'Hello World!';
    }
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
}
