import { Controller, Post, Body, UploadedFiles, UseInterceptors, BadRequestException, Req, Param, ParseIntPipe, Get, Put} from '@nestjs/common';
import { HistoryService } from './history.service';
import { FilesInterceptor } from '@nestjs/platform-express';


@Controller('history')
export class HistoryController {
  constructor(private readonly  historyService: HistoryService) {}

  @Get('booking/:lodgeId')
async getBooked(
  @Param('lodgeId', ParseIntPipe) lodgeId: number,
) {
  return this.historyService.getBookedData(lodgeId);
}
@Get('cancelled/:lodgeId')
async getCancel(
  @Param('lodgeId', ParseIntPipe) lodgeId: number,
) {
  return this.historyService.getCancelledData(lodgeId);
}

@Get('partial/:lodgeId')
async getPartial(
  @Param('lodgeId', ParseIntPipe) lodgeId: number,
) {
  return this.historyService.getPartialCancelData(lodgeId);
}

@Get('prebooked/:lodgeId')
async getPreBooked(
  @Param('lodgeId', ParseIntPipe) lodgeId: number,
) {
  return this.historyService.getPreBookedData(lodgeId);
}

}
