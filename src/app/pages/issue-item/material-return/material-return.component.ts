import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { WorkService } from '@/core/services/work.service';
import { MaterialReturn, MaterialReturnItem } from '@/core/models/authmodel/work.model';

@Component({
    selector: 'app-material-return',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, ConfirmDialogModule, DatePickerModule, DialogModule, DropdownModule, InputNumberModule, InputTextModule, TableModule, TooltipModule, SelectModule],
    templateUrl: './material-return.component.html',
    styleUrls: ['./material-return.component.scss'],
    providers: [ConfirmationService, DatePipe]
})
export class MaterialReturnComponent implements OnInit {
    minForm!: FormGroup;
    today: Date = new Date();
    issueItems: any[] = [];

    mrnOptions: any[] = [];
    projectOptions: any[] = [];
    towerOptions: any[] = [];
    itemOptions: any[] = [];
    workList: any[] = [];
    returnTypeOptions: { label: string; value: string }[] = [];
    returnConditionOptions: { label: string; value: string }[] = [];
    returnOptions: { label: string; value: string }[] = [];
    editingMrnId: number | null = null;
    private companyId = '';
    private userId = '';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        public datePipe: DatePipe,
        private authService: AuthService,
        private workService: WorkService
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid?.toString() ?? '';
        this.userId = this.authService.isLogIntType()?.userid?.toString() ?? '';
        this.initForm();
        this.loadDropdowns();
    }

    private initForm(): void {
        const currentUser = this.authService.isLogIntType()?.username || 'Current User';

        this.minForm = this.fb.group({
            p_returnno: [{ value: '', disabled: false }],
            p_issuedate: [this.today, Validators.required],
            p_project: [null, Validators.required],
            p_tower: [null, Validators.required],
            p_itemdata: [null],
            p_returnby: [null, Validators.required],
            p_issuedby: [{ value: currentUser, disabled: true }],
            p_remarks: ['', Validators.maxLength(500)],
            status: ['']
        });
    }

      get statusColor(): string {
        const status = (this.minForm.get('status')?.value || '').toUpperCase();
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

    hasCopyableData(): boolean {
        const v = this.minForm.getRawValue();
        return !!(v.p_project || v.p_tower || v.p_returnby || v.p_remarks || this.issueItems.length > 0);
    }

    private loadDropdowns(): void {
        this.onGetMRN();
        this.loadProjects();
        this.loadRequestedBy();
        this.OnGetItem();
        this.loadReturnTypeOptions();
        this.loadReturnConditionOptions();
    }

    private loadProjects(): void {
        const payload = { returnType: 'ACTIVEPROJECT', returnValue: '', username: '', option1: this.companyId, option2: null };
        this.inventoryService.getparameterbased(payload).subscribe({ next: (res: any) => (this.projectOptions = res.data ?? []), error: (err) => console.error(err) });
    }

    onProjectChange(event: any): void {
        const projectId = event.value;
        this.workList = [];
        this.towerOptions = [];
        this.minForm.patchValue({ p_tower: null }, { emitEvent: false });
        if (!projectId) return;

        const payload = { p_returntype: 'WORKLISTDD', p_returnvalue: String(projectId), p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.workList = res.data ?? [];
                const towers = new Map<number, any>();
                this.workList.forEach((work) => towers.set(work.tower_block_id, { tower_id: work.tower_block_id, tower_name: work.tower_name }));
                this.towerOptions = Array.from(towers.values());
            },
            error: (err) => console.error(err)
        });
    }

    private loadRequestedBy(): void {
        const payload = { p_returntype: 'REQUESTEDBY', p_returnvalue: this.companyId, p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({ next: (res: any) => (this.returnOptions = res.data ?? []), error: (err) => console.error(err) });
    }

    private loadReturnTypeOptions(): void {
        this.returnTypeOptions = [
            { label: 'Excess Material', value: 'excess-material' },
            { label: 'Damaged / Unused', value: 'damaged-unused' },
            { label: 'Transfer Return', value: 'transfer-return' }
        ];
    }

    private loadReturnConditionOptions(): void {
        this.returnConditionOptions = [
            { label: 'Good', value: 'Good' },
            { label: 'Sealed', value: 'Sealed' },
            { label: 'Damaged', value: 'Damaged' }
        ];
    }

    OnGetItem(): void {
        const payload = {
            p_returntype: 'ITEMALL',
            p_returnvalue: this.companyId,
            p_username: this.userId
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.error(err)
        });
    }

    onGetMRN(){
        const payload = {
            p_returntype: 'MRNTABLELIST',
            p_returnvalue: this.companyId,
            p_username: this.userId
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.mrnOptions = res.data ?? [];
            },
            error: (err) => console.error(err)
        });
    }

    // ── MRN dropdown: load a submitted MRN back into the form ──────────────
    onMRNChange(event: any): void {
        if (!event.value) return;
        const mrnvalue = this.mrnOptions.find((opt) => opt.mrn_id === event.value)?.mrn_no;
        const payload = {
            p_returntype: 'MRNDETAILS',
            p_returnvalue: mrnvalue,
            p_username: this.companyId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe((res) => {
            const d = res.data[0];
            this.minForm.patchValue({
                p_issuedate: d.issuedate ? new Date(d.issuedate) : null,
                p_project: d.project,
                p_tower: d.tower,
                p_returnby: d.requestedby,
                p_remarks: d.remarks
            });
            this.issueItems = res.data.items || [];
        });
    }

    OnItemChange(event: any): void {
        if (!event.value) return;

        const payload = {
            p_returntype: 'ITEMWISE',
            p_returnvalue: event.value.toString(),
            p_username: this.userId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                const data = res.data?.[0];
                if (!data) return;
                this.addItemToTable(data);
            },
            error: (err) => console.error(err)
        });
    }

    private addItemToTable(item: any): void {
        const exists = this.issueItems.find((i) => i.itemid === item.itemid);
        if (exists) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Item',
                detail: `${item.item_description} is already in the list.`,
                life: 2500
            });
            this.minForm.get('p_itemdata')?.setValue(null);
            return;
        }

        const newRow = {
            itemid: item.itemid,
            categoryid: item.categoryid,
            categoryname: item.categoryname,
            itemname: item.item_description,
            uom: item.uomname,
            uomid: item.uomid,
            issuedqty: item.total_mr_qty ?? 10,
            alreadyreturnedqty: 2,
            returnableqty: item.available_stock ?? 5,
            issueqty: 0,
            returntype: null,
            returncondition: null,
            rate: 0,
            amount: 0,
            balance: item.available_stock ?? 2
        };

        this.issueItems = [...this.issueItems, newRow];
        this.minForm.get('p_itemdata')?.setValue(null);
    }

    // ── Table qty logic ────────────────────────────────────────────────────
    onIssueQtyChange(item: any): void {
        const issued = Number(item.issueqty || 0);
        const available = Number(item.returnableqty || 0);

        if (issued > available) item.issueqty = available;
        if (issued < 0) item.issueqty = 0;

        item.balance = available - Number(item.issueqty);
        item.amount = Number(item.issueqty || 0) * Number(item.rate || 0);
    }

    removeItem(index: number): void {
        this.confirmationService.confirm({
            message: 'Remove this item from the list?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.issueItems = this.issueItems.filter((_, i) => i !== index);
            }
        });
    }

    // ── Totals ─────────────────────────────────────────────────────────────
    get totalIssueQty(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.issueqty) || 0), 0);
    }

    get totalReturnValue(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    onSubmit(): void {
        this.minForm.markAllAsTouched();

        if (this.minForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Failed',
                detail: 'Please fill all required fields.',
                life: 3000
            });
            return;
        }

        if (this.issueItems.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Items',
                detail: 'Please add at least one item before submitting.',
                life: 3000
            });
            return;
        }

        this.confirmationService.confirm({
            message: 'Are you sure you want to submit this Material Return Note?',
            header: 'Confirm Submission',
            acceptLabel: 'Submit',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => this.saveMIN()
        });
    }

  private saveMIN(): void {
    const formVal = this.minForm.getRawValue();
    const isUpdate = !!this.editingMrnId;
    const currentUserId = Number(this.authService.isLogIntType()?.userid ?? 0);
    const itemsPayload: MaterialReturnItem[] = this.issueItems.map((it) => ({
        min_detail_id: null,
        item_category_id: it.categoryid,
        uom_id: it.uomid,
        item_id: it.itemid,
        return_qty: it.issueqty,
        return_reason: it.returntype,
        return_condition: it.returncondition
    }));

    const payload: MaterialReturn = {
        p_action: 'SUBMIT',
        p_operation: isUpdate ? 'UPDATE' : 'INSERT',
        p_mrn_id: isUpdate ? this.editingMrnId : null,
        p_return_date: this.datePipe.transform(formVal.p_issuedate, 'yyyy-MM-dd'),
        p_company_id: Number(this.companyId),
        p_project_id: formVal.p_project,
        p_tower_block_id: formVal.p_tower,
        p_level_name: formVal.p_level ?? '',         
        p_pour_name: formVal.p_pour ?? '',          
        p_return_form: 0,  
        p_store_id: null,
        p_min_id: 0,                  
        p_return_type: '',              
        p_returned_by: formVal.p_returnby,                
        p_remarks: formVal.p_remarks,
        p_items_json: itemsPayload,
        p_loginuser: currentUserId
    };

    this.workService.upsertMaterialReturn(payload).subscribe({
        next: (res: any) => {
            if (res.data.success) {
                this.messageService.add({ severity: 'success', summary: res.data.status, detail: res.data.msg });
                this.minForm.patchValue({ p_returnno: res.data.mrn_no , status: res.data.status });
                this.onGetMRN();
            } else {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: res.data.msg });
            }
        },
        error: (err) => {
            console.error(err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit Material Return.', life: 3000 });
        }
    });
}
    // ── Reset ──────────────────────────────────────────────────────────────
    onReset(): void {
        const currentUser = this.authService.isLogIntType()?.username || 'Current User';
        this.minForm.reset({ p_issuedate: this.today });
        this.minForm.patchValue({
            p_issuedby: currentUser,
            p_returntype: null
        });
        this.issueItems = [];
    }
}