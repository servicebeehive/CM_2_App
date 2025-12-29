interface InventoryStatus {
    label: string;
    value: string;
}
export interface Product {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    inventoryStatus?: InventoryStatus;
    category?: string;
    image?: string;
    rating?: number;
}
export interface ItemDetail {
  billno: string | null;
  cnno: string | null;
  current_stock: number | null;
  discount: number;
  discounttype: string | null;
  dnno: string | null;
  itembarcode: string | number;   // barcode can be number or string
  itemcost: number;
  itemid: number;
  itemname: string;
  itemsku: string;
  mrp: number;
  quantity: number;
  similaritem: 'Y' | 'N';        // restricted type
  transactiondetailid: number;
  uomid: number;
  uomname: string;
  vendorid:number|null;
}
