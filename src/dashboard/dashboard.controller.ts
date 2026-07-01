import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get(':id/stats')
  async geLodgeStats(@Param('id', ParseIntPipe) lodgeId: number) {
    return this.dashboardService.getLodgeStats(lodgeId);
  }

  @Get("counts")
  async getStats() {
    return this.dashboardService.getDashboardStats();
  }
}
