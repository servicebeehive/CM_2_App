// stockin.model.ts
export interface StockIn {
  selection :boolean;
  name?: string;
  code?: string;
  category?: string;
  curStock?: number;
  purchasePrice?: number;
  quantity?: number;
  total?: number;
  uom?: string;
  mrp?: number;
  discount?: number;
  minStock?: number;
  warPeriod?: number;
  location?: string;
  action?: string;
  itemid?:number
  printcount?:number
}
