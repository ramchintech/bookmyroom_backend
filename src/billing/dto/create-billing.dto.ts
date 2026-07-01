export class BillingDto {
  lodge_id: number;
  user_id: string;
  booking_id: number;
  reason: any;
  total: number | null;
  balancePayment: number | null;
  payment_method: string;
  current_time?: string;   // <-- Add this
}
