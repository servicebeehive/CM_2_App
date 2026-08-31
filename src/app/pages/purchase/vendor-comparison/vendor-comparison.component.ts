import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { WorkService } from '@/core/services/work.service';
import { ComparisonRow, VendorEntry } from '@/core/models/authmodel/work.model';
import { DatePickerModule } from 'primeng/datepicker';
import { Router } from '@angular/router';

interface VendorRef {
    vendor_id: number;
    vendor_name: string;
}
interface MaterialReqRow {
    mr_no: string;
    mf_id: number | null;
    mr_date: string | Date | null;
    department: string;
    requested_by: string;
}

@Component({
    selector: 'app-vendor-comparison',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, MultiSelectModule, TableModule, InputTextModule, InputNumberModule, DialogModule, ToastModule, DatePickerModule],
    templateUrl: './vendor-comparison.component.html',
    styleUrl: './vendor-comparison.component.scss',
    providers: [MessageService]
})
export class VendorComparisonComponent implements OnInit {
    filterForm!: FormGroup;

    projectOptions: any[] = [];

    vendorOptions: VendorRef[] = [];
    isLoadingVendors = false;

    selectedVendors: VendorRef[] = [];
    comparisonRows: ComparisonRow[] = [];
    isLoadingItems = false;
    isLoadingMrRows = false;
    itemOptions: any[] = [];
    isLoadingItemOptions = false;
    rfqNoOptions: any[] = [];
    draftOptions: any[] = [];
    vcNoOptions: any[] = [];
    isLoadingRfqNo = false;
    rfqHeader: any = null;

    showMaterialReqDialog = false;
    materialReqRows: MaterialReqRow[] = [];

    showGlobalSearch = true;
    globalFilter = '';
    companyId = '';
    attachmentFileName = '';
uploadedAttachment: File | null = null;

    evaluationCriteria: { label: string; weight: number }[] = [
    { label: 'Quoted Price', weight: 60 },
    { label: 'Quality', weight: 20 },
    { label: 'Payment Terms', weight: 10 },
    { label: 'Delivery Terms', weight: 10 }
];

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        private workService: WorkService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid;
        this.initForm();
        this.loadProjects();
        this.loadRfqNoOptions();
        this.onGetVCNo();
        this.onGetDraftNo();
    }

    private initForm(): void {
        this.filterForm = this.fb.group({
            p_rfqno: [''],
            p_draft_vcno: [''],
            p_rfqdate: [{ value: '', disabled: true }],
            p_project: [{ value: null, disabled: true }],
            p_item: [null],
            p_vcno: [''],
            p_vcdate: [{value: new Date(), disabled: true}],
            p_remarks:[''],
            p_recommendedvendor: [null]
        });
    }

    // ── Load Project dropdown ───────────────────────────────────────────
    private loadProjects(): void {
        const payload = {
            returnType: 'ACTIVEPROJECT',
            returnValue: '',
            username: '',
            option1: this.companyId.toString(),
            option2: null
        };

        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res: any) => {
                this.projectOptions = res.data || [];
            }
        });
    }

    private loadRfqNoOptions(): void {
        this.isLoadingRfqNo = true;
        const payload = {
            p_returntype: 'RFQID',
            p_username: this.companyId.toString()
        };

        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.rfqNoOptions = res.data || [];
                this.isLoadingRfqNo = false;
            },
            error: (err) => {
                console.error('Error fetching RFQ No list:', err);
                this.isLoadingRfqNo = false;
            }
        });
    }

    private onGetVCNo(){
        const payload = {
            p_returntype: 'VENDORCOMPARISONID',
            p_returnvalue: this.companyId.toString(),
            p_username: this.authService.isLogIntType()?.userid?.toString() ?? ''
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.vcNoOptions = res.data || [];
            },
            error: (err) => {
                console.error('Error fetching VC No:', err);
            }
        });
    }

    private onGetDraftNo(){
         const payload = {
            p_returntype: 'VENDORCOMPARISONIDDRAFT',
            p_returnvalue: this.companyId.toString(),
            p_username: this.authService.isLogIntType()?.userid?.toString() ?? ''
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.draftOptions = res.data || [];
            },
            error: (err) => {
                console.error('Error fetching Draft No:', err);
            }
        });
    }

    // ── On vendor selection change: add/remove vendor input columns ─────
    onVendorChange(event: any): void {
        const newSelectedIds: number[] = event.value || [];
        this.selectedVendors = this.vendorOptions.filter((v) => newSelectedIds.includes(v.vendor_id));

        // Preserve already-entered data for vendors still selected; init blank for new ones
        this.comparisonRows.forEach((row) => {
            const updated: { [vendorId: number]: VendorEntry } = {};
            this.selectedVendors.forEach((v) => {
                updated[v.vendor_id] = row.vendorData[v.vendor_id] ?? { price: null, quantity: null, paymentTerm: '' };
            });
            row.vendorData = updated;
        });
    }

