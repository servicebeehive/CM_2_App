export interface StockHeader {
  uname: string;
  p_operationtype: string;
  p_purchaseid: number|string;
  p_vendorid: number|string;
  p_invoiceno: string;
  p_invoicedate: string;
  p_remarks: string;
  p_active: 'Y' | 'N';
  p_loginuser: string;
  clientcode: string;
  "x-access-token"?:string

}
export interface DrowdownDetails{
    fieldid:number;
   fieldname:string;

}
export interface SaleHeader {
  uname: string;
  p_transactiontype: 'SALE' | 'RETURN' | string;
  p_transactionid: number | string;
  p_transactiondate: string | Date;
  p_customername: string;
  p_mobileno: string;
  p_totalcost: number;
  p_totalsale: number;
  p_overalldiscount: number;
  p_roundoff: number | string;
  p_totalpayable: number;
  p_currencyid: number;
  p_gsttran: 'Y' | 'N';
  p_status: string;
  p_isactive: 'Y' | 'N';
  p_linktransactionid: number;
  p_replacesimilir: string;
  p_creditnoteno: string;
  p_paymentmode: string;
  p_paymentdue: number;

  /* Sales Items Array */
  p_sale: SaleItem[];

  clientcode: string;
  "x-access-token"?: string;
}
export interface SaleItem {
  TransactiondetailId: number;
  ItemId: number | string;
  ItemName: string;
  UOMId: number | string;
  Quantity: number;
  itemcost: number;
  MRP: number;
  totalPayable: number;
}

