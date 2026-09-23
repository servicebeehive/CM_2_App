import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';

import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { getStatusColor } from '@/shared/utils/status-color';
import { WorkService } from '@/core/services/work.service';
import { MaterialTransfer, MaterialTransferItemPayload, TransferItem } from '@/core/models/authmodel/work.model';

@Component({
    selector: 'app-create-material-transfer',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, ConfirmDialogModule,
        DatePickerModule, DropdownModule, InputNumberModule, InputTextModule, TableModule,
        TooltipModule
    ],
    templateUrl: './create-material-transfer.component.html',
    styleUrl: './create-material-transfer.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class CreateMaterialTransferComponent implements OnInit {

    transferForm!: FormGroup;
    today: Date = new Date();

    transferItems: TransferItem[] = [];
    transferNoOptions: any[] = [];
    attachments: string[] = [];
    attachmentNames: string[] = [];

    // master list from the API, never mutated
    private allSiteOptions: any[] = [];

    // these two are what the dropdowns actually bind to — filtered against each other
    siteOptions: any[] = [];
    toSiteOptions: any[] = [];

    itemOptions: any[] = [];

    editingTransferId: number | null = null;
    private companyId = '';
    private userId = '';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private workService: WorkService,
        private authService: AuthService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute,
        public datePipe: DatePipe
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid?.toString() ?? '';
        this.userId = this.authService.isLogIntType()?.userid?.toString() ?? '';
        this.initForm();
        this.onGetProject();
        this.OnGetItem();
        const transferId = this.route.snapshot.queryParamMap.get('transferId');
        this.onGetTransferNo(transferId ? Number(transferId) : undefined);
    }

    private initForm(): void {
        this.transferForm = this.fb.group({
            p_transferno: [''],
            p_transferdate: [this.today, Validators.required],
            p_fromsite: [null, Validators.required],
            p_tosite: [null, Validators.required],
            p_itemdata: [null],
            p_remarks: ['', Validators.maxLength(500)],
            status: [''],
        }, { validators: this.sameSiteValidator });
    }

    get statusColor(): string {
        return getStatusColor(this.transferForm.get('status')?.value);
    }

    private sameSiteValidator(group: AbstractControl): ValidationErrors | null {
        const from = group.get('p_fromsite')?.value;
        const to = group.get('p_tosite')?.value;
        return from && to && from === to ? { sameSite: true } : null;
    }

    onGetProject(): void {
        const companyId = this.authService.isLogIntType().companyid.toString();
        const payload = { returnType: 'ACTIVEPROJECT', returnValue: '', username: '', option1: companyId, option2: null };
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                this.allSiteOptions = res.data ?? [];
                this.siteOptions = [...this.allSiteOptions];
                this.toSiteOptions = [...this.allSiteOptions];
            },
            error: (err) => console.error(err)
        });
    }

    onTransferChange(event: any): void {
    if (!event.value) return;

    const transferValue = this.transferNoOptions.find((opt) => Number(opt.transfer_id) === Number(event.value))?.transfer_no;

    const payload = {
        p_returntype: 'TRANSFERDETAILS',
        p_returnvalue: transferValue,
        p_username: this.companyId
    };

    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res: any) => {
            const rows = res.data ?? [];
            if (rows.length === 0) return;

            const header = rows[0];

            // ── Patch the header fields from the first row ──────────────────
            this.transferForm.patchValue({
                p_transferno: header.transfer_id,
                p_transferdate: header.transfer_date ? new Date(header.transfer_date) : null,
                p_fromsite: header.from_project_id,
                p_tosite: header.to_project_id,
                p_remarks: header.remarks,
                status: header.status_label ?? header.status
            });

            // keep the mutual-exclusion filters in sync with the loaded sites
            this.toSiteOptions = this.allSiteOptions.filter((s) => s.project_id !== header.from_project_id);
            this.siteOptions = this.allSiteOptions.filter((s) => s.project_id !== header.to_project_id);

            this.transferItems = rows.map((r: any) => ({
                itemid: r.item_id,
                categoryname: r.categoryname ?? '',   // ⚠️ not present in this payload — see note below
                itemname: r.item_name,
                uom: r.uom_name,
                uomid: r.uom_id,
                availableqty: r.available_qty,
                qtytotransfer: r.transfer_qty,
                remarks: ''
            }));
            this.editingTransferId = header.transfer_id;
        },
        error: (err) => console.error(err)
    });
}

    // ── Mutual exclusion: From Site and To Site can never be the same ──────
    onFromSiteChange(event: any): void {
        const fromVal = event.value;

        this.transferForm.patchValue({ p_itemdata: null }, { emitEvent: false });
        this.transferItems = [];

        // remove the chosen From Site from the To Site list
        this.toSiteOptions = this.allSiteOptions.filter((s) => s.project_id !== fromVal);

        // if To Site currently holds that same value, clear it
        if (fromVal && this.transferForm.get('p_tosite')?.value === fromVal) {
            this.transferForm.patchValue({ p_tosite: null });
        }

        // if From Site was cleared, restore full To Site list minus whatever To Site holds
        if (!fromVal) {
            const toVal = this.transferForm.get('p_tosite')?.value;
            this.toSiteOptions = this.allSiteOptions.filter((s) => s.project_id !== toVal);
        }
    }

    onToSiteChange(event: any): void {
        const toVal = event.value;

        // remove the chosen To Site from the From Site list
        this.siteOptions = this.allSiteOptions.filter((s) => s.project_id !== toVal);

        // if From Site currently holds that same value, clear it
        if (toVal && this.transferForm.get('p_fromsite')?.value === toVal) {
            this.transferForm.patchValue({ p_fromsite: null });
        }

        if (!toVal) {
            const fromVal = this.transferForm.get('p_fromsite')?.value;
            this.siteOptions = this.allSiteOptions.filter((s) => s.project_id !== fromVal);
        }
    }

    OnGetItem(): void {
        const payload = { p_returntype: 'ITEMALL', p_returnvalue: this.companyId, p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.error(err)
        });
    }

    onGetTransferNo(transferId?: number): void {
        const payload = { p_returntype: 'TRANSFERLIST', p_returnvalue: this.companyId, p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.transferNoOptions = res.data ?? [];
                if (transferId) this.onTransferChange({ value: transferId });
            },
            error: (err) => console.error(err)
        });
    }

