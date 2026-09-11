export interface UpserWorkList {
    p_work_id: number;
    p_project_id: number;
    p_tower_block_id: number;
    p_level_name: string;
    p_pour_name: string;
    p_user_id: number;
    p_isactive: 'Y' | 'N';
    p_status: string;
}

export interface MaterialRequisitionPayload {
    p_action: 'DRAFT' | 'SUBMIT';
    p_operation: 'INSERT' | 'EDIT' | 'DELETE';
    p_mf_id: number | null;
    p_project_id: number | null;
    p_department_id: number | null;
    p_tower_block_id: number | null;
    p_level_name: string | null;
    p_forecast_month: string | null; 
    p_pour_name: string | null;
    p_remarks: string | null;
    p_items: MaterialForecastItem[];
    p_loginuser: number | null;
    p_mr_date?: string | Date | null;
    p_required_by_date?: string | Date | null;
    p_requested_by?: number | null;
    p_priority?: string | null;
    p_attachment?: string | null;
}

export interface MaterialForecastItem {
    item_category_id: number;
    item_id: number;
    uom_id: number;
    buffer_stock: number;
    required_qty: number;
    total_mr_qty: number;
    available_stock: number;
    pending_qty: number;
    required_qty_net: number;
    remarks: string;
}

export interface PurchaseOrderItem {
    mf_id: number | null;
    mfdetailid: number | null;
    department_id: number | null;
    vendor_id: number | null;
    item_category_id: number | null;
    item_id: number | null;
    uom_id: number | null;
    forecast_qty: number | null;
    available_stock: number | null;
    pending_po_qty: number | null;
    required_qty: number | null;
    po_qty: number;
    rate: number;
    amount: number;
    remarks: string | null;
}

export interface PurchaseDraftPayload {
    p_operation: 'INSERT' | 'UPDATE';
    p_draft_id: number | null;
    p_company_id: number | null;
    p_project_id: number | null;
    p_department_id: number | null;
    p_po_date: string | null;          
    p_delivery_date: string | null;   
    p_delivery_location: string | null;
    p_payment_terms: string | null;
    p_remarks: string | null;
    p_items_json: PurchaseOrderItem[];
    p_loginuser: number;
    p_mr_no?: string | null;
}

export interface PurchaseOrderPayload {
    p_action: 'DRAFT' | 'SUBMIT';
    p_operation: 'INSERT' | 'EDIT' | 'DELETE';
    p_po_id: number | null;
    p_draft_id: number | null;
    p_company_id: number | null;
    p_project_id: number | null;
    p_department_id: number | null;
    p_po_date: string | null;         
    p_delivery_date: string | null;   
    p_delivery_location: string | null;
    p_payment_terms: string | null;
    p_remarks: string | null;
    p_items_json: PurchaseOrderItem[];
    p_loginuser: string;
    p_mr_no: string | null;
}

export interface VendorInvitePayload {
    categoryid: number | null;
    vendorids: number[];
}

export interface UpsertRfqPayload {
    p_companyid: number;
    p_rfqid: number;            
    p_site_id: number;
    p_rfqdate: string | Date;  
    p_rfq_description: string;
    p_remarks: string;
    p_attachment_path?: string | null;
    p_status: string;       
    p_user_id: number;
    p_mr_no?: string | null;
    p_vendor_json?: VendorInvitePayload[] | null;
    p_item_json?: ItemDetail[] | null;
}

export interface ItemDetail {
    item_id: number | null;
    category_id: number | null;
    category: string;
    item: string;
    uom_id: number | null;
    uom: string;
    buffer_stock: number;
    required_qty: number;
    available_stock: number;
    pending_qty: number;
    total_mr_qty: number;
    mr_no?: string;
    net_required_qty: number;
}
export interface GmailVendorRow {
    selected: boolean;
    vendor: string;
    category: string;
    count: number;
    vendorId: number | null;
    email: string | null;
    ccEmail: string | null;
    bccEmail: string | null;
    subject: string;
    body1: string;
    body2: string;
    attachmentPath: string | null;
    mailLogId: number | null;
}

export interface VendorEntry {
    price: number | null;
    quantity: number | null;
    paymentTerm: string;
    quality_score?: number | null;
    payment_terms_days?: number | null;
    delivery_terms_days?: number | null;
    total_score?: number | null;
    vendor_rank?: number | null;
    is_recommended?: boolean;
    remarks?: string;
}

export interface ComparisonRow {
    category: string;
    item: string;
    required_qty: number;
    item_id?: number;
    category_id?: number;
    uom_id?: number;
    uom_name?: string;
    vendorData: { [vendorId: number]: VendorEntry };
    _searchText?: string;
    weightage?: number;
}

export interface MiscPurchase {
  p_operation: 'INSERT' | 'UPDATE' | 'DELETE';
  p_misc_purchase_id: number | null;
  p_misc_purchase_no: string;
  p_purchase_date: string; // 'YYYY-MM-DD'
  p_company_id: number | null;
  p_project_id: number | null;
  p_vendor_name: string | null;
  p_attachment: string | null;
  p_remarks: string;
  p_items_json: MiscPurchaseItem[];
  p_loginuser: number;
}

export interface MiscPurchaseItem {
  misc_purchase_detail_id: number;
  item_id: number | null;
  item_description: string;
  category_id: number | null;
  uom_id: number | null;
  quantity: number | null;
  rate: number | null;
  remarks: string;
}

export interface GrnHeader {
     p_operation: 'INSERT' | 'UPDATE' | 'DELETE';
     p_grn_id: number | null;
     p_grn_date: string; // 'YYYY-MM-DD'
     p_po_id: number | null;
     p_po_date: string; // 'YYYY-MM-DD'
     p_company_id: number | null;
     p_project_id: number | null;
     p_vendor_id: number | null;
     p_status: string;
     p_loginuser: number;
}

export interface GrnDelivery {
    p_operation: 'INSERT' | 'UPDATE' | 'DELETE';
    p_delivery_id: number | null;
    p_grn_id: number | null;
    p_po_id: number | null;
    p_challan_no: string;
    p_challan_date: string; // 'YYYY-MM-DD'
    p_vehicle_no: string;
    p_driver_name: string;
    p_driver_mobile: string;
    p_remarks: string;
    p_loginuser: number;
}

export interface GrnRemarks {
    p_operation: 'INSERT' | 'UPDATE' | 'DELETE';
    p_grn_remark_id: number | null;
    p_grn_id: number | null;
    p_po_id: number | null;
    p_received_by: number | null;
    p_remarks: string;
    p_loginuser: number;
}

export interface GrnDocumentItem {
    document_type: 'DELIVERY_CHALLAN' | 'MATERIAL_PHOTO' | 'QUALITY_REPORT' | 'OTHER';
    document_name: string;
    document_path: string;
}

export interface GrnDocuments {
    p_operation: 'SAVE' | 'UPDATE' | 'DELETE';
    p_document_id: number | null;
    p_grn_id: number | null;
    p_po_id: number | null;
    p_documents: GrnDocumentItem[];
    p_loginuser: number;
}
