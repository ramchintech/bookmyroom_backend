import { Module } from '@nestjs/common';
import { DefaultValueService } from './default-value.service';
import { DefaultValueController } from './default-value.controller';

@Module({
  controllers: [DefaultValueController],
  providers: [DefaultValueService],
})
export class DefaultValueModule {}
