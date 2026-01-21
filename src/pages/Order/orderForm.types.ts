export type OrderMode = 'normal' | 'draft' | 'template';

export interface OrderFormData {
  unitType: string;
  block: string;
  floor: string;
  unitNo: string;
  queenBedrooms: number;
  singleBedrooms: number;
  studios: number;
  bathrooms: number;
  includePartition: boolean;
  completionDays: number;
  isProgressivePayment: boolean;
  isDraftMode: boolean;
  orderMode: OrderMode;
  isBePowered: boolean;
  isRnpl: boolean;
  rnpl_base_price: number;
  finalAmount: number;
  tenure: number;
  bonusDescription: string;
  bonusValue: number;
  internalRemark: string;
  installment_method?: 'fixed' | 'dynamic' | string;
  installment_amount?: number;
  be_powered_base_price?: number;
}

