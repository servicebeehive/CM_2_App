import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { DatePickerModule } from 'primeng/datepicker';

interface RfqRow {
    category: string;
    item: string;
    vendor: string;
    lastSubmit: string | null;
    selected: boolean;

    // raw ids for payload
    category_id?: number;
    item_id?: number;
    vendor_id?: number;
}

@Component({
    selector: 'app-rfq',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        DropdownModule,
        TableModule,
        InputTextModule,
        CheckboxModule,
        ToastModule,
        GlobalFilterComponent,
        DatePickerModule
    ],
    templateUrl: './rfq.component.html',
    styleUrl: './rfq.component.scss',
    providers: [MessageService]
})
export class RfqComponent implements OnInit {
    rfqForm!: FormGroup;
    rfqNoOptions:any[] = [];
    projectOptions: any[] = [];
    isLoadingProjects = false;

    rfqList: RfqRow[] = [];
    isLoadingItems = false;
    today:Date = new Date();
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
        this.loadSites();
    }

    private initForm(): void {
        this.rfqForm = this.fb.group({
            p_rfqno:[null],
            p_rfqdate:[this.today],
            p_site: [null]
        });
    }

    // ── Load Site dropdown ──────────────────────────────────────────────
    private loadSites(): void {
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
                console.error('Error fetching sites:', err);
                this.isLoadingProjects = false;
            }
        });
    }

    // ── On Site selection: load RFQ item rows for the table ─────────────
    onSiteChange(event: any): void {
        const siteId = event.value;
        if (!siteId) {
            this.rfqList = [];
            return;
        }
        this.loadRfqItems(siteId);
    }

    onRFQNoChange(data:any){

    }

    private loadRfqItems(siteId: number): void {
        this.isLoadingItems = true;
        const payload = {
            p_returntype: 'RFQITEMS', // ⬅️ confirm this return type name with your backend
            p_returnvalue: siteId.toString(),
            username: ''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = res.data || [];
                this.rfqList = rows.map((r) => ({
                    category: r.categoryname ?? r.category ?? '',
                    item: r.itemname ?? r.item ?? '',
                    vendor: r.suppliername ?? r.vendor ?? '',
                    lastSubmit: r.last_submit_date ?? null,
                    selected: false,
                    category_id: r.category_id ?? r.item_category_id,
                    item_id: r.item_id,
                    vendor_id: r.supplierid ?? r.vendor_id
                }));
                this.isLoadingItems = false;
            },
            error: (err) => {
                console.error('Error fetching RFQ items:', err);
                this.rfqList = [];
                this.isLoadingItems = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to load items',
                    life: 2500
                });
            }
        });
    }

    // ── Select all / individual checkbox helpers ─────────────────────────
    get allSelected(): boolean {
        return this.rfqList.length > 0 && this.rfqList.every((r) => r.selected);
    }

    toggleSelectAll(checked: boolean): void {
        this.rfqList.forEach((r) => (r.selected = checked));
    }

    get selectedCount(): number {
        return this.rfqList.filter((r) => r.selected).length;
    }

    applyGlobalFilter(){
        
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    onSubmit(): void {
        const selectedRows = this.rfqList.filter((r) => r.selected);

        if (selectedRows.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Items Selected',
                detail: 'Please select at least one item to submit RFQ.',
                life: 2500
            });
            return;
        }

        const payload = {
            p_site: this.rfqForm.get('p_site')?.value,
            p_items: selectedRows.map((r) => ({
                category_id: r.category_id,
                item_id: r.item_id,
                vendor_id: r.vendor_id
            })),
            p_loginuser: this.authService.isLogIntType()?.userid?.toString()
        };

        // ⬅️ replace with your actual RFQ submit API call
        // this.inventoryService.submitRFQ?.(payload)?.subscribe({
        //     next: (res: any) => {
        //         this.messageService.add({
        //             severity: 'success',
        //             summary: 'Success',
        //             detail: 'RFQ submitted successfully.',
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