import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';

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
        ToastModule,
        DatePickerModule,
        TextareaModule,
        DialogModule,
        MultiSelectModule
    ],
    templateUrl: './rfq.component.html',
    styleUrl: './rfq.component.scss',
    providers: [MessageService]
})
export class RfqComponent implements OnInit {
    rfqForm!: FormGroup;
    rfqNoOptions: any[] = [];
    draftRfqOptions: any[] = [];
    projectOptions: any[] = [];
    itemOptions: any[] = [];
    vendorOptions: any[] = [];
    statusOptions: { label: string; value: string }[] = [
        { label: 'Draft', value: 'Draft' },
        { label: 'Submitted', value: 'Submitted' }
    ];
    categoryOptions: { label: string; value: string }[] = [];
    isLoadingProjects = false;

    rfqList: RfqRow[] = [];
    includedMrList: IncludedMrRow[] = [];
    vendorInviteRows: VendorInviteRow[] = [];
    mrDetailsMap: Record<string, MrDetailData> = {};

    showMrDialog = false;
    selectedMrDetail: MrDetailData | null = null;
    showMaterialReqDialog = false;
    attachmentFileName = '';

    isLoadingItems = false;
    today: Date = new Date();
    companyId = '';
    userId = '';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid?.toString() ?? '';
        this.userId = this.authService.isLogIntType()?.userid?.toString() ?? '';
        this.initForm();
        this.loadSites();
        this.loadRfqNumberOptions();
        this.loadDraftList();
        this.loadItemOptions();
        this.loadVendorOptions();
        this.ensureDefaultVendorInviteRows();
    }

    private initForm(): void {
        this.rfqForm = this.fb.group({
            p_rfq_id: [null],
            p_rfqno: [null],
            p_draft_rfqno: [null],
            p_rfqdate: [this.today, Validators.required],
            p_site: [null, Validators.required],
            p_rfq_desc: [''],
            p_remarks: [''],
            p_status: ['Draft'],
            p_item: [null],
            p_attachment: [null]
        });
    }

    createDropdownPayload(returnType: string, retrunValue: string | null, userName: string| null): any {
        return {
            returnType: returnType,
            returnValue: retrunValue?? '',
            username: userName?? '',
            option1: this.companyId.toString(),
            option2: null
        };
    }

     loadSites(): void {
        this.isLoadingProjects = true;
        const payload = this.createDropdownPayload('ACTIVEPROJECT', null,null);

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

    private loadRfqNumberOptions(): void {
        const payload = {
            p_returntype: 'RFQNUMBER',
            p_returnvalue: this.companyId,
            p_username: this.userId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.rfqNoOptions = res.data || [];
            },
            error: () => {
                this.rfqNoOptions = [];
            }
        });
    }

    private loadDraftList(): void {
        const payload = {
            p_returntype: 'RFQDRAFT',
            p_returnvalue: this.companyId,
            p_username: this.userId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.draftRfqOptions = res.data || [];
            },
            error: () => {
                this.draftRfqOptions = [];
            }
        });
    }

    private loadItemOptions(): void {
        const payload = {
            p_returntype: 'ITEMALL',
            p_returnvalue: this.companyId,
            p_username: this.userId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.itemOptions = res.data || [];
            },
            error: () => {
                this.itemOptions = [];
            }
        });
    }

    private loadVendorOptions(): void {
        const payload = {
            p_returntype: 'SUPPLIERMASTER',
            p_returnvalue: this.companyId,
            p_username: this.userId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.vendorOptions = res.data || [];
            },
            error: () => {
                this.vendorOptions = [];
            }
        });
    }

    onSiteChange(event: any): void {
        const siteId = event.value;
        if (!siteId) {
            this.rfqList = [];
            this.includedMrList = [];
            this.mrDetailsMap = {};
            this.rebuildVendorInviteRows();
            return;
        }
        this.loadRfqItems(siteId);
    }

    onRFQNoChange(data: any): void {
        const selected = this.rfqNoOptions.find((r: any) => r.rfq_id === data.value);
        if (!selected) return;

        this.rfqForm.patchValue(
            {
                p_rfq_id: selected.rfq_id ?? null,
                p_rfqno: selected.rfq_id ?? null,
                p_rfqdate: selected.rfq_date ? new Date(selected.rfq_date) : this.today,
                p_site: selected.project_id ?? null,
                p_rfq_desc: selected.rfq_desc ?? '',
                p_remarks: selected.remarks ?? '',
                p_status: selected.status ?? 'Draft'
            },
            { emitEvent: false }
        );

        if (selected.project_id) {
            this.loadRfqItems(selected.project_id);
        }
    }

    private loadRfqItems(siteId: number): void {
        this.isLoadingItems = true;
        const payload = {
            p_returntype: 'PROJECTRFQ',
            p_returnvalue: siteId.toString(),
            p_username: this.userId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = res.data || [];
                this.rfqList = rows.map((r) => ({
                    category: r.categoryname ?? r.category ?? '',
                    item: r.itemname ?? r.item ?? '',
                    uom: r.uomname ?? r.uom ?? '',
                    buffer_stock: Number(r.buffer_stock ?? 0),
                    required_qty: Number(r.forecast_qty ?? r.required_qty ?? 0),
                    available_stock: Number(r.available_stock ?? 0),
                    pending_qty: Number(r.pending_qty ?? 0),
                    total_mr_qty: Number(r.total_mr_qty ?? r.required_qty ?? 0),
                    net_required_qty: Number(r.procure_qty ?? r.net_required_qty ?? 0),
                    category_id: r.category_id ?? r.item_category_id ?? null,
                    item_id: r.item_id ?? null,
                    mr_no: r.mr_no ?? r.mf_no ?? '',
                    mr_date: r.mr_date ?? r.mf_date ?? null,
                    department: r.departmentname ?? r.department ?? '',
                    requested_by: r.requested_by ?? r.user_name ?? ''
                }));

                this.buildIncludedMrData();
                this.rebuildVendorInviteRows();
                this.isLoadingItems = false;
            },
            error: (err) => {
                console.error('Error fetching RFQ items:', err);
                this.rfqList = [];
                this.includedMrList = [];
                this.mrDetailsMap = {};
                this.rebuildVendorInviteRows();
                this.isLoadingItems = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to load items',
                    life: 2500
                });
            }
        });
    }

    onItemChange(event: any): void {
        const selectedItemId = event.value;
        if (!selectedItemId) return;

        const payload = {
            p_returntype: 'ITEMWISE',
            p_returnvalue: selectedItemId.toString(),
            p_username: this.userId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const detail = Array.isArray(res.data) ? res.data[0] : res.data;
                if (!detail) return;

                const alreadyAdded = this.rfqList.some((r) => r.item_id === detail.itemid);
                if (alreadyAdded) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Duplicate Item',
                        detail: `${detail.itemname} is already added.`,
                        life: 2500
                    });
                    this.rfqForm.get('p_item')?.setValue(null, { emitEvent: false });
                    return;
                }

                this.rfqList = [
                    ...this.rfqList,
                    {
                        category: detail.item_category ?? '',
                        item: detail.itemname ?? '',
                        uom: detail.uomname ?? '',
                        buffer_stock: Number(detail.buffer_stock ?? 0),
                        required_qty: Number(detail.forecast_qty ?? 0),
                        available_stock: Number(detail.currentstock ?? 0),
                        pending_qty: Number(detail.pending_qty ?? 0),
                        total_mr_qty: Number(detail.total_mr_qty ?? detail.forecast_qty ?? 0),
                        net_required_qty: Number(detail.procure_qty ?? 0),
                        category_id: detail.categoryid ?? null,
                        item_id: detail.itemid ?? null,
                        mr_no: '',
                        mr_date: null,
                        department: '',
                        requested_by: ''
                    }
                ];

                this.rebuildVendorInviteRows();
                this.rfqForm.get('p_item')?.setValue(null, { emitEvent: false });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Item load failed',
                    detail: 'Unable to fetch item details.',
                    life: 2500
                });
            }
        });
    }

    private buildIncludedMrData(): void {
        const grouped = new Map<string, MrDetailData>();

        this.rfqList.forEach((row) => {
            if (!row.mr_no) return;
            const key = row.mr_no;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    mr_no: row.mr_no,
                    mr_date: row.mr_date ?? null,
                    department: row.department ?? '',
                    requested_by: row.requested_by ?? '',
                    items: []
                });
            }
            grouped.get(key)?.items.push(row);
        });

        this.includedMrList = Array.from(grouped.values()).map((x) => ({
            mr_no: x.mr_no,
            mr_date: x.mr_date,
            department: x.department,
            requested_by: x.requested_by
        }));

        this.mrDetailsMap = {};
        grouped.forEach((value, key) => {
            this.mrDetailsMap[key] = value;
        });
    }