onVcNoChange(event: any): void {
    const comparisonId = event.value;
    if (!comparisonId) {
        this.comparisonRows = [];
        this.selectedVendors = [];
        this.rfqHeader = null;
        return;
    }

    this.isLoadingItems = true;
    const payload = {
        comparison_id: comparisonId,
        companyid: this.companyId
    };

    this.workService.getRfqVendorComparison(payload).subscribe({
        next: (res: any) => {
            const rows: any[] = Array.isArray(res.data) ? res.data : [];
            this.isLoadingItems = false;

            if (!rows.length) {
                this.comparisonRows = [];
                this.selectedVendors = [];
                this.messageService.add({ severity: 'warn', summary: 'No comparison data found for this VC', life: 2500 });
                return;
            }

            this.buildComparisonFromApi(rows);
            // buildComparisonFromApi doesn't capture comparison_id, so add it on afterward
            this.rfqHeader.comparison_id = rows[0].comparison_id;
        },
        error: (err) => {
            this.isLoadingItems = false;
            this.messageService.add({ severity: 'error', summary: 'Failed to load comparison data', detail: err.message, life: 2500 });
        }
    });
}

onRfqNoChange(event: any): void {
    this.isLoadingItems = true;
    const payload = {
        p_returntype: "VENDORCOMPARISON",
        p_returnvalue: event.value.toString(),
        username: ''
    };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res: any) => {
            const rows: any[] = Array.isArray(res.data) ? res.data : [];
            this.isLoadingItems = false;

            if (!rows.length) {
                this.comparisonRows = [];
                this.selectedVendors = [];
                this.messageService.add({ severity: 'warn', summary: 'No comparison data found for this RFQ', life: 2500 });
                return;
            }

            this.buildComparisonFromApi(rows);
        },
         error: (err) => {
            this.isLoadingItems = false;
            this.messageService.add({ severity: 'error', summary: 'Failed to load comparison data', detail: err.message, life: 2500 });
        }
    });
}

private buildComparisonFromApi(rows: any[]): void {
    const first = rows[0];
    this.rfqHeader = {
        rfqid: first.rfqid,
        rfqno: first.rfqno,
        rfqdate: first.rfqdate,
        site_id: first.site_id,
        project_name: first.project_name
    };

    this.filterForm.patchValue(
        {
            p_rfqdate: first.rfqdate ? this.formatDisplayDate(first.rfqdate) : '',
            p_project: first.site_id ?? null
        },
        { emitEvent: false }
    );

    // Distinct vendors
    const vendorMap = new Map<number, VendorRef>();
    rows.forEach((r) => {
        if (r.vendorid != null && !vendorMap.has(r.vendorid)) {
            vendorMap.set(r.vendorid, { vendor_id: r.vendorid, vendor_name: r.suppliername });
        }
    });
    this.selectedVendors = Array.from(vendorMap.values());

    // Distinct items, grouped with vendor-wise data
    const itemMap = new Map<number, ComparisonRow>();
    rows.forEach((r) => {
        if (!itemMap.has(r.itemid)) {
            itemMap.set(r.itemid, {
                category: r.categoryname ?? '',
                item: r.itemname ?? '',
                required_qty: Number(r.required_qty ?? 0),
                item_id: r.itemid,
                category_id: r.itemcategoryid,
                uom_id: r.uomid,
                uom_name: r.uomname,
                weightage: 0, // baad me evenly distribute karenge
                vendorData: {}
            } as ComparisonRow);
        }

        const row = itemMap.get(r.itemid)!;
        row.vendorData[r.vendorid] = {
            price: r.quoted_price ?? null,
            quantity: r.quoted_qty ?? null,
            paymentTerm: r.payment_terms_days != null ? String(r.payment_terms_days) : '',
            quality_score: r.quality_score ?? null,
            payment_terms_days: r.payment_terms_days ?? null,
            delivery_terms_days: r.delivery_terms_days ?? null,
            total_score: r.total_score ?? null,
            vendor_rank: r.vendor_rank ?? null,
            is_recommended: r.is_recommended ?? false,
            remarks: r.remarks ?? ''
        };
    });

    this.comparisonRows = Array.from(itemMap.values()).map((row) => {
        this.selectedVendors.forEach((v) => {
            if (!row.vendorData[v.vendor_id]) {
                row.vendorData[v.vendor_id] = { price: null, quantity: null, paymentTerm: '' };
            }
        });
        return row;
    });

    // Row-wise weightage evenly distribute karo (equal split, editable rahega)
    const evenWeight = this.comparisonRows.length ? Math.round((100 / this.comparisonRows.length) * 100) / 100 : 0;
    this.comparisonRows.forEach((row) => (row.weightage = evenWeight));
}

