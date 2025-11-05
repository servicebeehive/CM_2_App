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
