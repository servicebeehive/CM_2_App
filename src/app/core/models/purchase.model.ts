export interface RfqRow {
    category: string;
    item: string;
    uom: string;
    buffer_stock: number;
    required_qty: number;
    available_stock: number;
    pending_qty: number;
    total_mr_qty: number;
    net_required_qty: number;
    category_id?: number | null;
    item_id?: number | null;
    mr_no?: string;
    mr_date?: string | Date | null;
    department?: string;
    requested_by?: string;
}

export interface IncludedMrRow {
    mr_no: string;
    mr_date: string | Date | null;
    department: string;
    requested_by: string;
}

export interface MrDetailData extends IncludedMrRow {
    items: RfqRow[];
}

export interface VendorInviteRow {
    category: string;
    category_id: number | null;
    selectedVendors: number[];
    availableVendors?: any[];
}