deleteDraftItem(item: any, event: Event): void {
    event.stopPropagation();
    // Implement the logic to delete the draft item here
    this.messageService.add({ severity: 'info', summary: 'Delete Draft Item', detail: `Draft item ${item.mf_no} deleted (not really, just a placeholder).`, life: 2500 });
}

   get evaluationCriteriaTotal(): number {
    return this.evaluationCriteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
}

onAttachmentSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadedAttachment = input.files[0];
    this.attachmentFileName = input.files[0].name;
}

removeAttachment(): void {
    this.uploadedAttachment = null;
    this.attachmentFileName = '';
}

get rankedVendors(): { vendor: VendorRef; rank: number; total: number }[] {
    return this.selectedVendors
        .map((v) => ({ vendor: v, rank: this.getVendorRank(v.vendor_id), total: this.getVendorTotal(v.vendor_id) }))
        .sort((a, b) => a.rank - b.rank);
}

get bestOverallVendor(): VendorRef | null {
    return this.rankedVendors[0]?.vendor ?? null;
}

get secondBestVendor(): VendorRef | null {
    return this.rankedVendors[1]?.vendor ?? null;
}

get thirdBestVendor(): VendorRef | null {
    return this.rankedVendors[2]?.vendor ?? null;
}

get vendorQuotedTotals(): { vendorId: number; vendorName: string; total: number }[] {
    return this.selectedVendors.map((v) => {
        const total = this.comparisonRows.reduce((sum, row) => sum + (Number(row.vendorData[v.vendor_id]?.price) || 0), 0);
        return { vendorId: v.vendor_id, vendorName: v.vendor_name, total };
    });
}

get lowestQuotedVendor(): VendorRef | null {
    if (!this.vendorQuotedTotals.length) return null;
    const min = [...this.vendorQuotedTotals].sort((a, b) => a.total - b.total)[0];
    return this.selectedVendors.find((v) => v.vendor_id === min.vendorId) ?? null;
}

    private formatDisplayDate(value: string | Date): string {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const day = `${date.getDate()}`.padStart(2, '0');
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    get totalRequestedQty(): number {
        return this.comparisonRows.reduce((sum, row) => sum + (Number(row.required_qty) || 0), 0);
    }

    get totalVisibleItems(): number {
        return this.filteredRows.length;
    }

    get totalVisibleRequestedQty(): number {
        return this.filteredRows.reduce((sum, row) => sum + (Number(row.required_qty) || 0), 0);
    }

    openMaterialReqDialog(): void {
         const rfqId = this.filterForm.get('p_rfqno')?.value;
    if (!rfqId) {
        this.messageService.add({ severity: 'warn', summary: 'Select an RFQ first', life: 2500 });
        return;
    }

    this.showMaterialReqDialog = true;
    this.loadMaterialReqRows(rfqId);
    }

    private loadMaterialReqRows(rfqId: number): void {
    this.isLoadingMrRows = true;
    const payload = {
        p_returntype: 'PROJECTRFQ4MR',
        p_returnvalue: rfqId.toString(),
        p_username: this.authService.isLogIntType()?.userid?.toString() ?? ''
    };

    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res: any) => {
            const rows: any[] = Array.isArray(res.data) ? res.data : [];
            const grouped = new Map<string, any>();

            rows.forEach((row: any) => {
                const mrNo = row.mr_no ?? row.mf_no ?? '';
                if (!mrNo || grouped.has(mrNo)) return;
                grouped.set(mrNo, {
                    mr_no: mrNo,
                    mf_id: row.mf_id ?? row.mrid ?? row.mr_id ?? null,
                    mr_date: row.mr_date ?? row.mf_date ?? null,
                    department: row.departmentname ?? row.department ?? row.department_name ?? '',
                    requested_by: row.requester ?? row.requested_by ?? ''
                });
            });

            this.materialReqRows = Array.from(grouped.values());
            this.isLoadingMrRows = false;
        },
        error: () => {
            this.materialReqRows = [];
            this.isLoadingMrRows = false;
            this.messageService.add({
                severity: 'error',
                summary: 'Failed to load material requisitions',
                life: 2500
            });
        }
    });
}

