import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { DefaultValueService } from './default-value.service';
import { CreateDefaultValueDto } from './dto/create-default-value.dto';
import { UpdateDefaultValueDto } from './dto/update-default-value.dto';
import { CreateMultipleDefaultValuesDto } from './dto/create-multiple-values.dto';

@Controller('default-values')
export class DefaultValueController {
  constructor(private readonly defaultValueService: DefaultValueService) {}

  // 🔹 1️⃣ Get all default values
  @Get()
  findAll() {
    return this.defaultValueService.findAll();
  }

    @Post('multiple')
  createMultiple(@Body() dto: CreateMultipleDefaultValuesDto) {
    return this.defaultValueService.createMultiple(dto);
  }

  // 🔹 2️⃣ Get all default values for a specific lodge
  @Get('lodge/:lodge_id')
  findByLodgeId(@Param('lodge_id', ParseIntPipe) lodge_id: number) {
    return this.defaultValueService.findByLodgeId(lodge_id);
  }

  // 🔹 3️⃣ Get one default value by ID + lodge_id
  @Get(':id/:lodge_id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Param('lodge_id', ParseIntPipe) lodge_id: number,
  ) {
    return this.defaultValueService.findOne(id, lodge_id);
  }

  // 🔹 4️⃣ Create new default value
  @Post()
  create(@Body() createDefaultValueDto: CreateDefaultValueDto) {
    return this.defaultValueService.create(createDefaultValueDto);
  }

  // 🔹 5️⃣ Update default value
  @Patch(':id/:lodge_id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Param('lodge_id', ParseIntPipe) lodge_id: number,
    @Body() updateDefaultValueDto: UpdateDefaultValueDto,
  ) {
    return this.defaultValueService.update(id, lodge_id, updateDefaultValueDto);
  }

  // 🔹 6️⃣ Delete default value
  @Delete(':id/:lodge_id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('lodge_id', ParseIntPipe) lodge_id: number,
  ) {
    return this.defaultValueService.remove(id, lodge_id);
  }
}
