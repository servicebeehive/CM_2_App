export interface StockHeader {
    uname: string;
    p_operationtype: string;
    p_purchaseid: number | string;
    p_vendorid: number | string;
    p_invoiceno: string;
    p_invoicedate: string;
    p_remarks: string;
    p_active: 'Y' | 'N';
    p_loginuser: string;
    clientcode: string;
    'x-access-token'?: string;
}
export interface DrowdownDetails {
    fieldid: number;
    fieldname: string;
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
    'x-access-token'?: string;
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
    p_companyid: number;
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
    'x-access-token'?: string;
}

export interface GetUserDetail {
    p_ufullname: string;
    p_uname: string;
    p_pwd: string;
    p_active: string;
    p_operationtype: string;
    p_phone: string;
    p_utypeid: string;
    p_email: string;
    p_oldpwd: string;
    p_companyid: string;
    p_projects: number[]
}

export interface Project{
    project_id: number
}

export interface InsertUserType {
    p_usertypeid: number;
    p_usertypename: string;
    p_isactive: string;
    p_loginuser: string;
    p_companyid: number;
    p_industrytype: string;
    p_isapproval: string;
    p_webaccess: string;
}

export interface SupplierMaster{
      p_supplierid: number;
      p_suppliername: string;
      p_supplieraddress:string;
      p_suppliercountry: string;
      p_supplierstate: string;
      p_suppliercity: string;
      p_supplierpincode: string;
      p_supplierphone: string;
      p_supplieremail: string;
      p_suppliergstno: string;
      p_suppliercontactperson: string;
      p_suppliercontactphone: string;
      p_suppliercontactemail: string;
      p_isactive: 'Y' | 'N';
      p_username: string;
      p_prefferedvendor:  'Y' | 'N';
      p_paymentter: string;
}

export interface RemovedParamterBased {
    p_returntype: string;
    p_returnvalue: string;
    p_username: string;
    p_companyid: string;
}

export interface DropdownParamter{
  returnType:string;
  returnValue:string | null;
  username:string;
  option1:string | null;
  option2:string | null;
}

export interface UpsertPermission{
    p_companyid: string;
    p_profileid: string; 
    p_permissions: AvailablePermission[];
    p_type: string;
    p_created_by: number;
}

export interface AvailablePermission{
   id:number; 
}