openMaterialRequisition(row: any): void {
    this.showMaterialReqDialog = false;
    this.router.navigate(['/layout/purchase/material-requisition'], {
        queryParams: { mfNo: row.mr_no, mfId: row.mf_id ?? null, fromComparisonView: true }
    });
}

    get filteredRows(): ComparisonRow[] {
        const value = this.globalFilter?.toLowerCase().trim();
        if (!value) return this.comparisonRows;
        return this.comparisonRows.filter((r) => r.category.toLowerCase().includes(value) || r.item.toLowerCase().includes(value));
    }

    // Ek row ke andar, ek vendor ka score nikaalta hai (price + quality + payment ka weighted combo)
getVendorScore(row: ComparisonRow, vendorId: number): number {
    const data = row.vendorData[vendorId];
    if (!data || data.price == null) return 0;

    // Is item ke liye sabse kam price nikaalo (best price = 100 score)
    const prices = this.selectedVendors.map((v) => row.vendorData[v.vendor_id]?.price).filter((p): p is number => p != null && p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;

    const priceScore = data.price && minPrice ? (minPrice / data.price) * 100 : 0;
    const qualityScore = data.quality_score != null ? (Number(data.quality_score) / 10) * 100 : 0;

    const paymentDays = data.payment_terms_days ?? (data.paymentTerm ? Number(data.paymentTerm) : 0);
    const maxPaymentDays = Math.max(
        ...this.selectedVendors.map((v) => {
            const d = row.vendorData[v.vendor_id];
            return d?.payment_terms_days ?? (d?.paymentTerm ? Number(d.paymentTerm) : 0) ?? 0;
        }),
        1
    );
    const paymentScore = maxPaymentDays ? (paymentDays / maxPaymentDays) * 100 : 0;

    // Weights: Price 50%, Quality 30%, Payment 20% — chaho to inputs se configurable bana sakte ho
    const score = priceScore * 0.5 + qualityScore * 0.3 + paymentScore * 0.2;
    return Math.round(score * 100) / 100;
}

// Har vendor ka overall weighted total score (saare items ke weightage * score ka sum)
get vendorWeightedTotals(): { vendorId: number; total: number }[] {
    return this.selectedVendors.map((v) => {
        const total = this.comparisonRows.reduce((sum, row) => {
            const score = this.getVendorScore(row, v.vendor_id);
            const weight = Number(row.weightage) || 0;
            return sum + (score * weight) / 100;
        }, 0);
        return { vendorId: v.vendor_id, total: Math.round(total * 100) / 100 };
    });
}

// Rank nikaalne ke liye — sabse zyaada total score wale ko Rank 1
get vendorRanks(): Record<number, number> {
    const totals = [...this.vendorWeightedTotals].sort((a, b) => b.total - a.total);
    const ranks: Record<number, number> = {};
    totals.forEach((t, i) => (ranks[t.vendorId] = i + 1));
    return ranks;
}

getVendorTotal(vendorId: number): number {
    return this.vendorWeightedTotals.find((t) => t.vendorId === vendorId)?.total ?? 0;
}

getVendorRank(vendorId: number): number {
    return this.vendorRanks[vendorId] ?? 0;
}

 onSubmit(): void {
    this.saveComparison('SUBMIT');
}

onSaveDraft(): void {
    this.saveComparison('DRAFT');
}

private saveComparison(operationType: 'SUBMIT' | 'DRAFT'): void {
    if (!this.rfqHeader) {
        this.messageService.add({ severity: 'warn', summary: 'Select an RFQ first', life: 2500 });
        return;
    }
    if (this.selectedVendors.length === 0) {
        this.messageService.add({ severity: 'warn', summary: 'No vendors found for this RFQ', life: 2500 });
        return;
    }

    const comparisonJson: any[] = [];

    this.comparisonRows.forEach((row) => {
        this.selectedVendors.forEach((v) => {
            const data = row.vendorData[v.vendor_id];
            comparisonJson.push({
                comparison_id: this.rfqHeader.comparison_id ?? null, // null = new record, backend inserts; else updates existing draft/comparison
                rfqid: this.rfqHeader.rfqid,
                rfqno: this.rfqHeader.rfqno,
                rfqdate: this.rfqHeader.rfqdate,
                site_id: this.rfqHeader.site_id,
                project_name: this.rfqHeader.project_name,

                vendorid: v.vendor_id,
                suppliername: v.vendor_name,

                itemid: row.item_id,
                itemname: row.item,
                uomid: row.uom_id ?? null,
                uomname: row.uom_name ?? '',
                itemcategoryid: row.category_id,
                categoryname: row.category,
                required_qty: row.required_qty,

                quoted_price: data?.price ?? 0,
                quoted_qty: data?.quantity ?? 0,

                quality_score: data?.quality_score ?? 0,
                payment_terms_days: data?.payment_terms_days ?? (data?.paymentTerm ? Number(data.paymentTerm) || 0 : 0),
                delivery_terms_days: data?.delivery_terms_days ?? 0,

                price_weightage: 0,
                quality_weightage: 0,
                payment_weightage: 0,
                delivery_weightage: 0,

                price_score: 0,
                quality_weighted_score: 0,
                payment_score: 0,
                delivery_score: 0,
                total_score: data?.total_score ?? 0,

                vendor_rank: data?.vendor_rank ?? 0,
                is_recommended: data?.is_recommended ?? false,
                remarks: data?.remarks ?? ''
            });
        });
    });

    const payload = {
        p_operationtype: operationType,
        p_username: this.authService.isLogIntType()?.userid?.toString() ?? '',
        p_comparison_json: comparisonJson
    };

    this.workService.upsertRfqVendorComparison(payload).subscribe({
        next: (res: any) => this.handleSaveSuccess(res, operationType),
        error: (err: any) => {
            console.error(err);
            this.messageService.add({
                severity: 'error',
                summary: operationType === 'DRAFT' ? 'Draft Save Failed' : 'Submit Failed',
                detail: err?.error?.error ?? 'Something went wrong.',
                life: 3000
            });
        }
    });
}

private handleSaveSuccess(res: any, operationType: 'SUBMIT' | 'DRAFT'): void {
    this.messageService.add({
        severity: 'success',
        summary: res.data.message,
        life: 2500
    });

    if (!res?.comparison_id) return;

  const isStillDraft = res.data.comparison_status === 'DRAFT';

    if (isStillDraft) {
        this.patchAfterDraftReload(res.data.comparison_id);
    } else {
        this.patchAfterVcReload(res.data.comparison_id);
    }
}

private patchAfterDraftReload(comparisonId: number): void {
    const payload = {
        p_returntype: 'VENDORCOMPARISONIDDRAFT',
        p_returnvalue: this.companyId.toString(),
        p_username: this.authService.isLogIntType()?.userid?.toString() ?? ''
    };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res: any) => {
            this.draftOptions = res.data || [];
            this.filterForm.patchValue({ p_draft_vcno: comparisonId }, { emitEvent: false });
        },
        error: (err) => console.error('Error fetching Draft No:', err)
    });
}

private patchAfterVcReload(comparisonId: number): void {
    const payload = {
        p_returntype: 'VENDORCOMPARISONID',
        p_returnvalue: this.companyId.toString(),
        p_username: this.authService.isLogIntType()?.userid?.toString() ?? ''
    };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res: any) => {
            this.vcNoOptions = res.data || [];
            this.filterForm.patchValue({ p_vcno: comparisonId, p_draft_vcno: '' }, { emitEvent: false });
            // finalized comparisons no longer belong in the drafts list
            this.draftOptions = this.draftOptions.filter((d) => d.comparison_id !== comparisonId);
        },
        error: (err) => console.error('Error fetching VC No:', err)
    });
}

onReset(){
    this.filterForm.reset();
    this.filterForm.patchValue({ p_vcdate: new Date() });
    this.selectedVendors = [];
    this.comparisonRows = [];
    this.rfqHeader = null;
    this.globalFilter = '';
}
}
