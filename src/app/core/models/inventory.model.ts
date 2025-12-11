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

export interface UserHeader {
  uname?: string;
  p_ufullname?: string;
  p_uname?: string;
  p_pwd?: string;
  p_active?: string;
  p_operationtype?: string;
  p_phone?: string;
  p_utypeid?: string;
  p_email?: string;
  p_loginuser?: string;
  p_oldpwd?: string;
  clientcode?: string;
  p_companyname: string;
  p_companyaddress: string;
  p_companycity: string;
  p_companystate: string;
  p_companycountry: string;
  p_companypincode: string;
  p_companyphone: string;
  p_companyemail: string | null;
  p_companygstno: string;
  p_companycontactperson: string;
  p_companycontactphone: string;
  p_companycontactemail: string;
  p_companylogo: string | null;
  "x-access-token"?: string;
}




