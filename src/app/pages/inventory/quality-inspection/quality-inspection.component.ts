import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    AbstractControl,
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

// ── Replace with your real service imports ────────────────────────────────────
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
// ─────────────────────────────────────────────────────────────────────────────

/** Single row in the inspection table */
export interface InspectionItem {
    material: string;
    itemid: number;
    receivedqty: number;
    acceptedqty: number;
    rejectedqty: number;

    inspectedby?: string;
    inspectiondate?: Date;
    status?: string;
    remarks?: string;
}

@Component({
    selector: 'app-quality-inspection',
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
    templateUrl: './quality-inspection.component.html',
    styleUrl: './quality-inspection.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class QualityInspectionComponent implements OnInit {

    // ── Form ───────────────────────────────────────────────────────────────
    qiForm!: FormGroup;

    // ── Today cap for date pickers ─────────────────────────────────────────
    today: Date = new Date();

    // ── Table data ─────────────────────────────────────────────────────────
    inspectionItems: InspectionItem[] = [];

    // ── File upload state ──────────────────────────────────────────────────
    fileNames: { qualityreport: string; } = {
        qualityreport: '',
    };
    uploadedFiles: {
        qualityreport: File | null;
    } = {
        qualityreport: null,
    };

    // ── Dropdown options ───────────────────────────────────────────────────

    /** Already-submitted GRQ records (for the top dropdown) */
    grqOptions: { grqno: string; [key: string]: any }[] = [];

    /** Approved GRN records to link this inspection to */
    grnOptions: { grnno: string; [key: string]: any }[] = [];

    /** Users / QC engineers who can perform the inspection */
    inspectionByOptions: { label: string; value: string }[] = [];

    /** Inspection outcome statuses */
    inspectionStatusOptions: { label: string; value: string }[] = [
        { label: 'Accepted',          value: 'Accepted' },
        { label: 'Partially Accepted', value: 'Partial' },
        { label: 'Rejected',          value: 'Rejected' }
    ];

    // ── Loading flags ──────────────────────────────────────────────────────
    isLoadingGRN = false;

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

    // ── Form initialisation ────────────────────────────────────────────────
    private initForm(): void {
        this.qiForm = this.fb.group({
            p_grqno:              [''],                        // auto generated, optional
            p_grqdate:            [this.today, Validators.required],
            p_grnno:              [null, Validators.required]
        });
    }

    // ── Load all dropdowns ─────────────────────────────────────────────────
    private loadDropdowns(): void {
        this.loadGRQList();
        this.loadGRNList();
        this.loadInspectionByOptions();
    }

    /**
     * Load already-submitted GRQ records.
     * Replace body with your real API call.
     */
    private loadGRQList(): void {
        // Example:
        // this.inventoryService.getdropdowndetails({ p_returntype: 'GRQ_LIST' }).subscribe({
        //   next: res => { this.grqOptions = res.data; },
        //   error: err => console.error(err)
        // });

        // ── Static mock — remove once API is wired ─────────────────────────
        this.grqOptions = [
            { grqno: 'GRQ-00001' },
            { grqno: 'GRQ-00002' }
        ];
    }

    /**
     * Load approved GRN records for the GRN No dropdown.
     * Replace body with your real API call.
     */
    private loadGRNList(): void {
        this.isLoadingGRN = true;
        // Example:
        // this.inventoryService.getdropdowndetails({ p_returntype: 'APPROVED_GRN' }).subscribe({
        //   next: res => { this.grnOptions = res.data; this.isLoadingGRN = false; },
        //   error: () => this.isLoadingGRN = false
        // });

        // ── Static mock — remove once API is wired ─────────────────────────
        this.grnOptions = [
            {
                grnno: 'GRN-00125',
                items: [
                    { grnno:'GRN-00125', material: 'Cement OPC 53', itemid: 1, receivedqty: 500, acceptedqty: 500, rejectedqty: 0, remarks: '' },
                    { grnno:'GRN-00127', material: 'Steel TMT 12mm', itemid: 2, receivedqty: 5500, acceptedqty: 5500, rejectedqty: 0, remarks: '' }
                ]
            },
            {
                grnno: 'GRN-00128',
                items: [
                    { grnno:'GRN-00125', material: 'Copper Wire 2.5mm', itemid: 3, receivedqty: 350, acceptedqty: 350, rejectedqty: 0, remarks: '' }
                ]
            }
        ];
        this.isLoadingGRN = false;
    }

    /**
     * Load inspectors / QC engineers.
     * Replace body with your real API call.
     */
    private loadInspectionByOptions(): void {
        // Example:
        // this.inventoryService.getdropdowndetails({ p_returntype: 'QC_USERS' }).subscribe({
        //   next: res => {
        //     this.inspectionByOptions = res.data.map((d: any) => ({ label: d.username, value: d.userid }));
        //   },
        //   error: err => console.error(err)
        // });

        // ── Static mock — remove once API is wired ─────────────────────────
        this.inspectionByOptions = [
            { label: 'Rajesh Kumar',  value: 'rajesh' },
            { label: 'Amit Sharma',   value: 'amit' },
            { label: 'Suresh Patel',  value: 'suresh' },
            { label: 'Priya Nair',    value: 'priya' }
        ];
    }

    // ── GRQ dropdown: load a previously submitted GRQ ─────────────────────
    onGRQSelect(event: any): void {
        if (!event.value) return;
        // Replace with your API call to fetch full GRQ details:
        // this.inventoryService.getdropdowndetails({
        //   p_returntype: 'GRQ_DETAIL', p_returnvalue: event.value
        // }).subscribe(res => {
        //   const d = res.data[0];
        //   this.qiForm.patchValue({
        //     p_grqdate:           d.grqdate ? new Date(d.grqdate) : null,
        //     p_grnno:             d.grnno,
        //     p_inspectionby:      d.inspectionby,
        //     p_inspectiondate:    d.inspectiondate ? new Date(d.inspectiondate) : null,
        //     p_inspectionstatus:  d.inspectionstatus,
        //     p_inspectionremarks: d.inspectionremarks
        //   });
        //   this.inspectionItems = res.data.items || [];
        // });
    }

    // ── GRN dropdown: auto-load materials from the selected GRN ───────────
   onGRNSelect(event: any): void {
    if (!event.value) {
        this.inspectionItems = [];
        return;
    }

    const grn = this.grnOptions.find(g => g.grnno === event.value);
    if (grn?.['items']) {
       this.inspectionItems = grn['items'].map((it: any) => ({
    material: it.material,
    itemid: it.itemid,
    receivedqty: it.receivedqty,
    acceptedqty: it.receivedqty,
    rejectedqty: 0,
    inspectedby: null,
    inspectiondate: new Date(),
    status: 'Accepted',
    remarks: ''
}));
    } else {
        this.inspectionItems = [];
    }
}
    // ── Table qty logic ────────────────────────────────────────────────────

    /** Rejected qty auto-calculates: received - accepted */
    onAcceptedQtyChange(item: InspectionItem): void {
        const received = Number(item.receivedqty || 0);
        let   accepted = Number(item.acceptedqty || 0);

        // Cap accepted at received
        if (accepted > received) {
            item.acceptedqty = received;
            accepted         = received;
        }
        if (accepted < 0) {
            item.acceptedqty = 0;
            accepted         = 0;
        }

        item.rejectedqty = received - accepted;

        // Auto-set status based on totals
        this.autoSetStatus();
    }

    /** Auto-suggest inspection status based on rejected counts */
    private autoSetStatus(): void {
        const totalRej = this.totalRejected;
        const totalRec = this.totalReceived;

        if (totalRej === 0) {
            this.qiForm.patchValue({ p_inspectionstatus: 'Accepted' });
        } else if (totalRej < totalRec) {
            this.qiForm.patchValue({ p_inspectionstatus: 'Partial' });
        } else {
            this.qiForm.patchValue({ p_inspectionstatus: 'Rejected' });
        }
    }

    // ── Totals ─────────────────────────────────────────────────────────────
    get totalReceived(): number {
        return this.inspectionItems.reduce((s, it) => s + (Number(it.receivedqty) || 0), 0);
    }

    get totalAccepted(): number {
        return this.inspectionItems.reduce((s, it) => s + (Number(it.acceptedqty) || 0), 0);
    }

    get totalRejected(): number {
        return this.inspectionItems.reduce((s, it) => s + (Number(it.rejectedqty) || 0), 0);
    }

    // ── File upload ────────────────────────────────────────────────────────
    onFileSelect(event: Event, type: 'qualityreport'): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;
            this.uploadedFiles[type] = input.files[0];
            this.fileNames[type]     = input.files[0].name;
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    onSubmit(): void {
        this.qiForm.markAllAsTouched();

        if (this.qiForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary:  'Validation Failed',
                detail:   'Please fill all required fields.',
                life:     3000
            });
            return;
        }

        if (this.inspectionItems.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary:  'No Items',
                detail:   'Please select a GRN No to load materials.',
                life:     3000
            });
            return;
        }

        this.confirmationService.confirm({
            message:                'Are you sure you want to submit the quality inspection?',
            header:                 'Confirm Submission',
            acceptLabel:            'Yes, Submit',
            rejectLabel:            'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: ()             => this.saveInspection()
        });
    }

    private saveInspection(): void {
        const formVal = this.qiForm.getRawValue();

        const payload = {
            p_grqdate:            this.datePipe.transform(formVal.p_grqdate,        'dd/MM/yyyy'),
            p_grnno:              formVal.p_grnno,
            p_inspectionby:       formVal.p_inspectionby,
            p_inspectiondate:     this.datePipe.transform(formVal.p_inspectiondate, 'dd/MM/yyyy'),
            p_inspectionstatus:   formVal.p_inspectionstatus,
            p_inspectionremarks:  formVal.p_inspectionremarks,
            p_items: this.inspectionItems.map(it => ({
                itemid:      it.itemid,
                material:    it.material,
                receivedqty: it.receivedqty,
                acceptedqty: it.acceptedqty,
                rejectedqty: it.rejectedqty,
                remarks:     it.remarks
            }))
        };

        // Replace with your real API call:
        // this.inventoryService.saveQualityInspection(payload).subscribe({
        //   next: res => {
        //     const grqno = res.data[0]?.grqno;
        //     this.grqOptions = [...this.grqOptions, { grqno }];
        //     this.qiForm.patchValue({ p_grqno: grqno });
        //     this.messageService.add({
        //       severity: 'success', summary: 'Success',
        //       detail: `Quality inspection ${grqno} submitted.`, life: 3000
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
        const grqno = this.generateGRQNo();
        this.grqOptions = [...this.grqOptions, { grqno }];
        this.qiForm.patchValue({ p_grqno: grqno });
        this.messageService.add({
            severity: 'success',
            summary:  'Submitted',
            detail:   `Quality Inspection ${grqno} saved successfully.`,
            life:     3000
        });

        console.log('QI Payload:', payload);
    }

    // ── Reset ──────────────────────────────────────────────────────────────
    onReset(): void {
        this.qiForm.reset(
            {p_grqdate:this.today}
        );
        this.inspectionItems = [];
        this.fileNames       = { qualityreport: ''};
        this.uploadedFiles   = { qualityreport: null };
    }

    // ── Utility ────────────────────────────────────────────────────────────
    private grqCounter = 0;
    private generateGRQNo(): string {
        this.grqCounter++;
        return `GRQ-${String(this.grqCounter).padStart(5, '0')}`;
    }
}