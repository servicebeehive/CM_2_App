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

/** A single row in the return items table */
export interface ReturnItem {
    itemcode:     string;
    itemname:     string;
    itemid:       number;
    uom:          string;
    currentstock: number;
    reservedqty:  number;
    issuedqty:    number;   // from the original MIN
    returnqty:    number;   // user input
    balance:      number;   // issuedqty - returnqty
}

/** Shape of a MIN record in the dropdown */
export interface MINOption {
    minno:      string;
    issuedate?: string;
    project?:   string;
    tower?:     string;
    level?:     string;
    pour?:      string;
    requestedby?: string;
    issuedby?:  string;
    remarks?:   string;
    items?:     ReturnItem[];
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
        DropdownModule,
        InputNumberModule,
        InputTextModule,
        TableModule,
        TooltipModule
    ],
    templateUrl: './material-return.component.html',
    styleUrl: './material-return.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class MaterialReturnComponent implements OnInit {

    // ── Auth ───────────────────────────────────────────────────────────────
    private authService = inject(AuthService);

    // ── Form ───────────────────────────────────────────────────────────────
    mrnForm!: FormGroup;

    // ── Today cap ──────────────────────────────────────────────────────────
    today: Date = new Date();

    // ── Table rows ─────────────────────────────────────────────────────────
    returnItems: ReturnItem[] = [];

    // ── Dropdown options ───────────────────────────────────────────────────

    /** Already-submitted MRN records */
    mrnOptions: { mrnno: string }[] = [];

    /** Approved MIN records to return against */
    minOptions: MINOption[] = [];

    projectOptions:     { label: string; value: string }[] = [];
    towerOptions:       { label: string; value: string }[] = [];
    requestedByOptions: { label: string; value: string }[] = [];
    levelOptions: { label: string; value: string }[] = [];
pourOptions:  { label: string; value: string }[] = [];

    // ── MRN counter ────────────────────────────────────────────────────────
    private mrnCounter = 0;

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        public datePipe: DatePipe
    ) {}

    // ── Lifecycle ──────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.initForm();
        this.loadDropdowns();
    }

    // ── Form ───────────────────────────────────────────────────────────────
    private initForm(): void {
        const currentUser = this.authService.isLogIntType()?.username || 'Current User';

        this.mrnForm = this.fb.group({
            p_mrnno:       [''],
            p_mrndate:     [this.today, Validators.required],
            p_minno:       [null, Validators.required],
            p_issuedate:   [{ value: null, disabled: true }],
            p_project:     [null, Validators.required],
            p_tower:       [null, Validators.required],
            p_level:       [null],
            p_pour:        [null],
            p_requestedby: [null, Validators.required],
            p_issuedby:    [{ value: currentUser, disabled: true }],
            p_remarks:     ['', Validators.maxLength(500)]
        });
    }

    // ── Load dropdowns ─────────────────────────────────────────────────────
    private loadDropdowns(): void {
        this.loadMRNList();
        this.loadMINList();
        this.loadProjects();
        this.loadTowers();
        this.loadRequestedBy();
        this.loadLevels();
        this.loadPours();
    }

    private loadLevels(): void {
    // Replace with your real API call:
    // this.inventoryService.getdropdowndetails({ p_returntype: 'LEVEL' }).subscribe({
    //   next: res => {
    //     this.levelOptions = res.data.map((d: any) => ({ label: d.levelname, value: d.levelid }));
    //   }
    // });

    // ── Static mock ───────────────────────────────────────────────────────
    this.levelOptions = [
        { label: 'Basement',   value: 'B'  },
        { label: 'Ground (G)', value: 'G'  },
        { label: 'Level 1',    value: 'L1' },
        { label: 'Level 2',    value: 'L2' },
        { label: 'Level 3',    value: 'L3' },
        { label: 'Level 4',    value: 'L4' },
        { label: 'Level 5',    value: 'L5' },
        { label: 'Terrace',    value: 'TR' },
    ];
}

