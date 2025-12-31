import { Controller } from '@nestjs/common';
<<<<<<< HEAD
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }
}
=======

@Controller('users')
export class UsersController { }
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
