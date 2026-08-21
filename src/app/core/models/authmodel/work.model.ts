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
    p_loginuser: number
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
    p_vendor_json?: VendorInvitePayload[] | null;
}
