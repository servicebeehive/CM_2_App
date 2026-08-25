import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { RfqRow, VendorInviteRow } from '@/core/models/purchase.model';
import { UpsertRfqPayload, VendorInvitePayload } from '@/core/models/authmodel/work.model';
import { WorkService } from '@/core/services/work.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { environment } from '@/environments/environment';

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
        MultiSelectModule,
        ConfirmDialogModule
    ],
    templateUrl: './rfq.component.html',
    styleUrls: ['./rfq.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class RfqComponent implements OnInit {
    rfqForm!: FormGroup;
    rfqNoOptions: any[] = [];
    draftRfqOptions: any[] = [];
    projectOptions: any[] = [];
    itemOptions: any[] = [];
    vendorOptions: any[] = [];
    categoryOptions: { label: string; value: number }[] = [];
    isLoadingProjects = false;

    rfqList: RfqRow[] = [];
    includedMrList: any[] = [];
    vendorInviteRows: VendorInviteRow[] = [];
    mrDetailsMap: Record<string, any> = {};
    rfqVendorSelections: Record<number, number[]> = {};
    private hasBackendMrList = false;

    showMrDialog = false;
    selectedMrDetail: any | null = null;
    showMaterialReqDialog = false;
    showGmailReqDialog = false;
    gmailVendorRows: { selected: boolean; vendor: string; category: string; count: number; vendorId: number | null }[] = [];
    attachmentFile: File | null = null;
    attachmentFileName = '';
    attachmentBase64 = '';

    isLoadingItems = false;
    today: Date = new Date();
    companyId = '';
    userId = '';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        private workService: WorkService,
        private router: Router,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid?.toString() ?? '';
        this.userId = this.authService.isLogIntType()?.userid?.toString() ?? '';
        this.initForm();
        this.loadSites();
        this.loadRfqNumberOptions();
        this.loadDraftList();
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
            p_returntype: 'RFQID',
            p_username: this.companyId
        };

        this.inventoryService.getdropdowndetails(payload).subscribe({
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
            p_returntype: 'RFQIDDRAFT',
            p_username: this.companyId
        };

        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.draftRfqOptions = res.data || [];
            },
            error: () => {
                this.draftRfqOptions = [];
            }
        });
    }

    private upsertRfqDropdownOption(options: any[], rfqId: number, rfqNo: string): void {
        const option = { rfqid: rfqId, rfqno: rfqNo };
        const existingIndex = options.findIndex((item: any) => item.rfqid === rfqId);

        if (existingIndex >= 0) {
            options[existingIndex] = { ...options[existingIndex], ...option };
        } else {
            options.unshift(option);
        }
    }

    onSiteChange(event: any): void {
        const siteId = event.value;
        this.hasBackendMrList = false;
        if (!siteId) {
            this.rfqList = [];
            this.mrDetailsMap = {};
            this.rebuildVendorInviteRows();
            return;
        }
        this.loadRfqItems(siteId);
    }

    onRFQNoChange(data: any): void {
        this.showGmailReqDialog = false;
        this.gmailVendorRows = [];
        this.hasBackendMrList = true;
        this.includedMrList = [];
        this.mrDetailsMap = {};
        const payload = {
            p_returntype: 'GETRFQ',
            p_returnvalue: data.value.toString(),
            p_username: this.userId
        };

        const payloadvendor = {
        p_returntype: 'GETRFQVENDOR',
        p_returnvalue: data.value.toString(),
        p_username: this.userId
    };

        const payloadMr = {
            p_returntype: 'PROJECTRFQ4MR',
            p_returnvalue: data.value.toString(),
            p_username: this.userId
        };


        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const selected = Array.isArray(res.data) ? res.data[0] : res.data;
                if (!selected) return;

                this.setAttachment(selected.attachment ?? selected.attachment_path ?? '');

                this.rfqVendorSelections = {};
                this.rfqForm.patchValue(
                    {
                        p_rfq_id: selected.rfqid ?? null,
                        p_rfqno: selected.rfqid ?? null,
                        p_rfqdate: selected.rfqdate ? new Date(selected.rfqdate) : this.today,
                        p_site: selected.site_id ?? null,
                        p_rfq_desc: selected.rfq_description ?? '',
                        p_remarks: selected.remarks ?? '',
                        p_status: selected.status ?? 'Draft'
                    },
                    { emitEvent: false }
                );

                const rows: any[] = Array.isArray(res.data) ? res.data : [res.data];
                this.rfqList = rows.map((row: any) => ({
                    category: row.item_category ?? row.itemcategoryname ?? '',
                    item: row.item_description ?? row.itemdescription ?? '',
                    uom: row.uom ?? row.uomname ?? '',
                    buffer_stock: Number(row.buffer_stock ?? 0),
                    required_qty: Number(row.required_qty ?? 0),
                    available_stock: Number(row.available_stock ?? 0),
                    pending_qty: Number(row.pending_qty ?? 0),
                    total_mr_qty: Number(row.total_mr_qty ?? 0),
                    net_required_qty: Number(row.required_qty_net ?? 0),
                    category_id: row.item_category_id ?? row.itemcategoryid ?? null,
                    item_id: row.item_id ?? row.itemid ?? null
                }));

                this.rebuildVendorInviteRows();
                this.loadRfqVendorSelections(payloadvendor);
            }
        });
        this.loadMRList(payloadMr);
    }

    loadMRList(payloadMr: any): void {
        this.inventoryService.Getreturndropdowndetails(payloadMr).subscribe({
            next: (res: any) => {
                const rows: any[] = Array.isArray(res.data) ? res.data : [];
                this.mrDetailsMap = {};
                this.includedMrList = rows.map((row: any) => {
                    const mrRow = {
                        mr_no: row.mr_no ?? row.mf_no ?? '',
                        mf_id: row.mf_id ?? row.mrid ?? row.mr_id ?? null,
                        mr_date: row.mr_date ?? row.mf_date ?? null,
                        department: row.department ?? row.department_name ?? '',
                        requested_by: row.requester ?? '',
                        items: row.items ?? []
                    };
                    if (mrRow.mr_no) {
                        this.mrDetailsMap[mrRow.mr_no] = mrRow;
                    }
                    return mrRow;
                });
            }
        });
    }

    private loadRfqVendorSelections(payload: any): void {
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = Array.isArray(res.data) ? res.data : [];
                this.rfqVendorSelections = {};

                rows.forEach((row: any) => {
                    const categoryId = Number(row.categoryid ?? row.itemcategoryid ?? row.item_category_id ?? row.category_id);
                    const vendorId = Number(row.vendorid ?? row.supplierid ?? row.vendor_id ?? row.supplier_id);
                    const vendorIds = Array.isArray(row.vendorids) ? row.vendorids : [vendorId];

                    if (!Number.isNaN(categoryId)) {
                        const selectedVendorIds = vendorIds
                            .map((id: any) => Number(id))
                            .filter((id: number) => !Number.isNaN(id));
                        this.rfqVendorSelections[categoryId] = [
                            ...new Set([
                                ...(this.rfqVendorSelections[categoryId] ?? []),
                                ...selectedVendorIds
                            ])
                        ];
                    }
                });

                this.applyRfqVendorSelections();
            },
            error: () => {
                this.rfqVendorSelections = {};
            }
        });
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
                    category: r.item_category ?? r.itemcategoryname ?? '',
                    item: r.item_description ?? r.itemdescription ?? '',
                    uom: r.uom ?? r.uomname ?? '',
                    buffer_stock: Number(r.buffer_stock ?? 0),
                    required_qty: Number(r.required_qty ?? 0),
                    available_stock: Number(r.available_stock ?? 0),
                    pending_qty: Number(r.pending_qty ?? 0),
                    total_mr_qty: Number(r.total_mr_qty ?? 0),
                    net_required_qty: Number(r.required_qty_net ?? 0),
                    category_id: r.item_category_id ?? r.itemcategoryid ?? null,
                    item_id: r.item_id ?? r.itemid ?? null
                }));

                this.buildIncludedMrData();
                this.rebuildVendorInviteRows();
                this.applyRfqVendorSelections();
                this.isLoadingItems = false;
            },
            error: (err) => {
                console.error('Error fetching RFQ items:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to load items',
                    life: 2500
                });
            }
        });
    }

    private applyRfqVendorSelections(): void {
        this.vendorInviteRows.forEach((row) => {
            if (row.category_id != null && this.rfqVendorSelections[row.category_id]) {
                row.selectedVendors = this.rfqVendorSelections[row.category_id];
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

                this.buildIncludedMrData();
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
        if (this.hasBackendMrList) {
            return;
        }

        const grouped = new Map<string, any>();

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
    row.availableVendors = [];

    if (row.category_id == null) {
        row.selectedVendors = [];
        row.category = '';
        return;
    }

    row.category = this.categoryOptions.find((o) => o.value === row.category_id)?.label ?? '';

    const payload = {
        p_returntype: 'CATEGORYVENDOR',
        p_returnvalue: row.category_id.toString(),
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

getAvailableCategoryOptions(currentIndex: number): { label: string; value: number }[] {
    const pickedElsewhere = this.vendorInviteRows.filter((_, i) => i !== currentIndex).map((r) => r.category_id).filter((id): id is number => id != null);
    return this.categoryOptions.filter((opt) => !pickedElsewhere.includes(opt.value));
}

 private rebuildVendorInviteRows(): void {
    const previousSelection = new Map<number, number[]>();
    this.vendorInviteRows.forEach((row) => {
        if (row.category_id != null) previousSelection.set(row.category_id, row.selectedVendors);
    });

    const seen = new Map<number, string>();
    this.rfqList.forEach((r) => {
        if (r.category_id != null && !seen.has(r.category_id)) {
            seen.set(r.category_id, r.category);
        }
    });

    this.categoryOptions = Array.from(seen.entries()).map(([id, name]) => ({ label: name, value: id }));

    if (!this.categoryOptions.length) {
        this.ensureDefaultVendorInviteRows();
        return;
    }

    this.vendorInviteRows = Array.from(seen.entries()).map(([id, name]) => ({
        category: name,
        category_id: id,
        selectedVendors: previousSelection.get(id) ?? this.rfqVendorSelections[id] ?? [],
        availableVendors: []
    }));

    this.vendorInviteRows.forEach((_, i) => this.onVendorCategoryChange(i));
}

    private ensureDefaultVendorInviteRows(): void {
        if (this.vendorInviteRows.length === 0) {
            this.vendorInviteRows = [{ category: '', category_id: null, selectedVendors: [] }];
        }
    }

    addVendorInviteRow(): void {
        this.vendorInviteRows = [...this.vendorInviteRows, { category: '', category_id: null, selectedVendors: [] }];
    }

    removeVendorInviteRow(index: number): void {
        if (this.vendorInviteRows.length <= 1) {
            return;
        }
        this.vendorInviteRows = this.vendorInviteRows.filter((_, i) => i !== index);
    }

    get isRfqSubmitted(): boolean {
        return String(this.rfqForm?.get('p_status')?.value ?? '').toUpperCase() === 'SUBMITTED';
    }

    get hasRfqValue(): boolean {
        return this.rfqForm?.get('p_rfqno')?.value != null && this.rfqForm.get('p_rfqno')?.value !== '';
    }

    get hasValidVendorSelection(): boolean {
        const completeInvite = this.vendorInviteRows.some((row) => row.category_id != null && row.selectedVendors.length > 0);
        const incompleteInvite = this.vendorInviteRows.some((row) => (row.category_id != null && row.selectedVendors.length === 0) || (row.category_id == null && row.selectedVendors.length > 0));
        return completeInvite && !incompleteInvite;
    }

    openMaterialReqDialog(): void {
        this.showMaterialReqDialog = true;
    }

    openMaterialRequisition(row: any): void {
        this.showMaterialReqDialog = false;
        this.router.navigate(['/layout/purchase/material-requisition'], {
            queryParams: { mfNo: row.mr_no, mfId: row.mf_id ?? row.mr_id ?? null, fromRfqView: true }
        });
    }

    openGmailReqDialog(): void {
        const rfqId = this.rfqForm.get('p_rfqno')?.value;
        if (!rfqId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Select RFQ No',
                detail: 'Select an RFQ before opening Gmail.',
                life: 2500
            });
            return;
        }

        const payload = {
            p_returntype: 'GETRFQMAIL',
            p_returnvalue: String(rfqId),
            p_username: ''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = Array.isArray(res.data) ? res.data : [];
                this.gmailVendorRows = rows.map((row: any) => ({
                    selected: false,
                    vendor: row.suppliername,
                    category: row.categoryname,
                    count: Number(row.attempt_count ?? 0),
                    vendorId: row.vendorid ?? row.supplierid ?? row.vendor_id ?? null
                }));
                this.showGmailReqDialog = true;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Gmail data load failed',
                    detail: 'Unable to load vendors for this RFQ.',
                    life: 2500
                });
            }
        });
    }

    sendVendorRfq(): void {
    const selectedRows = this.gmailVendorRows.filter((r) => r.selected);

    if (!selectedRows.length) {
        this.messageService.add({
            severity: 'warn',
            summary: 'Select vendor',
            detail: 'Select at least one vendor before sending the RFQ email.',
            life: 2500
        });
        return;
    }

    const rfqId = this.rfqForm.get('p_rfqno')?.value;
    const payload = {
        p_rfqid: rfqId,
        p_username: this.userId,
        p_vendor_ids: selectedRows
            .map((r) => r.vendorId)
            .filter((id): id is number => id != null)
    };

    // this.workService.sendRfqMail(payload).subscribe({
    //     next: (res: any) => {
    //         this.messageService.add({
    //             severity: 'success',
    //             summary: 'RFQ email queued',
    //             detail: `RFQ shared with ${selectedRows.length} vendor(s).`,
    //             life: 2500
    //         });
    //         this.showGmailReqDialog = false;
    //     },
    //     error: (err) => {
    //         this.messageService.add({
    //             severity: 'error',
    //             summary: 'Send failed',
    //             detail: err.message,
    //             life: 2500
    //         });
    //     }
    // });
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
                this.setAttachment(header.attachment ?? header.attachment_path ?? '');
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
    if (!this.rfqForm.get('p_site')?.value || this.rfqList.length === 0) {
        this.messageService.add({
            severity: 'warn',
            summary: 'Cannot save draft',
            detail: 'Select a site and add at least one item before saving as draft.',
            life: 2500
        });
        return;
    }

    const vendorJson: VendorInvitePayload[] = this.vendorInviteRows
        .filter((r) => r.category_id != null)
        .map((r) => ({
            categoryid: r.category_id as number,
            vendorids: r.selectedVendors
        }));

    const payload: UpsertRfqPayload = {
        p_companyid: Number(this.companyId),
        p_rfqid: this.rfqForm.get('p_rfq_id')?.value ?? 0,
        p_site_id: this.rfqForm.get('p_site')?.value,
        p_rfqdate: this.rfqForm.get('p_rfqdate')?.value,
        p_rfq_description: this.rfqForm.get('p_rfq_desc')?.value ?? '',
        p_remarks: this.rfqForm.get('p_remarks')?.value ?? '',
        p_attachment_path: this.attachmentFileName || null,
        p_status: 'DRAFT',
        p_user_id: Number(this.userId),
        p_vendor_json: vendorJson.length ? vendorJson : null
    };

    this.workService.upsertRFQ(payload).subscribe({
        next: (res: any) => {
           
            if (res.data?.success) {
                const rfqId = res.data.rfqid;
                const rfqNo = res.data.rfqno;
                this.upsertRfqDropdownOption(this.draftRfqOptions, rfqId, rfqNo);
                this.rfqForm.patchValue({
                    p_rfq_id: rfqId,
                    p_draft_rfqno: rfqId,
                    p_status: res.data.status
                });
                this.messageService.add({ severity: 'success', summary: res.data.msg });
                this.loadDraftList();
            } else {
                this.messageService.add({ severity: 'error', summary: res.data.msg });
            }
        },
        error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Draft save failed', detail: err.message, life: 2500 });
        }
    });
}
    onAttachmentSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        this.attachmentFile = file;
        this.attachmentFileName = file?.name ?? '';
        this.attachmentBase64 = '';
        this.rfqForm.patchValue({ p_attachment: file });
    }

    viewAttachment(): void {
        if (!this.attachmentFileName) return;

        if (this.attachmentFile) {
            window.open(URL.createObjectURL(this.attachmentFile), '_blank');
            return;
        }

        if (this.attachmentBase64) {
            const blobUrl = this.base64DataUriToBlobUrl(this.attachmentBase64);
            if (blobUrl) window.open(blobUrl, '_blank');
            return;
        }

        if (this.attachmentFileName.startsWith('http')) {
            window.open(this.attachmentFileName, '_blank');
            return;
        }

        const apiUrl = environment.baseurl.replace(/\/api\/?$/, '');
        window.open(`${apiUrl}/uploads/${encodeURIComponent(this.attachmentFileName)}`, '_blank');
    }

    private setAttachment(attachment: string): void {
        if (attachment?.startsWith('data:')) {
            this.attachmentBase64 = attachment;
            this.attachmentFileName = 'Attached file';
        } else {
            this.attachmentBase64 = '';
            this.attachmentFileName = attachment ?? '';
        }
        this.attachmentFile = null;
    }

    private base64DataUriToBlobUrl(dataUri: string): string | null {
        try {
            const [meta, base64] = dataUri.split(',');
            const mimeType = meta.match(/data:(.*?);base64/)?.[1] ?? 'application/pdf';
            const byteString = atob(base64);
            const byteArray = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) byteArray[i] = byteString.charCodeAt(i);
            return URL.createObjectURL(new Blob([byteArray], { type: mimeType }));
        } catch (error) {
            console.error('Failed to convert base64 attachment to blob:', error);
            return null;
        }
    }

    onReset(): void {
        this.hasBackendMrList = false;
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
        this.attachmentFile = null;
        this.attachmentBase64 = '';
        this.rfqList = [];
        this.includedMrList = [];
        this.vendorInviteRows = [];
        this.categoryOptions = [];
        this.ensureDefaultVendorInviteRows();
        this.mrDetailsMap = {};
    }

    private hasValidVendorInvites(): boolean {
        const hasCompleteInvite = this.vendorInviteRows.some((row) => row.category_id != null && row.selectedVendors.length > 0);
        const hasIncompleteInvite = this.vendorInviteRows.some((row) => (row.category_id != null && row.selectedVendors.length === 0) || (row.category_id == null && row.selectedVendors.length > 0));

        if (!hasCompleteInvite || hasIncompleteInvite) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Vendor selection required',
                detail: 'Select at least one category and one vendor. Every selected category must have a vendor.',
                life: 3000
            });
            return false;
        }

        return true;
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

        if (!this.hasValidVendorInvites()) {
            return;
        }

 const vendorJson: VendorInvitePayload[] = this.vendorInviteRows
        .filter((r) => r.category_id != null)
        .map((r) => ({
            categoryid: r.category_id as number,
            vendorids: r.selectedVendors
        }));

        const payload: UpsertRfqPayload = {
        p_companyid: Number(this.companyId),
        p_rfqid: this.rfqForm.get('p_rfq_id')?.value ?? 0,
        p_site_id: this.rfqForm.get('p_site')?.value,
        p_rfqdate: this.rfqForm.get('p_rfqdate')?.value,
        p_rfq_description: this.rfqForm.get('p_rfq_desc')?.value ?? '',
        p_remarks: this.rfqForm.get('p_remarks')?.value ?? '',
        p_attachment_path: this.attachmentFileName || null,
        p_status: 'Submitted',
        p_user_id: Number(this.userId),
        p_vendor_json: vendorJson.length ? vendorJson : null
    };

    this.workService.upsertRFQ(payload).subscribe({
    next: (res: any) => {
            if (res.data?.success) {
                const rfqId = res.data.rfqid;
                const rfqNo = res.data.rfqno;
                this.upsertRfqDropdownOption(this.rfqNoOptions, rfqId, rfqNo);
                this.rfqForm.patchValue({
                    p_rfq_id: rfqId,
                    p_rfqno: rfqId,
                    p_status: res.data.status || 'SUBMITTED'
                });
                this.messageService.add({ severity: 'success', summary: res.data.msg });
            } else {
                this.messageService.add({ severity: 'error', summary: res.data.msg });
            }
        },
        error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Save failed', detail: err.message, life: 2500 });
        }
    });
}

  deleteDraftItem(item: any, event: Event): void {
        event.stopPropagation();

        this.confirmationService.confirm({
            message: `Delete draft ${item.rfqno}? This cannot be undone.`,
            header: 'Confirm Delete',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                // this.workService.upsertMaterialForecast(this.buildDeletePayload(item.mf_id)).subscribe({
                //     next: (res) => {
                //         this.messageService.add({ severity: 'success', summary: res.data.message, life: 2000 });
                        
                //     },
                //     error: (err) => {
                //         console.error(err);
                //         const detail = err?.error?.message || 'Failed to delete draft';
                //         this.messageService.add({ severity: 'error', summary: detail, life: 2500 });
                //     }
                // });
            }
        });
    }

}