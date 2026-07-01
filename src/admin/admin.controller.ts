import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('details')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ====== Admin endpoints ======

  @Get(':lodgeId/admins')
  findAllAdmins(@Param('lodgeId', ParseIntPipe) lodgeId: number) {
    return this.adminService.findAllAdminsByLodge(lodgeId);
  }

  @Get(':lodgeId/admins/:userId')
  findAdmin(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Param('userId') userId: string, // user_id is STRING in Prisma
  ) {
    return this.adminService.findAdminByLodge(lodgeId, userId);
  }

  // ====== Administrator endpoints ======

  @Get(':lodgeId/administrators')
  findAllAdministrators(@Param('lodgeId', ParseIntPipe) lodgeId: number) {
    return this.adminService.findAllAdministratorsByLodge(lodgeId);
  }

  @Get(':lodgeId/administrators/:userId')
  findAdministrator(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Param('userId') userId: string,
  ) {
    return this.adminService.findAdministratorByLodge(lodgeId, userId);
  }
}
