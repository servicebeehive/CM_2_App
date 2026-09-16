import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
// import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { Textarea } from 'primeng/textarea';

export interface TransferItem {
    itemid: number;
    itemcode: string;
    itemname: string;
    uom: string;
    availableqty: number;
    qtytotransfer: number;
    remarks: string;
}

export interface ItemOption {
    itemid: number;
    itemcode: string;
    itemname: string;
    uom: string;
    availableqty: number;
    [key: string]: any;
}

@Component({
    selector: 'app-create-material-transfer',
    standalone: true,
    imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DatePickerModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    // InputTextareaModule,
    TableModule,
    TooltipModule,
    Textarea
],
    templateUrl: './create-material-transfer.component.html',
    styleUrl: './create-material-transfer.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class CreateMaterialTransferComponent implements OnInit {

    transferForm!: FormGroup;
    today: Date = new Date();

    transferItems: TransferItem[] = [];
    attachments: string[] = [];
    attachmentNames: string[] = [];

    siteOptions: any[] = [];
    toSiteOptions: any[] = [];
    itemOptions: ItemOption[] = [];

    private companyId = '';
    private userId = '';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private router: Router,
        public datePipe: DatePipe
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid?.toString() ?? '';
        this.userId = this.authService.isLogIntType()?.userid?.toString() ?? '';
        this.initForm();
        this.onGetProject();
        this.OnGetItem();
    }

    private initForm(): void {
        this.transferForm = this.fb.group({
            p_transferno: [{ value: '', disabled: true }],
            p_transferdate: [this.today, Validators.required],
            p_fromsite: [null, Validators.required],
            p_tosite: [null, Validators.required],
            p_itemdata: [null],
            p_remarks: ['', Validators.maxLength(500)],
            status: [''],
        }, { validators: this.sameSiteValidator });
    }

      get statusColor(): string {
        const status = (this.transferForm.get('status')?.value || '').toUpperCase();
        switch (status) {
            case 'APPROVED':
                return 'green';
            case 'SUBMITTED':
                return 'blue';
            case 'REJECTED':
                return 'red';
            case 'CANCELLED':
                return 'red';
            case 'PARTIALLY RECEIVED':
                return 'purple';
            case 'DRAFT':
                return 'grey';
            case 'APPROVAL PENDING':
                return 'orange';
            default:
                return 'grey';
        }
    }
    
    // Prevent From Site === To Site
    private sameSiteValidator(group: AbstractControl): ValidationErrors | null {
        const from = group.get('p_fromsite')?.value;
        const to = group.get('p_tosite')?.value;
        return from && to && from === to ? { sameSite: true } : null;
    }

    onGetProject(): void {
        const companyId = this.authService.isLogIntType().companyid.toString();
        const payload = {
            returnType: 'ACTIVEPROJECT',
            returnValue: '',
            username: '',
            option1: companyId,
            option2: null
        };
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                this.siteOptions = res.data;
                this.toSiteOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    onFromSiteChange(event: any): void {
        this.transferForm.patchValue({ p_itemdata: null }, { emitEvent: false });
        this.transferItems = [];
    }

     OnGetItem(): void {
        const paylaod = {
            p_returntype: 'ITEMALL',
            p_returnvalue: this.companyId,
            p_username: this.userId
        };
        this.inventoryService.Getreturndropdowndetails(paylaod).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.error(err)
        });
    }

    OnItemChange(event: any): void {
        if (!event.value) return;

        const paylaod = {
            p_returntype: 'ITEMWISE',
            p_returnvalue: event.value.toString(),
            p_username: this.userId
        };
        this.inventoryService.Getreturndropdowndetails(paylaod).subscribe({
            next: (res) => {
                const detail = Array.isArray(res.data) ? res.data[0] : res.data;
                if (!detail) return;
                const item = this.itemOptions.find(i => i.itemid === event.value);
        if (!item) return;

        const exists = this.transferItems.find(i => i.itemid === item.itemid);
        if (exists) {
            this.messageService.add({ severity: 'warn', summary: 'Duplicate Item', detail: `${item.itemname} is already in the list.`, life: 2500 });
            this.transferForm.get('p_itemdata')?.setValue(null);
            return;
        }

        const newRow: TransferItem = {
            itemid: item.itemid,
            itemcode: item.itemcode,
            itemname: item.itemname,
            uom: item.uom,
            availableqty: item.availableqty,
            qtytotransfer: 0,
            remarks: ''
        };

        this.transferItems = [...this.transferItems, newRow];
        this.transferForm.get('p_itemdata')?.setValue(null);

        this.messageService.add({ severity: 'success', summary: 'Item Added', detail: `${item.itemname} added — enter Qty to Transfer.`, life: 2000 });
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

    onReceived(): void {}

    // ── Submit / Cancel ────────────────────────────────────────────────────
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

        const missingQty = this.transferItems.some(i => !i.qtytotransfer || i.qtytotransfer <= 0);
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

        const payload = {
            p_transferdate: this.datePipe.transform(formVal.p_transferdate, 'yyyy-MM-dd'),
            p_fromsite: formVal.p_fromsite,
            p_tosite: formVal.p_tosite,
            p_remarks: formVal.p_remarks,
            p_items_json: this.transferItems.map(i => ({
                item_id: i.itemid,
                uom: i.uom,
                available_qty: i.availableqty,
                qty_transferred: i.qtytotransfer,
                remarks: i.remarks
            })),
            p_attachments: this.attachments,
            p_loginuser: Number(this.userId)
        };

        // ── Wire your real API here ────────────────────────────────────────
        // this.inventoryService.upsertMaterialTransfer(payload).subscribe({
        //   next: (res: any) => { ... },
        //   error: (err) => { ... }
        // });

        console.log('Material Transfer Payload:', payload);
        this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Material Transfer submitted successfully.', life: 3000 });
    }

    onCancel(): void {
        this.router.navigate(['/layout/issue-item/material-transfer']);
    }

    onGatePass(): void {
        // Implement the logic for generating a gate pass here
        console.log('Gate Pass button clicked');
    }

    onReset(): void {
        this.transferForm.reset();
        this.transferItems = [];
        this.attachments = [];
    }
}