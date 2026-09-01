import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
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

// ── Replace with your real service ───────────────────────────────────────────
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
// ─────────────────────────────────────────────────────────────────────────────

/** A row in the issue items table */
export interface IssueItem {
    itemcode:     string;
    itemname:     string;
    itemid:       number;
    uom:          string;
    currentstock: number;
    reservedqty:  number;
    availableqty: number;
    requestedqty: number;
    issuedqty:    number;
    alreadyreturnedqty: number;
    returnableqty: number;
    issueqty:     number;
    returnreason: string;
    returncondition: string;
    rate: number;
    amount: number;
    balance:      number;
}

/** Shape of an item returned by the item dropdown API */
export interface ItemOption {
    itemid:       number;
    itemcode:     string;
    itemname:     string;
    uom:          string;
    currentstock: number;
    reservedqty:  number;
    availableqty: number;
    [key: string]: any;
}

@Component({
    selector: 'app-material-return',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        ConfirmDialogModule,
        DatePickerModule,
        DialogModule,
        DropdownModule,
        InputNumberModule,
        InputTextModule,
        TableModule,
        TooltipModule
    ],
    templateUrl: './material-return.component.html',
    styleUrls: ['./material-return.component.scss'],
    providers: [ConfirmationService, DatePipe]
})
export class MaterialReturnComponent implements OnInit {

    // ── Auth (for Issued By auto-fill) ─────────────────────────────────────
    private authService = inject(AuthService);

    // ── Form ───────────────────────────────────────────────────────────────
    minForm!: FormGroup;

    // ── Today cap ──────────────────────────────────────────────────────────
    today: Date = new Date();

    // ── Table data ─────────────────────────────────────────────────────────
    issueItems: IssueItem[] = [];
    selectedItemId:    number | null = null;

    // ── Dropdown options ───────────────────────────────────────────────────

    /** Submitted MIN records for the top dropdown */
    minOptions: { minno: string; [key: string]: any }[] = [];

    projectOptions: any[] = [];
    towerOptions: any[] = [];
    levelOptions: { label: string; value: string }[] = [];
    pourOptions: { label: string; value: string }[] = [];
    workList: any[] = [];
    returnFromOptions: { label: string; value: string }[] = [];
    storeOptions: { label: string; value: string }[] = [];
    linkedMinOptions: { label: string; value: string }[] = [];
    returnTypeOptions: { label: string; value: string }[] = [];
    returnReasonOptions: { label: string; value: string }[] = [];
    returnConditionOptions: { label: string; value: string }[] = [];
    requestedByOptions: { label: string; value: string }[] = [];
    itemOptions: ItemOption[] = [];

    // ── MIN counter (replace with backend auto-increment) ──────────────────
    private minCounter = 0;
    private companyId = '';
    private userId = '';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        public datePipe: DatePipe
    ) {}

    // ── Lifecycle ──────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid?.toString() ?? '';
        this.userId = this.authService.isLogIntType()?.userid?.toString() ?? '';
        this.initForm();
        this.loadDropdowns();
    }

    // ── Form initialisation ────────────────────────────────────────────────
    private initForm(): void {
        // Auto-fill Issued By from logged-in user
        const currentUser = this.authService.isLogIntType()?.username || 'Current User';

        this.minForm = this.fb.group({
            p_minno:       [{ value: '', disabled: false }],
            p_issuedate:   [this.today, Validators.required],
            p_project:     [null, Validators.required],
            p_tower:       [null, Validators.required],
            p_returnfrom:  [null, Validators.required],
            p_store:       [null, Validators.required],
            p_linkedminno: [null, Validators.required],
            p_mindate:     [null],
            p_returntype:  [null, Validators.required],
            p_level:       [null],
            p_pour:        [null],
            p_selecteditem: [null],
            p_requestedby: [null, Validators.required],
            p_issuedby:    [{ value: currentUser, disabled: true }],
            p_remarks:     ['', Validators.maxLength(500)]
        });
    }

    hasCopyableData(): boolean {
    const v = this.minForm.getRawValue();
    return !!(
        v.p_project      ||
        v.p_tower        ||
        v.p_returnfrom   ||
        v.p_store        ||
        v.p_linkedminno  ||
        v.p_returntype   ||
        v.p_level        ||
        v.p_pour         ||
        v.p_requestedby  ||
        v.p_remarks      ||
        this.issueItems.length > 0
    );
}

