import { Controller, Get, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('admins')
export class UserFullController {
  constructor(private readonly userService: UserService) {}

  @Get(':lodgeId/:userId')
  getUserWithAdmin(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Param('userId') userId: string,
  ) {
    return this.userService.getUserWithAdmin(lodgeId, userId);
  }

  @Get(':lodgeId')
  getAdminsByLodge(@Param('lodgeId', ParseIntPipe) lodgeId: number) {
    return this.userService.getAdminsByLodge(lodgeId);
  }

  @Delete(':lodgeId/admin/:userId')
  deleteAdmin(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Param('userId') userId: string,
  ) {
    return this.userService.deleteAdmin(lodgeId, userId);
  }
}