OnItemChange(event: any): void {
    if (!event.value) return;

    const payload = { p_returntype: 'ITEMWISE', p_returnvalue: event.value.toString(), p_username: this.userId };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res) => {
            const detail = Array.isArray(res.data) ? res.data[0] : res.data;
            if (!detail) return;

            const item = this.itemOptions.find((i) => i.itemid === event.value);
            if (!item) return;
            
            const exists = this.transferItems.find((i) => i.itemid === item.itemid);
            if (exists) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Duplicate Item',
                    detail: `${item.item_description} is already in the list.`,
                    life: 2500
                });
                this.transferForm.get('p_itemdata')?.setValue(null);
                return;
            }
           
            const newRow: TransferItem = {
                itemid:detail.itemid,
                item_category_id: detail.categoryid,
                categoryname: detail.categoryname,  
                itemname: detail.item_description, 
                uom: detail.uomname,                 
                uomid: detail.uomid,
                availableqty: detail.available_qty,
                qtytotransfer: 0,
                remarks: ''
            };

            this.transferItems = [...this.transferItems, newRow];
            this.transferForm.get('p_itemdata')?.setValue(null);
        },
        error: (err) => console.error(err)
    });
}

    onQtyChange(item: TransferItem): void {
        const qty = Number(item.qtytotransfer || 0);
        const available = Number(item.availableqty || 0);
        if (qty > available) item.qtytotransfer = available;
        if (qty < 0) item.qtytotransfer = 0;
    }

    removeItem(index: number): void {
        this.confirmationService.confirm({
            message: 'Remove this item from the list?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => { this.transferItems = this.transferItems.filter((_, i) => i !== index); }
        });
    }

    onReceived(): void {
        this.callTransferAction('RECEIVED');
    }

    onGatePass(): void {
        this.callTransferAction('GATEPASS');
    }

    private callTransferAction(operation: 'GATEPASS' | 'RECEIVED'): void {
        if (!this.editingTransferId) {
            this.messageService.add({ severity: 'warn', summary: 'No Transfer', detail: 'Submit the transfer first.', life: 3000 });
            return;
        }
        const payload: MaterialTransfer = {
            p_operation: operation,
            p_transfer_id: this.editingTransferId,
            p_transfer_no: this.transferForm.get('p_transferno')?.value ?? null,
            p_transfer_date: this.datePipe.transform(this.transferForm.get('p_transferdate')?.value, 'yyyy-MM-dd'),
            p_company_id: Number(this.companyId),
            p_from_project_id: this.transferForm.get('p_fromsite')?.value,
            p_to_project_id: this.transferForm.get('p_tosite')?.value,
            p_remarks: this.transferForm.get('p_remarks')?.value ?? null,
            p_attachment: this.attachments[0] ?? null,
            p_items_json: [],
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertMaterialTransfer(payload).subscribe({
            next: (res: any) => {
                if (res.data.success) {
                    this.messageService.add({ severity: 'success', summary: operation, detail: res.data.msg });
                    this.transferForm.patchValue({ p_transferno: res.data.transfer_no,  status: res.data.status });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.data.msg });
                }
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to ${operation}.`, life: 3000 });
            }
        });
    }

    // ── Submit / Back ──────────────────────────────────────────────────────
    onSubmit(): void {
        this.transferForm.markAllAsTouched();

        if (this.transferForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Validation Failed', detail: 'Please fill all required fields.', life: 3000 });
            return;
        }

        if (this.transferItems.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'No Items', detail: 'Please add at least one item before submitting.', life: 3000 });
            return;
        }

        const missingQty = this.transferItems.some((i) => !i.qtytotransfer || i.qtytotransfer <= 0);
        if (missingQty) {
            this.messageService.add({ severity: 'warn', summary: 'Invalid Quantity', detail: 'Enter a valid Qty to Transfer for all items.', life: 3000 });
            return;
        }

        this.confirmationService.confirm({
            message: 'Are you sure you want to submit this Material Transfer?',
            header: 'Confirm Submission',
            acceptLabel: 'Submit',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => this.saveTransfer()
        });
    }

    private saveTransfer(): void {
        const formVal = this.transferForm.getRawValue();
        const isUpdate = !!this.editingTransferId;

        const itemsPayload: MaterialTransferItemPayload[] = this.transferItems.map((i) => ({
            item_id: i.itemid,
            uom_id: i.uomid,
            item_category_id: i.item_category_id,
            available_qty: i.availableqty,
            transfer_qty: i.qtytotransfer
        }));

        const payload: MaterialTransfer = {
            p_operation: isUpdate ? 'UPDATE' : 'INSERT',
            p_transfer_id: isUpdate ? this.editingTransferId : null,
            p_transfer_no: formVal.p_transferno || null,
            p_transfer_date: this.datePipe.transform(formVal.p_transferdate, 'yyyy-MM-dd'),
            p_company_id: Number(this.companyId),
            p_from_project_id: formVal.p_fromsite,
            p_to_project_id: formVal.p_tosite,
            p_remarks: formVal.p_remarks ?? '',
            p_attachment: this.attachments[0] ?? '',
            p_items_json: itemsPayload,
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertMaterialTransfer(payload).subscribe({
            next: (res: any) => {
                if (res.data.success) {
                    this.messageService.add({ severity: 'success', summary: res.data.status, detail: res.data.msg });
                     this.transferForm.patchValue({
                        p_transferno: res.data.transfer_id ?? res.data.transfer_no ?? '',
                        status: res.data.status
                    });
                    this.onGetTransferNo();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.data.msg });
                }
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit Material Transfer.', life: 3000 });
            }
        });
    }

    onBack(): void {
        this.router.navigate(['/layout/issue-item/material-transfer']);
    }

    onReset(): void {
        this.transferForm.reset({ p_transferdate: this.today });
        this.transferItems = [];
        this.attachments = [];
        this.siteOptions = [...this.allSiteOptions];
        this.toSiteOptions = [...this.allSiteOptions];
        this.editingTransferId = null;
    }
}