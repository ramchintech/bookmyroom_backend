import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { InstructionsService } from './instructions.service';
import { CreateInstructionDto } from './dto/create-instruction.dto';
import { UpdateInstructionDto } from './dto/update-instruction.dto';

@Controller('instructions')
export class InstructionsController {
  constructor(private readonly instructionsService: InstructionsService) {}

  @Get('lodge/:lodgeId')
  async findAll(@Param('lodgeId', ParseIntPipe) lodgeId: number) {
    return this.instructionsService.findAllByHall(lodgeId);
  }

  @Get(':instructionId')
  async findOne(@Param('instructionId', ParseIntPipe) instructionId: number) {
    return this.instructionsService.findOne(instructionId);
  }

  // Single create
  @Post()
  async create(@Body() dto: CreateInstructionDto) {
    return this.instructionsService.create(dto);
  }

  // Multiple create
  @Post('bulk')
  async createMany(@Body() dtos: CreateInstructionDto[]) {
    return this.instructionsService.createMany(dtos);
  }

  @Patch(':instructionId')
  async update(
    @Param('instructionId', ParseIntPipe) instructionId: number,
    @Body() dto: UpdateInstructionDto,
  ) {
    return this.instructionsService.update(instructionId, dto);
  }

  @Delete(':instructionId/lodge/:lodgeId')
  async remove(
    @Param('instructionId', ParseIntPipe) instructionId: number,
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
  ) {
    return this.instructionsService.remove(instructionId, lodgeId);
  }
}