duplicateForm(): void {
    const v = this.minForm.getRawValue();

    // Reset only MIN No and Issue Date, keep everything else
    this.minForm.patchValue({
        p_minno:     '',           // clear MIN No
        p_issuedate: new Date(),   // set today's date
        p_project:     v.p_project,
        p_tower:       v.p_tower,
        p_returnfrom:  v.p_returnfrom,
        p_store:       v.p_store,
        p_linkedminno: v.p_linkedminno,
        p_mindate:     v.p_mindate,
        p_returntype:  v.p_returntype,
        p_level:       v.p_level,
        p_pour:        v.p_pour,
        p_requestedby: v.p_requestedby,
        p_remarks:     v.p_remarks
    });

    // Keep items as-is (issueqty and balance preserved)
    this.issueItems = this.issueItems.map(it => ({ ...it }));

    this.messageService.add({
        severity: 'success',
        summary:  'Duplicated',
        life:     3000
    });
}

    // ── Load all dropdowns ─────────────────────────────────────────────────
    private loadDropdowns(): void {
        this.loadMINList();
        this.loadProjects();
        this.loadRequestedBy();
        this.loadItems();
        this.loadReturnFromOptions();
        this.loadStoreOptions();
        this.loadLinkedMinOptions();
        this.loadReturnTypeOptions();
        this.loadReturnReasonOptions();
        this.loadReturnConditionOptions();
    }

    /**
     * Load submitted MIN records.
     * Replace with your real API call.
     */
    private loadMINList(): void {
        // this.inventoryService.getdropdowndetails({ p_returntype: 'MIN_LIST' }).subscribe({
        //   next: res => { this.minOptions = res.data; },
        //   error: err => console.error(err)
        // });

        // ── Static mock ───────────────────────────────────────────────────
        this.minOptions = [];
    }

    /**
     * Load projects.
     * Replace with your real API call.
     */
    private loadProjects(): void {
        const payload = { returnType: 'ACTIVEPROJECT', returnValue: '', username: '', option1: this.companyId, option2: null };
        this.inventoryService.getparameterbased(payload).subscribe({ next: (res: any) => (this.projectOptions = res.data ?? []), error: (err) => console.error(err) });
    }

    onProjectChange(event: any): void {
        const projectId = event.value;
        this.workList = [];
        this.towerOptions = [];
        this.levelOptions = [];
        this.pourOptions = [];
        this.minForm.patchValue({ p_tower: null, p_level: null, p_pour: null }, { emitEvent: false });
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

    onTowerChange(event: any): void {
        const towerId = event.value;
        this.levelOptions = this.workList.filter((work) => work.tower_block_id === towerId).reduce((levels: any[], work) => {
            if (!levels.some((level) => level.value === work.level_name)) levels.push({ label: work.level_name, value: work.level_name });
            return levels;
        }, []);
        this.pourOptions = [];
        this.minForm.patchValue({ p_level: null, p_pour: null }, { emitEvent: false });
    }

    onLevelChange(event: any): void {
        const towerId = this.minForm.get('p_tower')?.value;
        this.pourOptions = this.workList.filter((work) => work.tower_block_id === towerId && work.level_name === event.value).reduce((pours: any[], work) => {
            if (!pours.some((pour) => pour.value === work.pour_name)) pours.push({ label: work.pour_name, value: work.pour_name });
            return pours;
        }, []);
        this.minForm.patchValue({ p_pour: null }, { emitEvent: false });
    }

    /**
     * Load requesters (site engineers, supervisors).
     * Replace with your real API call.
     */
    private loadRequestedBy(): void {
        const payload = { p_returntype: 'REQUESTEDBY', p_returnvalue: this.companyId, p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({ next: (res: any) => (this.requestedByOptions = res.data ?? []), error: (err) => console.error(err) });
    }

    private loadReturnFromOptions(): void {
        this.returnFromOptions = [
            { label: 'Column Casting Team', value: 'column-casting' },
            { label: 'Slab Team', value: 'slab-team' },
            { label: 'Finishing Team', value: 'finishing-team' }
        ];
    }

    private loadStoreOptions(): void {
        this.storeOptions = [
            { label: 'Main Store', value: 'main-store' },
            { label: 'Tower A Store', value: 'tower-a-store' },
            { label: 'Tower B Store', value: 'tower-b-store' }
        ];
    }

    private loadLinkedMinOptions(): void {
        this.linkedMinOptions = [
            { label: 'MIN/2025-26/0001', value: 'MIN/2025-26/0001' },
            { label: 'MIN/2025-26/0002', value: 'MIN/2025-26/0002' }
        ];
    }

    private loadReturnTypeOptions(): void {
        this.returnTypeOptions = [
            { label: 'Excess Material', value: 'excess-material' },
            { label: 'Damaged / Unused', value: 'damaged-unused' },
            { label: 'Transfer Return', value: 'transfer-return' }
        ];
    }

    private loadReturnReasonOptions(): void {
        this.returnReasonOptions = [
            { label: 'Excess Stock', value: 'Excess Stock' },
            { label: 'Damaged/Unused', value: 'Damaged/Unused' },
            { label: 'Wrong Issue', value: 'Wrong Issue' }
        ];
    }

    private loadReturnConditionOptions(): void {
        this.returnConditionOptions = [
            { label: 'Good', value: 'Good' },
            { label: 'Sealed', value: 'Sealed' },
            { label: 'Damaged', value: 'Damaged' }
        ];
    }

    /**
     * Load available items for the Add Item dialog.
     * Replace with your real API call.
     */
    private loadItems(): void {
        // this.inventoryService.getdropdowndetails({ p_returntype: 'STOCK_ITEMS' }).subscribe({
        //   next: res => { this.itemOptions = res.data; },
        //   error: err => console.error(err)
        // });

        // ── Static mock ───────────────────────────────────────────────────
        this.itemOptions = [
            { itemid: 1, itemcode: 'MAT001', itemname: 'Cement OPC 53', uom: 'Bag',  currentstock: 1000, reservedqty: 100, availableqty: 900 },
            { itemid: 2, itemcode: 'MAT002', itemname: 'Steel 12mm',    uom: 'Kg',   currentstock: 5000, reservedqty: 500, availableqty: 4500 },
            { itemid: 3, itemcode: 'MAT003', itemname: 'Sand (River)',   uom: 'CFT',  currentstock: 800,  reservedqty: 50,  availableqty: 750 },
            { itemid: 4, itemcode: 'MAT004', itemname: 'Bricks',        uom: 'Nos',  currentstock: 10000,reservedqty: 200, availableqty: 9800 }
        ];
    }

    // ── MIN dropdown: load a submitted MIN back into the form ──────────────
    onMINSelect(event: any): void {
        if (!event.value) return;

        // Replace with your real API call:
        // this.inventoryService.getdropdowndetails({
        //   p_returntype: 'MIN_DETAIL', p_returnvalue: event.value
        // }).subscribe(res => {
        //   const d = res.data[0];
        //   this.minForm.patchValue({
        //     p_issuedate:   d.issuedate   ? new Date(d.issuedate) : null,
        //     p_project:     d.project,
        //     p_tower:       d.tower,
        //     p_level:       d.level,
        //     p_pour:        d.pour,
        //     p_requestedby: d.requestedby,
        //     p_remarks:     d.remarks
        //   });
        //   this.issueItems = res.data.items || [];
        // });
    }

    // ── Table qty logic ────────────────────────────────────────────────────
    onIssueQtyChange(item: IssueItem): void {
        const issued    = Number(item.issueqty    || 0);
        const available = Number(item.returnableqty || 0);

        // Cap at available
        if (issued > available) {
            item.issueqty = available;
        }
        if (issued < 0) {
            item.issueqty = 0;
        }

        item.balance = available - Number(item.issueqty);
        item.amount = Number(item.issueqty || 0) * Number(item.rate || 0);
    }

    removeItem(index: number): void {
        this.confirmationService.confirm({
            message:                'Remove this item from the list?',
            header:                 'Confirm',
            acceptLabel:            'Yes',
            rejectLabel:            'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.issueItems = this.issueItems.filter((_, i) => i !== index);
            }
        });
    }

    // ── Totals ─────────────────────────────────────────────────────────────
    get totalRequestedQty(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.requestedqty) || 0), 0);
    }

    get totalIssueQty(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.issueqty) || 0), 0);
    }

    get totalBalance(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.balance) || 0), 0);
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
                summary:  'Validation Failed',
                detail:   'Please fill all required fields.',
                life:     3000
            });
            return;
        }

        if (this.issueItems.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary:  'No Items',
                detail:   'Please add at least one item before submitting.',
                life:     3000
            });
            return;
        }

        this.confirmationService.confirm({
            message:                'Are you sure you want to submit this Material Issue Note?',
            header:                 'Confirm Submission',
            acceptLabel:            'Yes, Submit',
            rejectLabel:            'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: ()             => this.saveMIN()
        });
    }

