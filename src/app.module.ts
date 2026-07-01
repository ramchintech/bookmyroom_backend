import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LodgeModule } from './lodge/lodge.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
// import { AdministratorModule } from './administrator/administrator.module';
import { AppPaymentModule } from './app-payment/app-payment.module';
import { FacilitatorModule } from './facilitator/facilitator.module';
import { ExpenseModule } from './expense/expense.module';
import { LodgeBlockModule } from './lodge-block/lodge-block.module';
import { IncomeModule } from './income/income.module';
import { PeakHoursModule } from './peak-hour/peak-hour.module';
import { DefaultValueModule } from './default-value/default-value.module';
import { RoomsModule } from './room/room.module';
import { BookingModule } from './booking/booking.module';
import { CancelModule } from './cancel/cancel.module';
import { BillingModule } from './billing/billing.module';
import { TwilioModule } from './twillo/twillo.module';
import { RegisterModule } from './register/register.module';
import { MessageModule } from './message/message.module';
import { ProfileModule } from './profile/profile.module';
import { SubmitTicketModule } from './submit/submit.module';
import { InstructionModule } from './instruction/instructions.module';
import { CalenderModule } from './calender/calender.module';
import { DrawingModule } from './drawing/drawing.module';
import { ChargesModule } from './charges/charges.module';
import { HomeModule } from './home/home.module';
import { HistoryModule } from './history/history.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    LodgeModule,
    UserModule,
    ProfileModule,
    AdminModule,
    // AdministratorModule,
    AppPaymentModule,
    FacilitatorModule,
    ExpenseModule,
    LodgeBlockModule,
    IncomeModule,
    PeakHoursModule,
    DefaultValueModule,
    RoomsModule,
    BookingModule,
    CancelModule,
    BillingModule,
    TwilioModule,
    RegisterModule,
    MessageModule,
    SubmitTicketModule,
    InstructionModule,
    CalenderModule,
    DrawingModule,
    ChargesModule,
    HomeModule,
    HistoryModule,
    DashboardModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
