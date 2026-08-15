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

interface VendorRef {
    vendor_id: number;
    vendor_name: string;
}

interface VendorEntry {
    price: number | null;
    quantity: number | null;
    paymentTerm: string;
}

interface ComparisonRow {
    category: string;
    item: string;
    required_qty: number;
    item_id?: number;
    category_id?: number;
    // dynamic per-vendor input data keyed by vendor_id
    vendorData: { [vendorId: number]: VendorEntry };
    _searchText?: string;
}

interface MaterialReqRow {
    mr_no: string;
    mr_date: string | Date | null;
    department: string;
    requested_by: string;
    item_count: number;
}

@Component({
    selector: 'app-vendor-comparison',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        DropdownModule,
        MultiSelectModule,
        TableModule,
        InputTextModule,
        InputNumberModule,
        DialogModule,
        ToastModule
    ],
    templateUrl: './vendor-comparison.component.html',
    styleUrl: './vendor-comparison.component.scss',
    providers: [MessageService]
})
export class VendorComparisonComponent implements OnInit {
    filterForm!: FormGroup;

    projectOptions: any[] = [];
    isLoadingProjects = false;

    vendorOptions: VendorRef[] = [];
    isLoadingVendors = false;

    selectedVendors: VendorRef[] = [];
    comparisonRows: ComparisonRow[] = [];
    isLoadingItems = false;
    isLoadingMrRows = false;
    itemOptions: any[] = [];
isLoadingItemOptions = false;
rfqNoOptions: any[] = [];
isLoadingRfqNo = false;

    showMaterialReqDialog = false;
    materialReqRows: MaterialReqRow[] = [];

    showGlobalSearch = true;
    globalFilter = '';

