import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { FacilitatorService } from './facilitator.service';
import { CreateFacilitatorDto } from './dto/create-facilitator.dto';
import { UpdateFacilitatorDto } from './dto/update-facilitator.dto';

@Controller('facilitator')
export class FacilitatorController {
  constructor(private readonly facilitatorService: FacilitatorService) {}

  // ✅ Create a new facilitator
  @Post()
  async create(@Body() dto: CreateFacilitatorDto) {
    const data = await this.facilitatorService.create(dto);
    return {
      success: true,
      message: 'Facilitator created successfully',
      data,
    };
  }

  // ✅ Get all facilitators by lodge_id
  @Get('lodge/:lodge_id')
  async findAllByLodge(@Param('lodge_id') lodge_id: string) {
    const data = await this.facilitatorService.findAllByLodge(Number(lodge_id));
    return {
      success: true,
      message: 'Facilitators fetched successfully',
      data,
    };
  }

  // ✅ Get one facilitator by id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.facilitatorService.findOne(Number(id));
    return {
      success: true,
      message: 'Facilitator fetched successfully',
      data,
    };
  }

  // ✅ Update facilitator
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFacilitatorDto) {
    const data = await this.facilitatorService.update(Number(id), dto);
    return {
      success: true,
      message: 'Facilitator updated successfully',
      data,
    };
  }

  // ✅ Delete facilitator
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.facilitatorService.remove(Number(id));
    return {
      success: true,
      message: 'Facilitator deleted successfully',
    };
  }
}