private loadPours(): void {
    // Replace with your real API call:
    // this.inventoryService.getdropdowndetails({ p_returntype: 'POUR' }).subscribe({
    //   next: res => {
    //     this.pourOptions = res.data.map((d: any) => ({ label: d.pourname, value: d.pourid }));
    //   }
    // });

    // ── Static mock ───────────────────────────────────────────────────────
    this.pourOptions = [
        { label: 'Pour 1',    value: 'P1' },
        { label: 'Pour 2',    value: 'P2' },
        { label: 'Pour 3',    value: 'P3' },
        { label: 'Pour 4',    value: 'P4' },
        { label: 'Slab Pour', value: 'SP' },
        { label: 'Column',    value: 'CL' },
        { label: 'Beam',      value: 'BM' },
        { label: 'Footing',   value: 'FT' },
    ];
}

    /**
     * Load submitted MRN records for the top dropdown.
     * Replace with your real API call.
     */
    private loadMRNList(): void {
        // this.inventoryService.getdropdowndetails({ p_returntype: 'MRN_LIST' }).subscribe({
        //   next: res => { this.mrnOptions = res.data; },
        //   error: err => console.error(err)
        // });
        this.mrnOptions = []; // populated after submit
    }

    /**
     * Load approved MIN records.
     * Replace with your real API call.
     */
    private loadMINList(): void {
        // this.inventoryService.getdropdowndetails({ p_returntype: 'MIN_LIST' }).subscribe({
        //   next: res => { this.minOptions = res.data; },
        //   error: err => console.error(err)
        // });

        // ── Static mock ───────────────────────────────────────────────────
        this.minOptions = [
            {
                minno:        'MIN-00001',
                issuedate:    '2026-06-10',
                project:      'PA',
                tower:        'TA',
                level:        '1',
                pour:         '2',
                requestedby:  'rajesh',
                issuedby:     'admin',
                remarks:      '',
                items: [
                    { itemcode: 'MAT001', itemname: 'Cement OPC 53', itemid: 1, uom: 'Bag', currentstock: 1000, reservedqty: 100, issuedqty: 900,  returnqty: 0, balance: 900 },
                    { itemcode: 'MAT002', itemname: 'Steel 12mm',    itemid: 2, uom: 'Kg',  currentstock: 5000, reservedqty: 500, issuedqty: 4500, returnqty: 0, balance: 4500 }
                ]
            },
            {
                minno:        'MIN-00002',
                issuedate:    '2026-06-11',
                project:      'PB',
                tower:        'TB',
                level:        '2',
                pour:         '1',
                requestedby:  'amit',
                issuedby:     'admin',
                remarks:      '',
                items: [
                    { itemcode: 'MAT003', itemname: 'Sand (River)', itemid: 3, uom: 'CFT', currentstock: 800, reservedqty: 50, issuedqty: 200, returnqty: 0, balance: 200 }
                ]
            }
        ];
    }

    /**
     * Load projects.
     * Replace with your real API call.
     */
    private loadProjects(): void {
        // this.inventoryService.getdropdowndetails({ p_returntype: 'PROJECT' }).subscribe({
        //   next: res => {
        //     this.projectOptions = res.data.map((d: any) => ({ label: d.projectname, value: d.projectid }));
        //   }
        // });
        this.projectOptions = [
            { label: 'Project A', value: 'PA' },
            { label: 'Project B', value: 'PB' },
            { label: 'Project C', value: 'PC' }
        ];
    }

    /**
     * Load towers / blocks.
     * Replace with your real API call.
     */
    private loadTowers(): void {
        // this.inventoryService.getdropdowndetails({ p_returntype: 'TOWER' }).subscribe({
        //   next: res => {
        //     this.towerOptions = res.data.map((d: any) => ({ label: d.towername, value: d.towerid }));
        //   }
        // });
        this.towerOptions = [
            { label: 'Tower A', value: 'TA' },
            { label: 'Tower B', value: 'TB' },
            { label: 'Block C', value: 'BC' }
        ];
    }

    /**
     * Load requesters.
     * Replace with your real API call.
     */
    private loadRequestedBy(): void {
        // this.inventoryService.getdropdowndetails({ p_returntype: 'SITE_USERS' }).subscribe({
        //   next: res => {
        //     this.requestedByOptions = res.data.map((d: any) => ({ label: d.username, value: d.userid }));
        //   }
        // });
        this.requestedByOptions = [
            { label: 'Rajesh Kumar', value: 'rajesh' },
            { label: 'Amit Sharma',  value: 'amit' },
            { label: 'Suresh Patel', value: 'suresh' },
            { label: 'Priya Nair',   value: 'priya' }
        ];
    }

    // ── MRN dropdown: reload a saved MRN ──────────────────────────────────
    onMRNSelect(event: any): void {
        if (!event.value) return;

        // Replace with your real API call:
        // this.inventoryService.getdropdowndetails({
        //   p_returntype: 'MRN_DETAIL', p_returnvalue: event.value
        // }).subscribe(res => {
        //   const d = res.data[0];
        //   this.mrnForm.patchValue({ ... });
        //   this.returnItems = res.data.items || [];
        // });
    }

    // ── MIN dropdown: auto-fill header + load items ────────────────────────
    onMINSelect(event: any): void {
        if (!event.value) {
            this.returnItems = [];
            this.mrnForm.patchValue({ p_issuedate: null, p_project: null, p_tower: null, p_level: '', p_pour: '', p_requestedby: null, p_remarks: '' });
            return;
        }

        // Replace with your real API call:
        // this.inventoryService.getdropdowndetails({
        //   p_returntype: 'MIN_DETAIL', p_returnvalue: event.value
        // }).subscribe(res => {
        //   const d = res.data[0];
        //   this.mrnForm.patchValue({
        //     p_issuedate:   d.issuedate   ? new Date(d.issuedate) : null,
        //     p_project:     d.project,
        //     p_tower:       d.tower,
        //     p_level:       d.level,
        //     p_pour:        d.pour,
        //     p_requestedby: d.requestedby,
        //     p_remarks:     d.remarks
        //   });
        //   this.returnItems = res.data.items.map((it: any) => ({
        //     ...it, returnqty: 0, balance: it.issuedqty
        //   }));
        // });

        // ── Mock: load from static data ────────────────────────────────────
        const min = this.minOptions.find(m => m.minno === event.value);
        if (!min) return;

        this.mrnForm.patchValue({
            p_issuedate:   min['issuedate'] ? new Date(min['issuedate']) : null,
            p_project:     min['project']     || null,
            p_tower:       min['tower']       || null,
            p_level:       min['level']       || '',
            p_pour:        min['pour']        || '',
            p_requestedby: min['requestedby'] || null,
            p_remarks:     min['remarks']     || ''
        });

        this.returnItems = (min['items'] || []).map((it: any) => ({
            ...it,
            returnqty: 0,
            balance:   it.issuedqty
        }));
    }

    // ── Return qty logic ───────────────────────────────────────────────────

    /** Called when user edits Return Qty — auto-calculates balance */
    onReturnQtyChange(item: ReturnItem): void {
        let returnqty = Number(item.returnqty || 0);

        // Cap at issued qty
        if (returnqty > item.issuedqty) {
            item.returnqty = item.issuedqty;
            returnqty      = item.issuedqty;
        }
        if (returnqty < 0) {
            item.returnqty = 0;
            returnqty      = 0;
        }

        item.balance = item.issuedqty - returnqty;
    }

    removeItem(index: number): void {
        this.confirmationService.confirm({
            message:                'Remove this item from the return list?',
            header:                 'Confirm',
            acceptLabel:            'Yes',
            rejectLabel:            'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.returnItems = this.returnItems.filter((_, i) => i !== index);
            }
        });
    }

    // ── Totals ─────────────────────────────────────────────────────────────
    get totalIssuedQty(): number {
        return this.returnItems.reduce((s, it) => s + (Number(it.issuedqty)  || 0), 0);
    }

    get totalReturnQty(): number {
        return this.returnItems.reduce((s, it) => s + (Number(it.returnqty) || 0), 0);
    }

    get totalBalance(): number {
        return this.returnItems.reduce((s, it) => s + (Number(it.balance)   || 0), 0);
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    onSubmit(): void {
        this.mrnForm.markAllAsTouched();

        if (this.mrnForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary:  'Validation Failed',
                detail:   'Please fill all required fields.',
                life:      3000
            });
            return;
        }

        if (this.returnItems.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary:  'No Items',
                detail:   'Please select a MIN No to load items for return.',
                life:      3000
            });
            return;
        }

        const hasReturnQty = this.returnItems.some(it => Number(it.returnqty) > 0);
        if (!hasReturnQty) {
            this.messageService.add({
                severity: 'warn',
                summary:  'No Return Qty',
                detail:   'Please enter a return quantity for at least one item.',
                life:      3000
            });
            return;
        }

        this.confirmationService.confirm({
            message:                'Are you sure you want to submit this Material Return Note?',
            header:                 'Confirm Submission',
            acceptLabel:            'Yes, Submit',
            rejectLabel:            'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept:                 () => this.saveMRN()
        });
    }

    private saveMRN(): void {
        const formVal  = this.mrnForm.getRawValue();
        const newMRNNo = this.generateMRNNo();

        const payload = {
            p_mrnno:       newMRNNo,
            p_mrndate:     this.datePipe.transform(formVal.p_mrndate,   'dd/MM/yyyy'),
            p_minno:       formVal.p_minno,
            p_issuedate:   this.datePipe.transform(formVal.p_issuedate, 'dd/MM/yyyy'),
            p_project:     formVal.p_project,
            p_tower:       formVal.p_tower,
            p_level:       formVal.p_level,
            p_pour:        formVal.p_pour,
            p_requestedby: formVal.p_requestedby,
            p_issuedby:    formVal.p_issuedby,
            p_remarks:     formVal.p_remarks,
            p_items:       this.returnItems
                .filter(it => Number(it.returnqty) > 0)
                .map(it => ({
                    itemid:    it.itemid,
                    itemcode:  it.itemcode,
                    uom:       it.uom,
                    issuedqty: it.issuedqty,
                    returnqty: it.returnqty,
                    balance:   it.balance
                }))
        };

        // Replace with your real API call:
        // this.inventoryService.saveMaterialReturnNote(payload).subscribe({
        //   next: res => {
        //     const mrnno = res.data[0]?.mrnno;
        //     this.mrnOptions = [...this.mrnOptions, { mrnno }];
        //     this.mrnForm.patchValue({ p_mrnno: mrnno });
        //     this.messageService.add({
        //       severity: 'success', summary: 'Success',
        //       detail: `Material Return Note ${mrnno} submitted.`, life: 3000
        //     });
        //   },
        //   error: err => {
        //     this.messageService.add({
        //       severity: 'error', summary: 'Error',
        //       detail: 'Failed to save. Please try again.', life: 3000
        //     });
        //   }
        // });

        // ── Mock success — remove once API is wired ────────────────────────
        this.mrnOptions = [...this.mrnOptions, { mrnno: newMRNNo }];
        this.mrnForm.patchValue({ p_mrnno: newMRNNo });

        this.messageService.add({
            severity: 'success',
            summary:  'Submitted',
            detail:   `Material Return Note ${newMRNNo} submitted successfully.`,
            life:      3000
        });

        console.log('MRN Payload:', payload);
    }

    // ── Reset ──────────────────────────────────────────────────────────────
    onReset(): void {
        const currentUser = this.authService.isLogIntType()?.username || 'Current User';
        this.mrnForm.reset();
        this.mrnForm.patchValue({
            p_mrndate:  this.today,
            p_issuedby: currentUser
        });
        this.returnItems = [];
    }

    // ── Utility ────────────────────────────────────────────────────────────
    private generateMRNNo(): string {
        this.mrnCounter++;
        return `MRN-${String(this.mrnCounter).padStart(5, '0')}`;
    }
}