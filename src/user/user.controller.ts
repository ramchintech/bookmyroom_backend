import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':lodgeId')
  findAllByLodge(@Param('lodgeId', ParseIntPipe) lodgeId: number) {
    return this.userService.findAllByLodge(lodgeId);
  }

  @Get(':lodgeId/:userId')
  findOneByLodge(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Param('userId') userId: string,
  ) {
    return this.userService.findOneByLodge(lodgeId, userId);
  }

  @Post(':lodgeId/admin')
  addAdmin(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Body() dto: CreateUserDto,
  ) {
    return this.userService.addAdmin({ ...dto, lodge_id: lodgeId });
  }
}