onVendorCategoryChange(rowIndex: number): void {
    const row = this.vendorInviteRows[rowIndex];
    row.selectedVendors = [];
    row.availableVendors = [];

    if (!row.category) return;

    const payload = {
        p_returntype: 'CATEGORYVENDOR',
        p_returnvalue: row.category,
        p_username: this.userId
    };

    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res: any) => {
            row.availableVendors = res.data || [];
        },
        error: () => {
            row.availableVendors = [];
            this.messageService.add({
                severity: 'error',
                summary: 'Vendor load failed',
                detail: 'Unable to fetch vendors for the selected category.',
                life: 2500
            });
        }
    });
}

getAvailableCategoryOptions(currentIndex: number): { label: string; value: string }[] {
    const pickedElsewhere = this.vendorInviteRows.filter((_, i) => i !== currentIndex).map((r) => r.category).filter((c) => !!c);
    return this.categoryOptions.filter((opt) => !pickedElsewhere.includes(opt.value));
}

    openMrDetail(row: IncludedMrRow): void {
        this.selectedMrDetail = this.mrDetailsMap[row.mr_no] ?? {
            ...row,
            items: []
        };
        this.showMrDialog = true;
    }

    private rebuildVendorInviteRows(): void {
        const previousSelection = new Map<string, number[]>();
        this.vendorInviteRows.forEach((row) => previousSelection.set(row.category, row.selectedVendors));

        const categories = Array.from(new Set(this.rfqList.map((r) => r.category).filter((x) => !!x)));
        this.categoryOptions = categories.map((category) => ({ label: category, value: category }));

        if (!categories.length) {
            this.ensureDefaultVendorInviteRows();
            return;
        }

        this.vendorInviteRows = categories.map((category) => ({
            category,
            selectedVendors: previousSelection.get(category) ?? []
        }));
    }

    private ensureDefaultVendorInviteRows(): void {
        if (this.vendorInviteRows.length === 0) {
            this.vendorInviteRows = [{ category: '', selectedVendors: [] }];
        }
    }

    addVendorInviteRow(): void {
        this.vendorInviteRows = [...this.vendorInviteRows, { category: '', selectedVendors: [] }];
    }

    removeVendorInviteRow(index: number): void {
        if (this.vendorInviteRows.length <= 1) {
            return;
        }
        this.vendorInviteRows = this.vendorInviteRows.filter((_, i) => i !== index);
    }

    openMaterialReqDialog(): void {
        this.showMaterialReqDialog = true;
    }

    onDraftChange(event: any): void {
        const selected = this.draftRfqOptions.find((d: any) => d.rfq_id === event.value);
        if (!selected) return;

        const payload = {
            p_returntype: 'RFQDETAILS',
            p_returnvalue: selected.rfq_no,
            p_username: this.userId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = res.data || [];
                if (!rows.length) return;

                const header = rows[0];
                this.rfqForm.patchValue(
                    {
                        p_rfq_id: header.rfq_id ?? null,
                        p_rfqno: header.rfq_id ?? null,
                        p_draft_rfqno: header.rfq_id ?? null,
                        p_rfqdate: header.rfq_date ? new Date(header.rfq_date) : this.today,
                        p_site: header.project_id ?? null,
                        p_rfq_desc: header.rfq_desc ?? '',
                        p_remarks: header.remarks ?? '',
                        p_status: header.status ?? 'Draft'
                    },
                    { emitEvent: false }
                );

                this.rfqList = rows.map((r) => ({
                    category: r.categoryname ?? r.category ?? '',
                    item: r.itemname ?? r.item ?? '',
                    uom: r.uomname ?? r.uom ?? '',
                    buffer_stock: Number(r.buffer_stock ?? 0),
                    required_qty: Number(r.required_qty ?? 0),
                    available_stock: Number(r.available_stock ?? 0),
                    pending_qty: Number(r.pending_qty ?? 0),
                    total_mr_qty: Number(r.total_mr_qty ?? r.required_qty ?? 0),
                    net_required_qty: Number(r.net_required_qty ?? 0),
                    category_id: r.category_id ?? r.item_category_id ?? null,
                    item_id: r.item_id ?? null,
                    mr_no: r.mr_no ?? r.mf_no ?? '',
                    mr_date: r.mr_date ?? null,
                    department: r.departmentname ?? r.department ?? '',
                    requested_by: r.requested_by ?? r.user_name ?? ''
                }));

                this.buildIncludedMrData();
                this.rebuildVendorInviteRows();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Draft load failed',
                    detail: 'Unable to load draft RFQ details.',
                    life: 2500
                });
            }
        });
    }

    submitDraft(): void {
        this.rfqForm.patchValue({ p_status: 'Draft' });
        this.messageService.add({
            severity: 'success',
            summary: 'Draft saved',
            detail: 'RFQ draft details are staged.',
            life: 2200
        });
    }

    onAttachmentSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        this.attachmentFileName = file?.name ?? '';
        this.rfqForm.patchValue({ p_attachment: file });
    }

    onReset(): void {
        this.rfqForm.reset({
            p_rfq_id: null,
            p_rfqno: null,
            p_draft_rfqno: null,
            p_rfqdate: this.today,
            p_site: null,
            p_rfq_desc: '',
            p_remarks: '',
            p_status: 'Draft',
            p_item: null,
            p_attachment: null
        });
        this.attachmentFileName = '';
        this.rfqList = [];
        this.includedMrList = [];
        this.vendorInviteRows = [];
        this.categoryOptions = [];
        this.ensureDefaultVendorInviteRows();
        this.mrDetailsMap = {};
    }

    onSubmit(): void {
        if (this.rfqForm.invalid || this.rfqList.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Failed',
                detail: 'Fill required fields and add at least one item.',
                life: 2500
            });
            return;
        }

        const payload = {
            p_rfq_id: this.rfqForm.get('p_rfq_id')?.value,
            p_rfq_date: this.rfqForm.get('p_rfqdate')?.value,
            p_site: this.rfqForm.get('p_site')?.value,
            p_rfq_desc: this.rfqForm.get('p_rfq_desc')?.value,
            p_remarks: this.rfqForm.get('p_remarks')?.value,
            p_status: 'Submitted',
            p_items: this.rfqList.map((r) => ({
                category_id: r.category_id,
                item_id: r.item_id
            })),
            p_vendor_invites: this.vendorInviteRows.map((r) => ({
                category: r.category,
                vendor_ids: r.selectedVendors
            })),
            p_loginuser: this.userId
        };

        console.log('RFQ submit payload:', payload);
        this.rfqForm.patchValue({ p_status: 'Submitted' });
        this.messageService.add({
            severity: 'success',
            summary: 'RFQ saved',
            detail: 'RFQ form is ready for backend submit integration.',
            life: 2500
        });
    }
}