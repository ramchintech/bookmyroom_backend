import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { LodgeBlockService } from './lodge-block.service';

@Controller('lodge-blocks')
export class LodgeBlockController {
  constructor(private readonly lodgeBlockService: LodgeBlockService) {}

  // GET /lodge-blocks → all lodge blocks
  @Get()
  findAll() {
    return this.lodgeBlockService.findAll();
  }

  // GET /lodge-blocks/:lodgeId → block(s) for a specific lodge
  @Get(':lodgeId')
  findByLodge(@Param('lodgeId', ParseIntPipe) lodgeId: number) {
    return this.lodgeBlockService.findByLodge(lodgeId);
  }
}