    companyId = '';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid;
         this.initForm();
    this.loadProjects();
    this.loadVendors();
    this.loadItems();
    this.loadRfqNoOptions();
    }

    private initForm(): void {
        this.filterForm = this.fb.group({
           p_rfqno: [''],
       p_rfqdate: [{ value: '', disabled: true }],
        p_project: [null],
        p_item: [null]
        });
    }

    // ── Load Project dropdown ───────────────────────────────────────────
    private loadProjects(): void {
        this.isLoadingProjects = true;
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
                this.isLoadingProjects = false;
            },
            error: (err) => {
                console.error('Error fetching projects:', err);
                this.isLoadingProjects = false;
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

private loadItems(): void {
    this.isLoadingItemOptions = true;
    const payload = {
        p_returntype: 'ITEMLIST', // ⬅️ confirm exact return type with backend
        p_returnvalue: this.companyId.toString(),
        username: ''
    };

    this.inventoryService.getdropdowndetails(payload).subscribe({
        next: (res: any) => {
            this.itemOptions = (res.data || []).map((i: any) => ({
                itemid: i.itemid ?? i.item_id,
                itemname: i.itemname ?? i.item_name
            }));
            this.isLoadingItemOptions = false;
        },
        error: (err) => {
            console.error('Error fetching items:', err);
            this.isLoadingItemOptions = false;
        }
    });
}

    // ── Load Vendor dropdown ────────────────────────────────────────────
    private loadVendors(): void {
        this.isLoadingVendors = true;
        const payload = {
            p_returntype: 'VENDORLIST', // ⬅️ confirm with backend
            p_returnvalue: this.companyId.toString(),
            username: ''
        };

        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.vendorOptions = (res.data || []).map((v: any) => ({
                    vendor_id: v.supplierid ?? v.vendor_id,
                    vendor_name: v.suppliername ?? v.vendor_name
                }));
                this.isLoadingVendors = false;
            },
            error: (err) => {
                console.error('Error fetching vendors:', err);
                this.isLoadingVendors = false;
            }
        });
    }

    // ── On project select: load item rows for the table ─────────────────
    onProjectChange(event: any): void {
        const projectId = event.value;
        this.comparisonRows = [];
        this.materialReqRows = [];
        if (!projectId) {
            this.filterForm.patchValue({ p_rfqno: '', p_rfqdate: '' }, { emitEvent: false });
            return;
        }
        this.loadItemsForProject(projectId);
    }

    private loadItemsForProject(projectId: number): void {
        this.isLoadingItems = true;
        const payload = {
            p_returntype: 'MFAPPROVED', // ⬅️ confirm the correct return type for "items for this project"
            p_returnvalue: projectId.toString(),
            username: ''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = res.data || [];
                this.comparisonRows = rows.map((r) => this.buildEmptyRow(r));
                this.patchRfqHeader(rows);
                this.isLoadingItems = false;
            },
            error: (err) => {
                console.error('Error fetching items for project:', err);
                this.comparisonRows = [];
                this.isLoadingItems = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to load items',
                    life: 2500
                });
            }
        });
    }

    private buildEmptyRow(r: any): ComparisonRow {
        const row: ComparisonRow = {
            category: r.categoryname ?? r.category ?? '',
            item: r.itemname ?? r.item ?? '',
            required_qty: Number(r.required_qty ?? r.forecast_qty ?? 0),
            item_id: r.item_id,
            category_id: r.item_category_id ?? r.category_id,
            vendorData: {}
        };
        this.selectedVendors.forEach((v) => {
            row.vendorData[v.vendor_id] = { price: null, quantity: null, paymentTerm: '' };
        });
        return row;
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

onRfqNoChange(event: any): void {
    const rfq = this.rfqNoOptions.find((r) => r.rfq_id === event.value);
    if (!rfq) return;

    this.filterForm.patchValue(
        { p_rfqdate: this.formatDisplayDate(rfq.rfq_date ?? rfq.rfqdate) },
        { emitEvent: false }
    );

    const invitedVendorIds: number[] = rfq.vendor_ids ?? [];
    this.selectedVendors = this.vendorOptions.filter((v) => invitedVendorIds.includes(v.vendor_id));
    this.filterForm.get('p_vendors')?.setValue(invitedVendorIds, { emitEvent: false });

    this.comparisonRows.forEach((row) => {
        const updated: { [vendorId: number]: any } = {};
        this.selectedVendors.forEach((v) => {
            updated[v.vendor_id] = row.vendorData[v.vendor_id] ?? { price: null, quantity: null, paymentTerm: '' };
        });
        row.vendorData = updated;
    });

    if (rfq.project_id) {
        this.filterForm.patchValue({ p_project: rfq.project_id }, { emitEvent: false });
        this.loadItemsForProject(rfq.project_id);
    }
}

    private patchRfqHeader(rows: any[]): void {
        if (!rows.length) {
            this.filterForm.patchValue({ p_rfqno: '', p_rfqdate: '' }, { emitEvent: false });
            return;
        }

        const first = rows[0];
        const rfqNo = first.rfq_no ?? first.rfqno ?? first.mf_no ?? '';
        const dateSource = first.rfq_date ?? first.rfqdate ?? first.mf_date ?? null;
        const rfqDate = dateSource ? this.formatDisplayDate(dateSource) : '';

        this.filterForm.patchValue(
            {
                p_rfqno: rfqNo,
                p_rfqdate: rfqDate
            },
            { emitEvent: false }
        );
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
        const projectId = this.filterForm.get('p_project')?.value;
        if (!projectId) {
            this.messageService.add({ severity: 'warn', summary: 'Select a site first', life: 2500 });
            return;
        }

        this.showMaterialReqDialog = true;
        this.loadMaterialReqRows(projectId);
    }

    private loadMaterialReqRows(projectId: number): void {
        this.isLoadingMrRows = true;
        const payload = {
            p_returntype: 'MFAPPROVED',
            p_returnvalue: projectId.toString(),
            username: ''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = res.data || [];
                const grouped = new Map<string, MaterialReqRow>();

                rows.forEach((r: any) => {
                    const mrNo = r.mr_no ?? r.mf_no ?? r.requisition_no ?? '—';
                    const key = `${mrNo}__${r.mr_date ?? r.mf_date ?? ''}`;

                    if (!grouped.has(key)) {
                        grouped.set(key, {
                            mr_no: mrNo,
                            mr_date: r.mr_date ?? r.mf_date ?? null,
                            department: r.departmentname ?? r.department ?? '—',
                            requested_by: r.requested_by ?? r.user_name ?? r.requestedby ?? '—',
                            item_count: 0
                        });
                    }

                    const current = grouped.get(key)!;
                    current.item_count += 1;
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

    // ── Global search ─────────────────────────────────────────────────────
    applyGlobalFilter(): void {
        // filteredRows getter below reacts automatically since it reads globalFilter
    }

    clearGlobalFilter(input: HTMLInputElement): void {
        input.value = '';
        this.globalFilter = '';
    }

    get filteredRows(): ComparisonRow[] {
        const value = this.globalFilter?.toLowerCase().trim();
        if (!value) return this.comparisonRows;
        return this.comparisonRows.filter(
            (r) => r.category.toLowerCase().includes(value) || r.item.toLowerCase().includes(value)
        );
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    onSubmit(): void {
        const projectId = this.filterForm.get('p_project')?.value;

        if (!projectId) {
            this.messageService.add({ severity: 'warn', summary: 'Select a site first', life: 2500 });
            return;
        }
        if (this.selectedVendors.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Select at least one vendor', life: 2500 });
            return;
        }

        const items = this.comparisonRows.map((row) => ({
            item_id: row.item_id,
            category_id: row.category_id,
            vendors: this.selectedVendors.map((v) => ({
                vendor_id: v.vendor_id,
                price: row.vendorData[v.vendor_id]?.price ?? 0,
                quantity: row.vendorData[v.vendor_id]?.quantity ?? 0,
                payment_term: row.vendorData[v.vendor_id]?.paymentTerm ?? ''
            }))
        }));

        const payload = {
            p_project_id: projectId,
            p_items: items,
            p_loginuser: this.authService.isLogIntType()?.userid?.toString()
        };

        // // ⬅️ replace with your actual vendor comparison submit API
        // this.inventoryService.submitVendorComparison?.(payload)?.subscribe({
        //     next: () => {
        //         this.messageService.add({
        //             severity: 'success',
        //             summary: 'Success',
        //             detail: 'Vendor comparison data submitted.',
        //             life: 2500
        //         });
        //     },
        //     error: (err: any) => {
        //         console.error(err);
        //         this.messageService.add({
        //             severity: 'error',
        //             summary: 'Submit Failed',
        //             detail: err?.error?.error ?? 'Something went wrong.',
        //             life: 3000
        //         });
        //     }
        // });
    }
}