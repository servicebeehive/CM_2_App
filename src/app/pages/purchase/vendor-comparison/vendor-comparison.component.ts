import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';

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
    item_id?: number;
    category_id?: number;
    // dynamic per-vendor input data keyed by vendor_id
    vendorData: { [vendorId: number]: VendorEntry };
    _searchText?: string;
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
        ToastModule,
        GlobalFilterComponent
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
    }

    private initForm(): void {
        this.filterForm = this.fb.group({
            p_project: [null],
            p_vendors: [[]]
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

    // ── Load Vendor dropdown ────────────────────────────────────────────
    private loadVendors(): void {
        this.isLoadingVendors = true;
        const payload = {
            p_returntype: 'VENDORLIST', // ⬅️ confirm with backend
            p_returnvalue: this.companyId.toString(),
            username: ''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
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
        if (!projectId) return;
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