// ── Direct inline item select (replaces dialog) ───────────────────────────
onDirectItemSelect(event: any): void {
    if (!event.value) return;

    const item = this.itemOptions.find(i => i.itemid === event.value);
    if (!item) return;

    // Prevent duplicate
    const exists = this.issueItems.find(i => i.itemid === item.itemid);
    if (exists) {
        this.messageService.add({
            severity: 'warn',
            summary:  'Duplicate Item',
            detail:   `${item.itemname} is already in the list.`,
            life:     2500
        });
        // Clear dropdown
        this.selectedItemId = null;
        return;
    }

    // Add row immediately with issueqty = 0 (user fills it in the table)
    const newRow: IssueItem = {
        itemcode:     item.itemcode,
        itemname:     item.itemname,
        itemid:       item.itemid,
        uom:          item.uom,
        currentstock: item.currentstock,
        reservedqty:  item.reservedqty,
        availableqty: item.availableqty,
        requestedqty: item.availableqty,
        issuedqty:    item.availableqty,
        alreadyreturnedqty: 0,
        returnableqty: item.availableqty,
        issueqty:     0,
        returnreason: 'Excess Stock',
        returncondition: 'Good',
        rate:         Number(item['rate'] || 0),
        amount:       0,
        balance:      item.availableqty
    };

    this.issueItems = [...this.issueItems, newRow];

    // Clear dropdown so user can pick another item
    this.selectedItemId = null;
    this.minForm.get('p_selecteditem')?.setValue(null); 

    this.messageService.add({
        severity: 'success',
        summary:  'Item Added',
        detail:   `${item.itemname} added — enter Issue Qty in the table.`,
        life:     2000
    });
}

  private saveMIN(): void {
    const formVal  = this.minForm.getRawValue();
    const newMINNo = this.generateMINNo();

    const payload = {
        p_minno:       newMINNo,
        p_issuedate:   this.datePipe.transform(formVal.p_issuedate, 'dd/MM/yyyy'),
        p_project:     formVal.p_project,
        p_tower:       formVal.p_tower,
        p_returnfrom:  formVal.p_returnfrom,
        p_store:       formVal.p_store,
        p_linkedminno: formVal.p_linkedminno,
        p_mindate:     this.datePipe.transform(formVal.p_mindate, 'dd/MM/yyyy'),
        p_returntype:  formVal.p_returntype,
        p_level:       formVal.p_level,
        p_pour:        formVal.p_pour,
        p_requestedby: formVal.p_requestedby,
        p_issuedby:    formVal.p_issuedby,
        p_remarks:     formVal.p_remarks,
        p_items:       this.issueItems.map(it => ({
            itemid:       it.itemid,
            itemcode:     it.itemcode,
            uom:          it.uom,
            issuedqty:    it.issuedqty,
            alreadyreturnedqty: it.alreadyreturnedqty,
            returnableqty: it.returnableqty,
            returnqty:    it.issueqty,
            returnreason: it.returnreason,
            returncondition: it.returncondition,
            rate:         it.rate,
            amount:       it.amount
        }))
    };

    // ── Wire your real API here ────────────────────────────────────────────
    // this.inventoryService.saveMaterialIssueNote(payload).subscribe({
    //   next: res => {
    //     const minno = res.data[0]?.minno;
    //     this.afterSaveSuccess(minno);
    //   },
    //   error: err => {
    //     this.messageService.add({ severity: 'error', summary: 'Error',
    //       detail: 'Failed to save. Please try again.', life: 3000 });
    //   }
    // });

    // ── Mock — remove once API is wired ───────────────────────────────────
    this.afterSaveSuccess(newMINNo);
    console.log('MIN Payload:', payload);
}

private afterSaveSuccess(minno: string): void {
    // 1. Add to dropdown list
    this.minOptions = [...this.minOptions, { minno }];

    // 2. Set the value on the form control
    this.minForm.get('p_minno')?.setValue(minno);

    // 3. Show success toast
    this.messageService.add({
        severity: 'success',
        summary:  'Submitted',
        detail:   `Material Issue Note ${minno} submitted successfully.`,
        life:     3000
    });
}

    // ── Reset ──────────────────────────────────────────────────────────────
    onReset(): void {
        const currentUser = this.authService.isLogIntType()?.username || 'Current User';
        this.minForm.reset(
           {p_issuedate:this.today}
        );
        this.minForm.patchValue({
            p_issuedby: currentUser,
            p_returnfrom: null,
            p_store: null,
            p_linkedminno: null,
            p_mindate: null,
            p_returntype: null
        });
        this.issueItems          = [];
    }

    // ── Utility ────────────────────────────────────────────────────────────
    private generateMINNo(): string {
        this.minCounter++;
        return `MIN-${String(this.minCounter).padStart(5, '0')}`;
    }
}