import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { FileUploadModule } from 'primeng/fileupload';
import { TabsModule } from 'primeng/tabs';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { WorkService } from '@/core/services/work.service';
import { ShareService } from '@/core/services/shared.service';
import { GmailVendorRow, PurchaseDraftPayload, PurchaseOrderItem, PurchaseOrderPayload } from '@/core/models/authmodel/work.model';

export interface PaymentEntry {
    date: Date;
    amount: number;
    mode: string;
    referenceNo: string;
    invoiceNo: string;
    performaInvoiceNo: string;
    invoiceId?: number | null;
    performaId?: number | null;
    remainingAfter: number;
    isEditing?: boolean;
    id?: number | null;
}

export interface PerformaEntry {
    invoiceNo: string;
    date: Date | null;
    amount: number;
    documentPath: string;
    documentDataUrl: string;
    isEditing?: boolean;
    id?: number | null;
}

export interface InvoiceEntry {
    invoiceNo: string;
    date: Date | null;
    performaInvoiceNo: string;
    performaId?: number | null;
    freight: number;
    loadingCharge: number;
    cgst: number;
    totalTaxableAmount: number;
    sgst: number;
    igst: number;
    miscCharge: number;
    grandTotal: number;
    documentPath: string;
    documentDataUrl: string;
    isEditing?: boolean;
    id?: number | null;
}

@Component({
    selector: 'app-purchase-order',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        ChipModule,
        ConfirmDialogModule,
        DatePickerModule,
        DialogModule,
        SelectModule,
        InputNumberModule,
        InputTextModule,
        TableModule,
        TooltipModule,
        TabsModule,
        FileUploadModule,
        MultiSelectModule,
        ToastModule
    ],
    templateUrl: './purchase-order.component.html',
    styleUrl: './purchase-order.component.scss',
    providers: [ConfirmationService, DatePipe, MessageService]
})
export class PurchaseOrderComponent implements OnInit {
    @ViewChild('performaFileInput') performaFileInputRef!: ElementRef<HTMLInputElement>;
    @ViewChild('invoiceFileInput') invoiceFileInputRef!: ElementRef<HTMLInputElement>;
    poForm!: FormGroup;
    today: Date = new Date(new Date().setHours(0, 0, 0, 0));
    submitted = false;
    isDraftPo = false;
    // Skip the "PO date can't be in the past" check when loading an already-saved draft/PO
    private allowPastPoDate = false;
    isLoadingProjects = false;
    isLoadingLocations = false;
    showForecastError = false;
    onPODraftOptions: any[] = [];
    projectOptions: any[] = [];
    activeTabIndex: string = '0';

    paymentTermsOptions: { label: string; value: string }[] = [
        { label: '30 Days Net', value: '30 Days Net' },
        { label: '60 Days Net', value: '60 Days Net' },
        { label: 'Advance Payment', value: 'Advance Payment' },
        { label: 'On Delivery', value: 'On Delivery' }
    ];

    paymentModeOptions: { label: string; value: string }[] = [
        { label: 'Bank Transfer', value: 'Bank Transfer' },
        { label: 'Cash', value: 'Cash' },
        { label: 'Cheque', value: 'Cheque' },
        { label: 'UPI', value: 'UPI' }
    ];

    selectedVendorNames: string[] = [];
    ponoOptions: any[] = [];
    vendorMasterOptions: any[] = [];
    vendorOptionsByRow: any[][] = [];

    showVendorDialog = false;
    showMrDialog = false;
    showPoMailDialog = false;
    allVendorList: any[] = [];
    isLoadingVendorDialog = false;
    vendorDialogRows: { category: string; item: string; vendorId: number | null; rate: number | null }[] = [];
    performaFileName: string = '';
    performaFileDataUrl: string = '';
    showExistingPerformaDate = false;
    invoiceFileName: string = '';
    invoiceFileDataUrl: string = '';

    companyId = '';
    userId = '';
    grandTotal = 0;
    private fromApprovalView = false;
    private approvalType: string | null = null;
    private approvalRequest: string | null = null;
    isLoadingMrPopup = false;
    mrPopupRows: any[] = [];
    includedMrList: any[] = [];
    paymentHistory: PaymentEntry[] = [];
    performaHistory: PerformaEntry[] = [];
    invoiceHistory: InvoiceEntry[] = [];
    performaInvoiceOptions: any[] = [];
    invoiceOptions: any[] = [];
    editingPerformaIndex: number | null = null;
    editingInvoiceIndex: number | null = null;
    editingPaymentIndex: number | null = null;
    totalPaid = 0;
    poMailVendorRows: GmailVendorRow[] = [];
    printHeader: any = {};
    printData: any = null;
   

    newPayment: Partial<PaymentEntry> = {
        date: new Date(),
        amount: 0,
        mode: '',
        referenceNo: '',
        invoiceNo: '',
        performaInvoiceNo: ''
    };

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private authService: AuthService,
        private datePipe: DatePipe,
        private workService: WorkService,
        private router: Router,
        private route: ActivatedRoute,
        private sharedService: ShareService
    ) {}

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid;
        this.userId = this.authService.isLogIntType()?.userid?.toString() ?? '';
        this.fromApprovalView = this.route.snapshot.queryParamMap.get('fromApprovalView') === 'true';
        this.approvalType = this.route.snapshot.queryParamMap.get('p_type');
        this.approvalRequest = this.route.snapshot.queryParamMap.get('p_request');
        this.initForm();
        this.restoreViewState();
        this.loadDropdowns();
    }

    get showBackButton(): boolean {
        return this.fromApprovalView;
    }

    get backRoute(): string[] {
        return ['/layout/action/my-approval'];
    }

    get backQueryParams(): Record<string, string> {
        return this.fromApprovalView ? { p_type: this.approvalType ?? '', p_request: this.approvalRequest ?? 'PENDING' } : {};
    }

    returnToSource(): void {
        this.sharedService.returnToSavedView(this.router, this.backRoute, this.backQueryParams);
    }

    // ── Form initialisation ────────────────────────────────────────────────────
    private initForm(): void {
        this.poForm = this.fb.group(
            {
                p_pono: [null],
                p_draft_id: [null],
                status: [''],
                p_podate: [this.today, Validators.required],
                p_project: [null, Validators.required],
                p_vendor: [{ value: [], disabled: true }],
                p_deliverylocation: [{ value: null, disabled: true }],
                p_deliverydate: [null],
                p_paymentterms: [{ value: null, disabled: true }],
                p_paymentdate: [this.today],
                p_remarks: [''],
                p_forecastrefno: [''],
                p_items: this.fb.array([]),
                // ── Performa fields ──
                p_performainvoiceno: ['', Validators.required],
                p_performadate: [this.today, [Validators.required, this.noFutureDateValidator()]],
                p_performafile: [null, Validators.required],
                p_performaamount: [null, [Validators.required, Validators.min(0)]],

                // ── Invoice fields ──
                p_invoiceno: ['', Validators.required],
                p_invoicedate: [null, Validators.required],
                p_invoicepayment: [null, [Validators.required, Validators.min(0)]],
                p_invoicefile: [null, Validators.required],
                p_freight: [null],
                p_loadingcharge: [null],
                p_cgst: [null],
                p_sgst: [null],
                p_igst: [null],
                p_totaltaxableamount: [{ value: null, disabled: true }],
                p_misccharge: [null],
                p_grandtotal: [{ value: null, disabled: true }],
                p_performainvoiceno_invoice: [''],

               // ── Payment fields ──
p_payment: [null],
p_totalpoamount: [{ value: null, disabled: true }],
p_totalinvoiceamount: [{ value: null, disabled: true }],
p_remaininginvoiceamount: [{ value: null, disabled: true }],
p_totalpayment: [{ value: '', disabled: true }],
p_remainingpayment: [{ value: '', disabled: true }]
            },
            { validators: this.dateRangeValidator() }
        );

        this.poForm.get('p_podate')?.valueChanges.subscribe(() => {
            this.poForm.get('p_deliverydate')?.updateValueAndValidity();
        });

        this.poForm.get('p_pono')?.valueChanges.subscribe((poId) => {
            this.updatePostPoValidators(poId != null && poId !== '');
        });
        this.updatePostPoValidators(false);

        ['p_invoicepayment', 'p_freight', 'p_loadingcharge', 'p_cgst', 'p_sgst', 'p_igst', 'p_misccharge'].forEach((ctrlName) => {
            this.poForm.get(ctrlName)?.valueChanges.subscribe(() => this.calculateGrandTotals());
        });

        this.poForm.get('p_cgst')?.valueChanges.subscribe((value) => {
            this.syncTaxFields('p_cgst', 'p_sgst', value);
        });
        this.poForm.get('p_sgst')?.valueChanges.subscribe((value) => {
            this.syncTaxFields('p_sgst', 'p_cgst', value);
        });
        this.poForm.get('p_igst')?.valueChanges.subscribe((value) => {
            if (value !== null && value !== undefined && value !== '') {
                this.poForm.patchValue({ p_cgst: null, p_sgst: null }, { emitEvent: false });
            }
        });

        ['p_invoicepayment', 'p_freight'].forEach((ctrlName) => {
            this.poForm.get(ctrlName)?.valueChanges.subscribe(() => this.recalcPayments());
        });
    }

    private updatePostPoValidators(hasPo: boolean): void {
        const validators: Record<string, ValidatorFn[]> = {
            p_performainvoiceno: hasPo ? [Validators.required] : [],
            p_performadate: hasPo ? [Validators.required, this.noFutureDateValidator()] : [],
            p_performafile: hasPo ? [Validators.required] : [],
            p_performaamount: hasPo ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
            p_invoiceno: hasPo ? [Validators.required] : [],
            p_invoicedate: hasPo ? [Validators.required] : [],
            p_invoicepayment: hasPo ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
            p_invoicefile: hasPo ? [Validators.required] : []
        };

        Object.entries(validators).forEach(([controlName, controlValidators]) => {
            const control = this.poForm.get(controlName);
            control?.setValidators(controlValidators);
            control?.updateValueAndValidity({ emitEvent: false });
        });
    }

    private syncTaxFields(sourceName: 'p_cgst' | 'p_sgst', targetName: 'p_cgst' | 'p_sgst', value: unknown): void {
        this.poForm.get(targetName)?.setValue(value === '' ? null : value, { emitEvent: false });

        if (value !== null && value !== undefined && value !== '') {
            this.poForm.get('p_igst')?.setValue(null, { emitEvent: false });
        }
    }

    private restoreViewState(): void {
        const state = history.state?.returnViewState;
        if (!state) return;

        this.poForm.patchValue(state.formValue ?? {}, { emitEvent: false });
        this.poItemArray.clear();
        (state.items ?? []).forEach((item: any) => this.poItemArray.push(this.fb.group(item)));
        this.selectedVendorNames = state.selectedVendorNames ?? [];
        this.grandTotal = state.grandTotal ?? 0;
        this.submitted = state.submitted ?? false;
    }

    // ── FormArray accessor ─────────────────────────────────────────────────────
    get poItemArray(): FormArray {
        return this.poForm.get('p_items') as FormArray;
    }

    getRowGroup(i: number): FormGroup {
        return this.poItemArray.at(i) as FormGroup;
    }

    get isPaymentEntryDisabled(): boolean {
    return this.getRemainingPayment() <= 0 && this.paymentHistory.length > 0 && this.editingPaymentIndex === null;
}

    // ── Load all dropdowns ─────────────────────────────────────────────────────
    private loadDropdowns(): void {
        this.onGetPONo();
        this.onGetProject();
        this.onGetDraftPO();
        this.loadVendorMaster();
    }

    private onGetPONo(): void {
        const payload = this.createReturnPayload('PONO', this.companyId.toString(), this.authService.isLogIntType().userid.toString());
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.ponoOptions = res.data ?? [];
                const poId = this.route.snapshot.queryParamMap.get('poId');
                if (poId) {
                    const po = this.ponoOptions.find((item) => String(item.po_id) === poId);
                    if (po) this.onPOChange({ value: po.po_id });
                }
            },
            error: (err: any) => {
                console.error('Error fetching PO numbers:', err);
                this.ponoOptions = [];
            }
        });
    }

    private loadVendorMaster(): void {
        const payload = this.createReturnPayload('VENDORLIST', this.companyId.toString());

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.vendorMasterOptions = res.data ?? [];
            },
            error: (err: any) => {
                console.error('Error fetching vendor master:', err);
                this.vendorMasterOptions = [];
            }
        });
    }

    onGetPerforma(){
        const po = this.poForm.get('p_pono')?.value;
        if(po){
        const payload = {
            p_returntype: 'PERFORMALIST',
            p_username: po.toString()
        }
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res: any) => {
               this.performaInvoiceOptions = Array.isArray(res?.data) ? res.data : [];
            },
            error: (err: any) => {
                console.error('Error fetching performa list:', err);
            }
        });
    }
    }

    onGetPerformaInvoice(){
        const po = this.poForm.get('p_pono')?.value;
        if(po){
        const payload = {
            p_returntype: 'POINVOICELIST',
            p_username: po
        }
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.invoiceOptions = Array.isArray(res?.data) ? res.data : [];
            },
            error: (err: any) => {
                console.error('Error fetching invoice list:', err);
            }
        });
    }
    }

    onGetPOPayment(){
        const po = this.poForm.get('p_pono')?.value.toString();
        const payload = this.createReturnPayload('POPAYMENT', po, this.companyId);
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = Array.isArray(res?.data) ? res.data : [];
            const row = rows[0] ?? {};

            this.poForm.patchValue(
                {
                    p_totalpoamount: Number(row.total_po_amount ?? 0).toFixed(2),
                    p_totalinvoiceamount: Number(row.total_invoice_amount ?? 0).toFixed(2),
                    p_remaininginvoiceamount: Number(row.remaining_inv_amount ?? 0).toFixed(2)
                },
                { emitEvent: false }
            );
            },
            error: (err: any) => {
                console.error('Error fetching PO payment list:', err);
            }
        });
    }

    private dateRangeValidator(): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const poDate = group.get('p_podate')?.value;
            const deliveryDate = group.get('p_deliverydate')?.value;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const errors: ValidationErrors = {};

            if (poDate) {
                const po = new Date(poDate);
                po.setHours(0, 0, 0, 0);

                // PO date must not be less than today (skip for already-saved drafts/POs being reopened)
                if (po < today && !this.allowPastPoDate) {
                    errors['poDatePast'] = true;
                }

                // PO date must not be greater than delivery date
                if (deliveryDate) {
                    const delivery = new Date(deliveryDate);
                    delivery.setHours(0, 0, 0, 0);
                    if (po > delivery) {
                        errors['poDateAfterDelivery'] = true;
                    }
                }
            }

            if (deliveryDate && poDate) {
                const delivery = new Date(deliveryDate);
                const po = new Date(poDate);
                delivery.setHours(0, 0, 0, 0);
                po.setHours(0, 0, 0, 0);

                // Delivery date must not be less than PO date
                if (delivery < po) {
                    errors['deliveryBeforePO'] = true;
                }
            }

            return Object.keys(errors).length ? errors : null;
        };
    }

    private noFutureDateValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null;
            const selectedDate = new Date(control.value);
            const today = new Date();
            selectedDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            return selectedDate > today ? { futureDate: true } : null;
        };
    }

    onGetDraftPO() {
        const payload = {
            p_returntype: 'PODRAFT',
            p_returnvalue: this.companyId.toString(),
            username: this.authService.isLogIntType().userid.toString()
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.onPODraftOptions = res.data;
            },
            error: (err: any) => {
                console.error('Error fetching PO numbers:', err);
            }
        });
    }

    createReturnPayload(returnType: string, returnValue: string | null = null, username?: string): any {
        return {
            p_returntype: returnType,
            p_returnvalue: returnValue ?? this.companyId.toString(),
            p_username: username ?? ''
        };
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
                this.projectOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    onSiteChange(data: any): void {
        const selectedProjectId = data.value;
        const selectedProject = this.projectOptions.find((p) => p.project_id === selectedProjectId);

        this.poForm.patchValue({
            p_deliverylocation: selectedProject?.delivery_location ?? null
        });

        if (selectedProjectId) {
            this.loadTableData(selectedProjectId);
        } else {
            this.poItemArray.clear();
            this.recalcGrandTotal();
        }
    }

    private loadTableData(projectId: number): void {
        const payload = this.createReturnPayload('PROJECTRFQ4PO', projectId.toString(), this.authService.isLogIntType()?.userid.toString());
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = res.data || [];

                if (rows.length === 0) {
                    this.poItemArray.clear();
                    this.recalcGrandTotal();
                    this.messageService.add({
                        severity: 'info',
                        summary: 'No Data',
                        detail: 'No MR found for this site.',
                        life: 2500
                    });
                    return;
                }

                this.mapProjectRfqItemsToFormArray(rows);
            },
            error: (err: any) => {
                console.error('Error fetching RFQ items for project:', err);
                this.poItemArray.clear();
                this.recalcGrandTotal();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to load items for this site',
                    life: 2500
                });
            }
        });
    }

    private loadItemsForProject(projectId: number): void {
        const payload = this.createReturnPayload('MFAPPROVED', projectId.toString());
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = res.data || [];

                if (rows.length === 0) {
                    this.poItemArray.clear();
                    this.recalcGrandTotal();
                    this.messageService.add({
                        severity: 'info',
                        summary: 'No Data',
                        detail: 'No forecast items found for this site.',
                        life: 2500
                    });
                    return;
                }

                this.mapItemsToFormArray(rows);
            },
            error: (err) => {
                console.error('Error fetching items for project:', err);
                this.poItemArray.clear();
                this.recalcGrandTotal();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to load items for this site',
                    life: 2500
                });
            }
        });
    }

    getTotalPayable(): number {
        return Number(this.poForm.get('p_totalpayment')?.value || 0);
    }

    getPreviewRemaining(): number {
        return +(this.getRemainingPayment() - (this.newPayment.amount ?? 0)).toFixed(2);
    }

    private calculateGrandTotals(): void {
        const freight = Number(this.poForm.get('p_freight')?.value || 0);
        const loadingCharge = Number(this.poForm.get('p_loadingcharge')?.value || 0);
        const cgst = Number(this.poForm.get('p_cgst')?.value || 0);
        const sgst = Number(this.poForm.get('p_sgst')?.value || 0);
        const igst = Number(this.poForm.get('p_igst')?.value || 0);
        const miscCharge = Number(this.poForm.get('p_misccharge')?.value || 0);
        const invoiceAmount = Number(this.poForm.get('p_invoicepayment')?.value || 0);
        const totalTaxableAmount = +(invoiceAmount + freight).toFixed(2);

        const grandTotal = totalTaxableAmount + loadingCharge + cgst + sgst + igst + miscCharge;
        this.poForm.patchValue(
            {
                p_totaltaxableamount: totalTaxableAmount,
                p_grandtotal: grandTotal
            },
            { emitEvent: false }
        );
    }

    onPOChange(event: any): void {
        const poId = event.value;
        if (!poId) return;

        const po = this.ponoOptions.find((p) => p['po_id'] === poId);
        if (!po) return;

        const payload = {
            p_returntype: 'PODETAILS',
            p_returnvalue: po['po_no'],
            p_username: this.companyId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => this.applyPORowsToForm(res.data ?? [], false),
            error: (err: any) => {
                console.error('Error fetching PO details:', err);
                this.messageService.add({ severity: 'error', summary: 'Failed to load PO details', life: 2500 });
            }
        });
    }

    onPODraftChange(event: any): void {
        const draftId = event.value;
        if (!draftId) return;

        const draft = this.onPODraftOptions.find((p) => p['draft_id'] === draftId);
        if (!draft) return;

        const payload = {
            p_returntype: 'PODRAFTDETAILS',
            p_returnvalue: draft['draft_no'],
            p_username: this.companyId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => this.applyPORowsToForm(res.data ?? [], true),
            error: (err: any) => {
                console.error('Error fetching draft PO details:', err);
                this.messageService.add({ severity: 'error', summary: 'Failed to load draft details', life: 2500 });
            }
        });
    }

    private applyPORowsToForm(rows: any[], isDraft: boolean): void {
        if (!rows.length) return;

        const header = rows[0];
        this.isDraftPo = isDraft;
        this.printHeader = header;

        this.allowPastPoDate = true;
        this.poForm.patchValue({
            p_pono: isDraft ? null : header.po_id,
            p_draft_id: isDraft ? header.draft_id : null,
            p_podate: this.parseApiDate(header.po_date) ?? this.today,
            p_project: header.project_id ?? null,
            p_vendor: header.suppliername ?? '',
            status: header.status ?? '',
            p_deliverylocation: header.delivery_location ?? '',
            p_deliverydate: this.parseApiDate(header.delivery_date),
            p_paymentterms: header.payment_terms ?? null,
            p_remarks: header.remarks ?? ''
        });
        this.poForm.updateValueAndValidity();

        this.mapPODetailRowsToFormArray(rows, header.vendor_id);
        this.hydrateRelatedDetails(header);
        this.onGetPerforma();
        this.onGetPerformaInvoice();
        this.onGetPOPayment();
        this.submitted = true;
    }

    private hydrateRelatedDetails(header: any): void {
        const performa = Array.isArray(header.performa) ? header.performa : [];
        const invoice = Array.isArray(header.invoice) ? header.invoice : [];
        const payment = Array.isArray(header.payment) ? header.payment : [];
        const summary = header.payment_summary ?? {};

        this.performaHistory = performa.map((item: any) => ({
            id: item.performa_id ?? null,
            invoiceNo: item.invoice_no ?? '',
            date: this.parseApiDate(item.invoice_date),
            amount: Number(item.amount ?? 0),
            documentPath: item.document_path?.startsWith('data:') ? 'Attachment' : (item.document_path ?? ''),
            documentDataUrl: item.document_path?.startsWith('data:') ? item.document_path : ''
        }));

        this.invoiceHistory = invoice.map((item: any) => ({
            id: item.invoice_id ?? null,
            invoiceNo: item.invoice_no ?? '',
            date: this.parseApiDate(item.invoice_date),
            performaInvoiceNo: performa.find((p: any) => p.performa_id === item.performa_id)?.invoice_no ?? item.performa_invoice_no ?? '',
            freight: Number(item.freight ?? 0),
            loadingCharge: Number(item.loading_charge ?? 0),
            cgst: Number(item.cgst_amount ?? item.cgst ?? 0),
            totalTaxableAmount: Number(item.total_taxable_amount ?? item.amount ?? 0),
            sgst: Number(item.sgst ?? item.sgst_amount ?? 0),
            igst: Number(item.igst ?? item.igst_amount ?? 0),
            miscCharge: Number(item.misc_charge ?? 0),
            grandTotal: Number(item.grand_total ?? item.amount ?? 0),
            documentPath: item.document_path?.startsWith('data:') ? 'Attachment' : (item.document_path ?? ''),
            documentDataUrl: item.document_path?.startsWith('data:') ? item.document_path : ''
        }));

        this.paymentHistory = payment.map((item: any) => ({
            id: item.payment_id ?? null,
            date: this.parseApiDate(item.payment_date) ?? new Date(),
            amount: Number(item.amount ?? 0),
            mode: item.payment_mode ?? '',
            referenceNo: item.transaction_no ?? '',
            invoiceNo: item.invoice_no ?? '',
            performaInvoiceNo: item.performa_invoice_no ?? '',
            remainingAfter: Number(item.remaining_payment ?? 0)
        }));

        this.totalPaid = Number(summary.total_paid ?? this.paymentHistory.reduce((total, item) => total + item.amount, 0));

        // Reset the entry-form fields for all three tabs — only the history
        // tables should reflect saved data; the inputs stay clear for a new entry.
        this.editingPerformaIndex = null;
        this.editingInvoiceIndex = null;
        this.editingPaymentIndex = null;

        this.performaFileName = '';
        this.performaFileDataUrl = '';
        this.showExistingPerformaDate = false;
        this.clearFileInput(this.performaFileInputRef);

        this.invoiceFileName = '';
        this.invoiceFileDataUrl = '';
        this.clearFileInput(this.invoiceFileInputRef);

        this.poForm.patchValue({
            p_performainvoiceno: '',
            p_performadate: this.today,
            p_performaamount: null,
            p_performafile: null,

            p_invoiceno: '',
            p_invoicedate: this.today,
            p_invoicepayment: null,
            p_invoicefile: null,
            p_freight: null,
            p_loadingcharge: null,
            p_cgst: null,
            p_sgst: null,
            p_igst: null,
            p_totaltaxableamount: null,
            p_misccharge: null,
            p_grandtotal: null,
            p_performainvoiceno_invoice: '',

            p_totalpayment: Number(summary.total_payment ?? summary.po_total ?? 0).toFixed(2),
            p_remainingpayment: Number(summary.remaining_payment ?? 0).toFixed(2)
        });

        this.newPayment = { date: new Date(), amount: 0, mode: '', referenceNo: '', invoiceNo: '', performaInvoiceNo: '' };
    }

    private clearFileInput(ref?: ElementRef<HTMLInputElement>): void {
        if (ref?.nativeElement) {
            ref.nativeElement.value = '';
        }
    }

    private parseApiDate(value: string | Date | null | undefined): Date | null {
        if (!value) return null;
        if (value instanceof Date) return value;
        const parts = String(value).slice(0, 10).split('-').map(Number);
        return parts.length === 3 && parts.every((part) => Number.isFinite(part)) ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(value);
    }

    private mapPODetailRowsToFormArray(rows: any[], headerVendorId: number | null): void {
        this.poItemArray.clear();
        this.vendorOptionsByRow = [];

        const vendor = this.vendorMasterOptions.find((v) => v.supplierid === headerVendorId);

        rows.forEach((row) => {
            const requiredQty = row.required_qty ?? 0;
            this.poItemArray.push(
                this.fb.group({
                    department: [''],
                    mf_no: [row.mr_no ?? row.mf_no ?? ''],
                    category: [row.category_name ?? ''],
                    item: [row.item_name ?? ''],
                    uom: [row.uom_name ?? ''],
                    forecastQty: [row.forecast_qty ?? 0],
                    availableStock: [row.available_stock ?? 0],
                    pendingPOQty: [row.pending_po_qty ?? 0],
                    requiredQty: [requiredQty],
                    poQty: [row.po_qty ?? requiredQty, [Validators.max(requiredQty)]],
                    vendorName: [vendor?.suppliername ?? row.suppliername ?? ''],
                    rate: [row.rate ?? null],
                    amount: [row.amount ?? null],
                    tax_id: [row.tax_id ?? 0],
                    taxPercent: [Number(row.gsttax ?? 0)],
                    cgstPercent: [Number(row.cgst_percent ?? row.cgst_rate ?? 0)],
                    sgstPercent: [Number(row.sgst_percent ?? row.sgst_rate ?? 0)],
                    igstPercent: [Number(row.igst_percent ?? row.igst_rate ?? 0)],
                    cgstAmount: [Number(row.cgst_amount ?? 0)],
                    sgstAmount: [Number(row.sgst_amount ?? 0)],
                    igstAmount: [Number(row.igst_amount ?? 0)],
                    totalAmount: [row.total_amount ?? row.totalAmount ?? row.amount ?? null],
                    remarks: [row.detail_remarks ?? ''],
                    status: [row.status ?? ''],
                    mf_id: [row.mf_id ?? null],
                    mfdetailid: [row.mfdetailid ?? null],
                    department_id: [row.department_id ?? null],
                    vendor_id: [headerVendorId ?? null],
                    item_category_id: [row.item_category_id ?? null],
                    item_id: [row.item_id ?? null],
                    uom_id: [row.uom_id ?? null]
                })
            );
        });

        this.syncSelectedVendors();
        this.recalcGrandTotal();
    }

    removePoItem(index: number): void {
        this.poItemArray.removeAt(index);
        this.vendorOptionsByRow.splice(index, 1);
        this.syncSelectedVendors();
        this.recalcGrandTotal();
    }

    // ── Disable submit when no items, or any item is missing vendor/rate ──────
    isSubmitDisabled(): boolean {
        if (this.poItemArray.length === 0) return true;
        return this.poItemArray.controls.some((row) => !row.get('vendorName')?.value || row.get('rate')?.value === null || row.get('rate')?.value === undefined || row.get('rate')?.value === '');
    }

    // ── Disable draft saving once a PO number has been selected/assigned ──────
    isDraftDisabled(): boolean {
        const poId = this.poForm?.get('p_pono')?.value;
        return poId !== null && poId !== undefined && poId !== '';
    }

    // ── Header-only validity for the main Submit button — ignores performa/invoice/payment tab fields ──
    isHeaderInvalid(): boolean {
        return !!(this.poForm.get('p_podate')?.invalid || this.poForm.get('p_project')?.invalid || this.poForm.errors);
    }

    get hasExistingPo(): boolean {
        const poId = this.poForm?.get('p_pono')?.value;
        return !this.isDraftPo && poId !== null && poId !== undefined && poId !== '';
    }

    onSubmit(): void {
        this.poForm.markAllAsTouched();
        this.confirmationService.confirm({
            message: 'Are you sure you want to submit this Purchase Order?',
            header: 'Confirm Submission',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => this.savePO()
        });
    }

    private savePO(): void {
        const formVal = this.poForm.getRawValue();
        const payload: PurchaseOrderPayload = {
            p_action: 'SUBMIT',
            p_operation: 'INSERT',
            p_po_id: 0,
            p_draft_id: 0,
            p_company_id: Number(this.companyId),
            p_project_id: formVal.p_project,
            p_department_id: formVal.department_id || 8,
            p_po_date: this.datePipe.transform(formVal.p_podate, 'yyyy-MM-dd'),
            p_delivery_date: this.datePipe.transform(formVal.p_deliverydate, 'yyyy-MM-dd'),
            p_delivery_location: formVal.p_deliverylocation || '',
            p_payment_terms: formVal.p_paymentterms,
            p_remarks: formVal.p_remarks,
            p_items_json: this.buildItemsPayload(),
            p_loginuser: this.authService.isLogIntType()?.userid.toString(),
            p_mr_no: this.getSelectedMrNumbers()
        };

        this.workService.upsertPurchaseOrder(payload).subscribe({
            next: (res: any) => {
                const data = res.data;

                if (data.success) {
                    this.poForm.patchValue({
                        p_pono: res.data.data[0]?.po_id ?? null,
                        status: data.tran_status
                    });

                    this.onGetPONo();
                    this.submitted = true;

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: data.msg,
                        life: 2500
                    });
                    // this.sendMailToVendors(pos[0]?.po_id);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Submit Failed',
                        detail: data.msg,
                        life: 3000
                    });
                }
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Submit Failed',
                    detail: err?.error?.error ?? err?.message ?? 'Something went wrong.',
                    life: 3000
                });
            }
        });
    }

    // ── Performa ──────────────────────────────────────────────
    onPerformaFileSelect(event: any): void {
        const file = event.target.files[0];
        if (!file) return;
        this.performaFileName = file.name;
        const reader = new FileReader();
        reader.onload = () => {
            this.performaFileDataUrl = typeof reader.result === 'string' ? reader.result : '';
            this.poForm.patchValue({ p_performafile: file });
        };
        reader.readAsDataURL(file);
    }

    previewPerformaFile(dataUrl: string = this.performaFileDataUrl): void {
        this.previewFileDataUrl(dataUrl);
    }

    previewInvoiceFile(dataUrl: string = this.invoiceFileDataUrl): void {
        this.previewFileDataUrl(dataUrl);
    }

    private previewFileDataUrl(dataUrl: string): void {
        if (!dataUrl) return;

        const [metadata, encodedData] = dataUrl.split(',', 2);
        if (!metadata || !encodedData) return;

        try {
            const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || 'application/pdf';
            const binary = atob(encodedData);
            const bytes = new Uint8Array(binary.length);
            for (let index = 0; index < binary.length; index++) {
                bytes[index] = binary.charCodeAt(index);
            }

            const previewUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
            const previewWindow = window.open('', '_blank');
            if (!previewWindow) {
                URL.revokeObjectURL(previewUrl);
                return;
            }

            previewWindow.location.href = previewUrl;
            window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Preview failed', detail: 'The attachment could not be opened.', life: 3000 });
        }
    }

    onInvoiceFileSelect(event: any): void {
        const file = event.target.files[0];
        if (!file) return;
        this.invoiceFileName = file.name;
        const reader = new FileReader();
        reader.onload = () => {
            this.invoiceFileDataUrl = typeof reader.result === 'string' ? reader.result : '';
            this.poForm.patchValue({ p_invoicefile: file });
        };
        reader.readAsDataURL(file);
    }

    // ── Per-tab validity — used to disable each tab's Save button only, without affecting the main Submit button ──
    isPerformaInvalid(): boolean {
        return !!(this.poForm.get('p_performainvoiceno')?.invalid || this.poForm.get('p_performadate')?.invalid || this.poForm.get('p_performaamount')?.invalid || this.poForm.get('p_performafile')?.invalid);
    }

    isInvoiceInvalid(): boolean {
        return !!(this.poForm.get('p_invoiceno')?.invalid || this.poForm.get('p_invoicedate')?.invalid || this.poForm.get('p_invoicepayment')?.invalid || this.poForm.get('p_invoicefile')?.invalid);
    }

    isPaymentInvalid(): boolean {
    const amount = Number(this.newPayment.amount);
    return !(amount > 0) || amount > this.getRemainingPayment() || !this.newPayment.mode || (!this.newPayment.invoiceNo && !this.newPayment.performaInvoiceNo);
}

    savePerforma(): void {
        if (!this.hasExistingPo) {
            this.messageService.add({ severity: 'warn', summary: 'PO required', detail: 'Select an existing purchase order before saving performa details.', life: 2500 });
            return;
        }
        if (this.isPerformaInvalid()) {
            this.poForm.get('p_performainvoiceno')?.markAsTouched();
            this.poForm.get('p_performadate')?.markAsTouched();
            this.poForm.get('p_performaamount')?.markAsTouched();
            this.poForm.get('p_performafile')?.markAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Required fields', detail: 'Complete all performa fields before saving.', life: 2500 });
            return;
        }
        const val = this.poForm.getRawValue();
        const entry: PerformaEntry = {
            invoiceNo: val.p_performainvoiceno || '',
            date: val.p_performadate || null,
            amount: Number(val.p_performaamount || 0),
            documentPath: val.p_performafile?.name || this.performaFileName || '',
            documentDataUrl: this.performaFileDataUrl
        };
        const payload = {
            p_operation: this.editingPerformaIndex === null ? 'INSERT' : 'UPDATE',
            p_performa_id: this.editingPerformaIndex === null ? null : this.performaHistory[this.editingPerformaIndex].id,
            p_po_id: this.poForm.get('p_pono')?.value,
            p_invoice_no: entry.invoiceNo || null,
            p_invoice_date: this.datePipe.transform(val.p_performadate, 'yyyy-MM-dd'),
            p_amount: entry.amount,
            p_document_path: entry.documentDataUrl || null,
            p_remarks: val.p_remarks || null,
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertPOPerforma(payload).subscribe({
            next: (res: any) => {
                this.showSaveResult(res, 'Performa details saved.');
                if (res?.data?.success !== false) {
                    const saved = { ...entry, id: res?.data?.performa_id ?? entry.id };
                    this.performaHistory = this.editingPerformaIndex === null ? [...this.performaHistory, saved] : this.performaHistory.map((item, index) => (index === this.editingPerformaIndex ? saved : item));
                    this.editingPerformaIndex = null;
                    this.onGetPerforma();
                }
            },
            error: (err) => this.showSaveError(err, 'Performa save failed.')
        });
    }

    editPerforma(index: number): void {
        const entry = this.performaHistory[index];
        this.editingPerformaIndex = index;
        this.poForm.patchValue({ p_performainvoiceno: entry.invoiceNo, p_performadate: this.parseApiDate(entry.date), p_performaamount: entry.amount });
        this.performaFileName = entry.documentPath;
        this.performaFileDataUrl = entry.documentDataUrl;
    }

    removePerforma(index: number): void {
        this.performaHistory = this.performaHistory.filter((_, rowIndex) => rowIndex !== index);
        this.editingPerformaIndex = null;
    }

    // ── Invoice ───────────────────────────────────────────────
    onInvoicePaymentChange(): void {
        this.recalcPayments();
    }

    saveInvoice(): void {
        if (!this.hasExistingPo) {
            this.messageService.add({ severity: 'warn', summary: 'PO required', detail: 'Select an existing purchase order before saving invoice details.', life: 2500 });
            return;
        }
        if (this.isInvoiceInvalid()) {
            this.poForm.get('p_invoiceno')?.markAsTouched();
            this.poForm.get('p_invoicedate')?.markAsTouched();
            this.poForm.get('p_invoicepayment')?.markAsTouched();
            this.poForm.get('p_invoicefile')?.markAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Required fields', detail: 'Invoice number, date, amount, and attachment are required.', life: 2500 });
            return;
        }
        const val = this.poForm.getRawValue();
        const selectedPerforma = this.performaInvoiceOptions?.find((p: any) => p.performa_id === val.p_performainvoiceno_invoice);
        const entry: InvoiceEntry = {
            invoiceNo: val.p_invoiceno || '',
            date: val.p_invoicedate || null,
            performaInvoiceNo: selectedPerforma?.invoice_no || (typeof val.p_performainvoiceno_invoice === 'string' ? val.p_performainvoiceno_invoice : ''),
            freight: Number(val.p_freight || 0),
            loadingCharge: Number(val.p_loadingcharge || 0),
            cgst: Number(val.p_cgst || 0),
            totalTaxableAmount: Number(val.p_totaltaxableamount || 0),
            sgst: Number(val.p_sgst || 0),
            igst: Number(val.p_igst || 0),
            miscCharge: Number(val.p_misccharge || 0),
            grandTotal: Number(val.p_grandtotal || 0),
            documentPath: val.p_invoicefile?.name || this.invoiceFileName || '',
            documentDataUrl: this.invoiceFileDataUrl
        };

        const payload = {
            p_operation: this.editingInvoiceIndex === null ? 'INSERT' : 'UPDATE',
            p_invoice_id: this.editingInvoiceIndex === null ? null : this.invoiceHistory[this.editingInvoiceIndex].id,
            p_po_id: Number(this.poForm.get('p_pono')?.value),
            p_performa_id: val.p_performainvoiceno_invoice ? Number(val.p_performainvoiceno_invoice) : null,
            p_invoice_no: entry.invoiceNo || null,
            p_invoice_date: this.datePipe.transform(val.p_invoicedate, 'yyyy-MM-dd'),
            p_amount: Number(val.p_invoicepayment || 0),
            p_freight: Number(val.p_freight || 0),
            p_cgst: Number(val.p_cgst || 0),
            p_sgst: entry.sgst,
            p_igst: entry.igst,
            p_total_taxable_amount: entry.totalTaxableAmount,
            p_loading_charge: Number(val.p_loadingcharge || 0),
            p_misc_charge: entry.miscCharge,
            p_grand_total: entry.grandTotal,
            p_document_path: entry.documentDataUrl || null,
            p_remarks: val.p_remarks || null,
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertPOInvoice(payload).subscribe({
            next: (res: any) => {
                this.showSaveResult(res, 'Invoice details saved.');
                if (res?.data?.success !== false) {
                    const saved = { ...entry, id: res?.data?.invoice_id ?? entry.id };
                    this.invoiceHistory = this.editingInvoiceIndex === null ? [...this.invoiceHistory, saved] : this.invoiceHistory.map((item, index) => (index === this.editingInvoiceIndex ? saved : item));
                    this.editingInvoiceIndex = null;
                    this.onGetPerformaInvoice();
                }
            },
            error: (err) => this.showSaveError(err, 'Invoice save failed.')
        });
    }

    editInvoice(index: number): void {
        const entry = this.invoiceHistory[index];
        this.editingInvoiceIndex = index;
        this.poForm.patchValue({
            p_invoiceno: entry.invoiceNo,
            p_invoicedate: this.parseApiDate(entry.date),
            p_invoicepayment: entry.totalTaxableAmount - entry.freight,
            p_performainvoiceno_invoice: entry.performaInvoiceNo,
            p_totaltaxableamount: entry.totalTaxableAmount,
            p_sgst: entry.sgst,
            p_igst: entry.igst,
            p_misccharge: entry.miscCharge,
            p_grandtotal: entry.grandTotal
        });
        this.invoiceFileName = entry.documentPath;
        this.invoiceFileDataUrl = entry.documentDataUrl;
    }

    removeInvoice(index: number): void {
        this.invoiceHistory = this.invoiceHistory.filter((_, rowIndex) => rowIndex !== index);
        this.editingInvoiceIndex = null;
    }

    // ── Payment ───────────────────────────────────────────────
    onPaymentChange(): void {
        this.recalcPayments();
    }

    getRemainingPayment(): number {
        return +(this.getTotalPayable() - this.totalPaid).toFixed(2);
    }

    private recalcPayments(): void {
        const invoicePayment = Number(this.poForm.get('p_invoicepayment')?.value || 0);
        const freight = Number(this.poForm.get('p_freight')?.value || 0);
        const loading = Number(this.poForm.get('p_loadingcharge')?.value || 0);
        const total = +(invoicePayment + freight + loading).toFixed(2);
        const advance = Number(this.poForm.get('p_payment')?.value || 0);
        const remaining = +(total - advance).toFixed(2);

        this.poForm.patchValue({
            p_totalpayment: total.toFixed(2),
            p_remainingpayment: remaining.toFixed(2)
        });
    }

    savePayment(): void {
        const poId = this.poForm.get('p_pono')?.value;
        if (!this.hasExistingPo) {
            this.messageService.add({ severity: 'warn', summary: 'PO required', detail: 'Select an existing purchase order before saving payment details.', life: 2500 });
            return;
        }
        const payment: PaymentEntry = {
            date: this.newPayment.date || new Date(),
            amount: Number(this.newPayment.amount || 0),
            mode: this.newPayment.mode || '',
            referenceNo: this.newPayment.referenceNo || '',
            invoiceNo: this.newPayment.invoiceNo || '',
            performaInvoiceNo: this.newPayment.performaInvoiceNo || '',
            remainingAfter: 0
        };
        if (!payment.amount || !payment.mode) {
            this.messageService.add({ severity: 'warn', summary: 'Payment details required', detail: 'Enter an amount and select a payment mode.', life: 2500 });
            return;
        }
        if (!payment.invoiceNo && !payment.performaInvoiceNo) {
            this.messageService.add({ severity: 'warn', summary: 'Invoice reference required', detail: 'Select either an Invoice No or a Performa Invoice No.', life: 2500 });
            return;
        }
        const total = Number(this.poForm.get('p_totalpayment')?.value || 0);
        const existingTotal = this.paymentHistory.reduce((sum, item, index) => sum + (index === this.editingPaymentIndex ? 0 : item.amount), 0);
        if (existingTotal + payment.amount > total) {
            this.messageService.add({ severity: 'warn', summary: 'Excess Amount', detail: `Maximum payable now is ₹${Math.max(0, total - existingTotal).toFixed(2)}`, life: 3000 });
            return;
        }
        const payload = {
            p_operation: this.editingPaymentIndex === null ? 'INSERT' : 'UPDATE',
            p_payment_id: this.editingPaymentIndex === null ? null : this.paymentHistory[this.editingPaymentIndex].id,
            p_po_id: poId,
            p_payment_date: this.datePipe.transform(payment.date, 'yyyy-MM-dd'),
            p_amount: Number(payment.amount || 0),
            p_payment_mode: payment.mode || null,
            p_transaction_no: payment.referenceNo || null,
            p_invoice_no: payment.invoiceNo || null,
            p_performa_invoice_no: payment.performaInvoiceNo || null,
            p_bank_name: null,
            p_remarks: this.poForm.get('p_remarks')?.value || null,
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertPOPayment(payload).subscribe({
            next: (res: any) => {
                this.showSaveResult(res, 'Payment details saved.');
                if (res?.data?.success !== false) {
                    const saved = { ...payment, id: res?.data?.payment_id ?? (payment as any).id };
                    this.paymentHistory = this.editingPaymentIndex === null ? [...this.paymentHistory, saved] : this.paymentHistory.map((item, index) => (index === this.editingPaymentIndex ? saved : item));
                    this.editingPaymentIndex = null;
                    this.newPayment = { date: new Date(), amount: 0, mode: '', referenceNo: '', invoiceNo: '', performaInvoiceNo: '' };
                    this.recalcPaymentSummary();
                }
            },
            error: (err) => this.showSaveError(err, 'Payment save failed.')
        });
    }

    editPayment(index: number): void {
        const entry = this.paymentHistory[index];
        this.editingPaymentIndex = index;
        this.newPayment = {
            date: entry.date,
            amount: entry.amount,
            mode: entry.mode,
            referenceNo: entry.referenceNo,
            invoiceNo: entry.invoiceNo,
            performaInvoiceNo: entry.performaInvoiceNo
        };
    }

    private showSaveResult(res: any, successMessage: string): void {
        const success = res?.data?.success !== false;
        this.messageService.add({
            severity: success ? 'success' : 'error',
            summary: success ? 'Saved' : 'Save failed',
            detail: res?.data?.msg || (success ? successMessage : 'The server could not save the details.'),
            life: 2500
        });
    }

    private showSaveError(err: any, message: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Save failed',
            detail: err?.error?.error ?? err?.message ?? message,
            life: 3000
        });
    }

    private buildItemsPayload(): PurchaseOrderItem[] {
        return this.poItemArray.controls.map((row) => ({
            mf_id: row.get('mf_id')?.value,
            mfdetailid: row.get('mfdetailid')?.value,
            department_id: row.get('department_id')?.value,
            vendor_id: row.get('vendor_id')?.value,
            item_category_id: row.get('item_category_id')?.value,
            item_id: row.get('item_id')?.value,
            uom_id: row.get('uom_id')?.value,
            forecast_qty: row.get('forecastQty')?.value ?? 0,
            available_stock: row.get('availableStock')?.value ?? 0,
            pending_po_qty: row.get('pendingPOQty')?.value ?? 0,
            required_qty: row.get('requiredQty')?.value ?? 0,
            po_qty: row.get('poQty')?.value ?? 0,
            rate: row.get('rate')?.value ?? 0,
            amount: row.get('amount')?.value ?? 0,
            remarks: row.get('remarks')?.value ?? ''
        }));
    }

    private getSelectedMrNumbers(): string {
        return [...new Set(this.poItemArray.controls.map((row) => String(row.get('mf_no')?.value ?? row.get('mr_no')?.value ?? '').trim()).filter((mfNo) => !!mfNo))].join(', ');
    }

    submitDraft(): void {
        if (this.poItemArray.length === 0) {
            this.messageService.add({ severity: 'error', summary: 'No Items', detail: 'Add at least one MF item before saving a draft.', life: 3000 });
            return;
        }

        const v = this.poForm.getRawValue();
        const draftId: number = v.p_draft_id ?? 0;
        const operation = draftId ? 'UPDATE' : 'INSERT';

        const payload: PurchaseDraftPayload = {
            p_operation: operation,
            p_draft_id: draftId,
            p_company_id: Number(this.companyId),
            p_project_id: v.p_project,
            p_department_id: v.p_department_id ?? 9,
            p_po_date: this.datePipe.transform(v.p_podate, 'yyyy-MM-dd'),
            p_delivery_date: this.datePipe.transform(v.p_deliverydate, 'yyyy-MM-dd'),
            p_delivery_location: v.p_deliverylocation || '',
            p_payment_terms: v.p_paymentterms,
            p_remarks: v.p_remarks,
            p_items_json: this.buildItemsPayload(),
            p_loginuser: this.authService.isLogIntType().userid,
            p_mr_no: this.getSelectedMrNumbers()
        };

        this.workService.upsertPODraft(payload).subscribe({
            next: (res) => {
                if (res.data.success) {
                    this.isDraftPo = true;
                    const newDraft = {
                        draft_id: Number(res.data.draft_id),
                        draft_no: res.data.draft_no
                    };

                    const exists = this.onPODraftOptions.some((item) => Number(item.draft_id) === Number(newDraft.draft_id));

                    if (!exists) {
                        this.onPODraftOptions = [...this.onPODraftOptions, newDraft];
                    }
                    this.poForm.patchValue({
                        p_pono: null,
                        p_draft_id: newDraft.draft_id
                    });

                    this.onGetDraftPO();
                    this.messageService.add({
                        severity: 'success',
                        summary: res.data.msg,
                        detail: `Draft PO #${res.data.draft_no} saved.`,
                        life: 2500
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Draft Save Failed',
                        detail: res.data.msg,
                        life: 3000
                    });
                }
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Draft Save Failed',
                    detail: err?.error?.error ?? err?.message ?? 'Something went wrong.',
                    life: 3000
                });
            }
        });
    }

    cancelPO(): void {}
    forceClose(): void {}

    // ── Reset ──────────────────────────────────────────────────────────────────
    onReset(): void {
        this.allowPastPoDate = false;
        this.poForm.reset({
            p_podate: this.today
        });
        this.activeTabIndex = '0';
        this.poItemArray.clear();
        this.submitted = false;
        this.isDraftPo = false;
        this.showForecastError = false;
        this.grandTotal = 0;
        this.selectedVendorNames = [];
        this.performaHistory = [];
        this.invoiceHistory = [];
        this.paymentHistory = [];
        this.performaInvoiceOptions = [];
        this.invoiceOptions = [];
        this.performaFileName = '';
        this.performaFileDataUrl = '';
        this.showExistingPerformaDate = false;
        this.totalPaid = 0;
        this.newPayment = { date: new Date(), amount: 0, mode: '', referenceNo: '', invoiceNo: '', performaInvoiceNo: '' };
        this.clearFileInput(this.performaFileInputRef);
    }

    // ── Print ──────────────────────────────────────────────────────────────────
    printPO(): void {
        const poNo = this.poForm.get('p_pono')?.value;
        if (!poNo) return;

        const payload = {
            p_returntype: 'POPRINT',
            p_returnvalue: String(poNo),
            p_username: this.companyId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const printRows = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
                this.printData = this.buildPurchaseOrderPrintData(printRows);
                setTimeout(() => {
                    const printContents = document.getElementById('poPrintSection')?.innerHTML;
                    if (!printContents) return;
                    const w = window.open('', '_blank', 'width=900,height=1200');
                    w?.document.open();
                    w?.document.write(
                        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Purchase Order ${this.printData.poNo}</title><style>${this.purchaseOrderPrintStyles()}</style></head><body>${printContents}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}</script></body></html>`
                    );
                    w?.document.close();
                });
            },
            error: (err: any) => {
                console.error('Error fetching PO print details:', err);
                this.messageService.add({ severity: 'error', summary: 'Print failed', detail: 'Unable to load purchase order print details.', life: 2500 });
            }
        });
    }

    private buildPurchaseOrderPrintData(printRows: any[] = []): any {
        const form = this.poForm.getRawValue();
        const rows = this.poItemArray.getRawValue();
        const useApiData = printRows.length > 0;
        const header = useApiData ? printRows[0] : (this.printHeader ?? {});
        const sourceRows = useApiData ? printRows : rows;
       
        const items = sourceRows.map((row: any, index: number) => {
            const quantity = Number(useApiData ? row.qty ?? 0 : row.poQty ?? 0);
            const rate = Number(row.rate ?? 0);
            // "Taxable Amount" = extended pre-tax value (qty × rate).
            // "Basic Amount" mirrors the unit Rate to match the reference PO layout.
            const taxableAmount = Number(useApiData ? row.taxable_amount ?? row.basic_amount ?? quantity * rate : (quantity * rate).toFixed(2));
            const taxPercent = Number(useApiData ? row.gst_rate ?? 0 : row.taxPercent ?? 0);
            const cgstPercent = Number(useApiData ? row.cgst_rate ?? 0 : row.cgstPercent || (row.igstPercent ? 0 : taxPercent / 2));
            const sgstPercent = Number(useApiData ? row.sgst_rate ?? 0 : row.sgstPercent || (row.igstPercent ? 0 : taxPercent / 2));
            const igstPercent = Number(useApiData ? row.igst_rate ?? 0 : row.igstPercent || 0);

            return {
                srNo: useApiData ? row.sr_no ?? index + 1 : index + 1,
                description: useApiData ? row.itemdesc ?? row.itemname ?? '' : row.item ?? row.itemName ?? '',
                make: useApiData ? row.brand ?? row.model_size ?? '' : row.make ?? '',
                uom: useApiData ? row.unit ?? '' : row.uom ?? '',
                quantity,
                rate,
                discount: Number(useApiData ? row.discount_percent ?? 0 : row.discountPercent ?? 0),
                cgstPercent,
                sgstPercent,
                igstPercent,
                cgstAmount: Number(useApiData ? row.cgst_amount ?? 0 : row.cgstAmount || (taxableAmount * cgstPercent) / 100),
                sgstAmount: Number(useApiData ? row.sgst_amount ?? 0 : row.sgstAmount || (taxableAmount * sgstPercent) / 100),
                igstAmount: Number(useApiData ? row.igst_amount ?? 0 : row.igstAmount || (taxableAmount * igstPercent) / 100),
                taxableAmount
            };
        });

        // Gross Amount = sum of every row's extended (pre-tax) amount.
        const taxableAmount = Number(useApiData ? header.gross_amount ?? header.total_basic_amount ?? 0 : items.reduce((sum: number, item: any) => sum + Number(item.taxableAmount || 0), 0));
        const cgst = Number(useApiData ? header.total_cgst ?? 0 : form.p_cgst || header.cgst_amount || header.cgst || items.reduce((sum: number, item: any) => sum + Number(item.cgstAmount || 0), 0));
        const sgst = Number(useApiData ? header.total_sgst ?? 0 : form.p_sgst || header.sgst_amount || header.sgst || items.reduce((sum: number, item: any) => sum + Number(item.sgstAmount || 0), 0));
        const igst = Number(useApiData ? header.total_igst ?? 0 : form.p_igst || header.igst_amount || header.igst || items.reduce((sum: number, item: any) => sum + Number(item.igstAmount || 0), 0));
        const freight = Number(useApiData ? header.freight_amount ?? 0 : form.p_freight ?? 0);
        const loadingCharge = Number(useApiData ? header.loading_unloading_charges ?? 0 : form.p_loadingcharge ?? 0);
        const miscCharge = Number(useApiData ? header.other_charges ?? 0 : form.p_misccharge ?? 0);
        const totalDiscountAmount = Number(header.total_discount_amount ?? 0);
        const transportCharges = Number(header.transport_charges ?? 0);

        const preRoundTotal = Number(useApiData ? header.total_before_roundoff ?? 0 : taxableAmount + cgst + sgst + igst + freight + loadingCharge + miscCharge + totalDiscountAmount + transportCharges);
        const grandTotal = Math.round(preRoundTotal * 100) / 100;
        const roundOff = Number(useApiData ? header.round_off ?? 0 : (Math.round(grandTotal) - grandTotal).toFixed(2));
        const finalGrandTotal = Number(useApiData ? header.total_amount ?? Math.round(grandTotal) : Math.round(grandTotal));

        return {
            // ── Letterhead (page 1 only) ──
            companyMark: this.printValue(header, ['company_mark', 'company_initials'], 'OM'),
            companyLogo: this.printValue(header, ['companylogo', 'company_logo'], ''),
            companyName: this.printValue(header, ['company_name', 'companyname', 'billing_company'], 'Company Name'),
            companyTagline: this.printValue(header, ['company_tagline', 'tagline'], ''),
            companyAddress: this.printValue(header, ['company_address', 'companyaddress', 'billing_address'], ''),
            companyPhone: this.printValue(header, ['company_phone', 'companyphone', 'phone', 'contact_no'], ''),
            companyEmail: this.printValue(header, ['company_email', 'companyemail', 'email'], ''),
            companyPan: this.printValue(header, ['company_pan', 'pan_no'], ''),
            companyGstin: this.printValue(header, ['company_gstin', 'companygstno', 'gstin_no'], ''),
            companyCin: this.printValue(header, ['company_cin', 'cin_no'], ''),

            // ── PO / Supplier details ──
            poNo: this.printValue(header, ['po_no', 'pono'], form.p_pono ?? ''),
            poDate: this.parseApiDate(header.po_date) ?? form.p_podate,
            contactPerson: this.printValue(header, ['contact_person', 'po_contact_person', 'suppliercontactperson'], ''),
            creditPeriod: this.printValue(header, ['credit_period', 'supplier_paymentterm'], form.p_paymentterms ?? ''),
            supplierName: this.printValue(header, ['suppliername', 'vendor_name'], form.p_vendor || ''),
            supplierAddress: this.printValue(header, ['supplier_address', 'supplieraddress', 'vendor_address'], ''),
            supplierPhone: this.printValue(header, ['supplier_phone', 'supplierphone', 'vendor_phone'], ''),
            supplierGstin: this.printValue(header, ['supplier_gstin', 'suppliergstno', 'gstin', 'vendor_gstin'], ''),

            // ── Billing / Shipping ──
            projectName: this.printValue(header, ['project_name', 'projectname'], this.projectOptions.find((p) => p.project_id === form.p_project)?.project_name ?? ''),
            billingAddress: this.printValue(header, ['billing_address', 'company_address', 'companyaddress'], ''),
            shippingCompanyName: this.printValue(header, ['shipping_company_name'], ''),
            shippingAddress: this.printValue(header, ['shipping_address', 'project_delivery_location', 'delivery_location'], form.p_deliverylocation || ''),
            deliveryLocation: this.printValue(header, ['project_delivery_location', 'delivery_location'], form.p_deliverylocation || ''),
            deliveryDate: this.parseApiDate(header.delivery_date) ?? form.p_deliverydate,
            paymentTerms: this.printValue(header, ['payment_terms', 'supplier_paymentterm'], form.p_paymentterms || ''),
            remarks: this.printValue(header, ['remarks'], form.p_remarks || ''),

            // ── Items & totals ──
            items,
            taxableAmount,
            cgst,
            sgst,
            igst,
            roundOff,
            freight,
            loadingCharge,
            miscCharge,
            totalDiscountAmount,
            transportCharges,
            grandTotal: finalGrandTotal,
            amountInWords: this.numberToWords(finalGrandTotal),

            // ── Notes / terms (page 2, no letterhead) ──
            deliverySchedule: this.printValue(header, ['delivery_schedule'], ''),
            note: this.printValue(header, ['note', 'special_conditions'], ''),
            paymentTermsText: this.printValue(header, ['payment_terms_text'], ''),
            generalTerms:
                Array.isArray(header.general_terms) && header.general_terms.length
                    ? header.general_terms
                    : [
                          'Our Purchase Order Number must be mentioned on all your documents viz. Invoice, Delivery Challan, Lorry Receipt etc., and in all your communications with us.',
                          'You will submit your invoice and challan (in triplicate) along with the supply of material.',
                          'You must ensure and guarantee that all products supplied under this Purchase Order strictly match our specifications, drawings, and approved samples.',
                          'Immediately after dispatch, submit the commercial invoice, delivery challan, packing list, and LR/RR (if applicable) within 3 days of delivery.',
                          'An appropriate Material Safety Data Sheet and labelling must accompany each shipment as required by law.'
                      ],
            preparedByName: this.printValue(header, ['prepared_by'], ''),
            authorisedByName: this.printValue(header, ['authorised_by'], '')
        };
    }

    private numberToWords(amount: number): string {
        const rupees = Math.floor(Math.abs(amount));
        const paise = Math.round((Math.abs(amount) - rupees) * 100);

        if (rupees === 0 && paise === 0) {
            return 'Rupees Zero Only';
        }

        let result = `Rupees ${this.convertToIndianWords(rupees)}`;
        if (paise > 0) {
            result += ` and ${this.convertToIndianWords(paise)} Paise`;
        }
        return `${result} Only`;
    }

    private convertToIndianWords(num: number): string {
        if (num === 0) return 'Zero';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const twoDigits = (n: number): string => {
            if (n < 20) return ones[n];
            const t = Math.floor(n / 10);
            const o = n % 10;
            return `${tens[t]}${o ? ' ' + ones[o] : ''}`;
        };

        const threeDigits = (n: number): string => {
            const hundred = Math.floor(n / 100);
            const rest = n % 100;
            const hundredPart = hundred ? `${ones[hundred]} Hundred` : '';
            const restPart = rest ? twoDigits(rest) : '';
            return [hundredPart, restPart].filter(Boolean).join(' ');
        };

        let n = num;
        const crore = Math.floor(n / 10000000);
        n %= 10000000;
        const lakh = Math.floor(n / 100000);
        n %= 100000;
        const thousand = Math.floor(n / 1000);
        n %= 1000;
        const hundred = n;

        const parts: string[] = [];
        if (crore) parts.push(`${threeDigits(crore)} Crore`);
        if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
        if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
        if (hundred) parts.push(threeDigits(hundred));

        return parts.join(' ');
    }

    private purchaseOrderPrintStyles(): string {
        return `
        @page { size: A4; margin: 10mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #111; font-family: Arial, sans-serif; font-size: 9px; }
        .po-print-section { display: block !important; }
        .po-print { width: 190mm; margin: 0 auto; }
        .po-first-page { page-break-after: auto; break-after: auto; }
        .po-second-page { break-before: auto; page-break-before: auto; }
        .po-summary-table,
        .po-words-table,
        .po-charges-table,
        .po-note-block,
        .po-section-title,
        .po-terms-block { break-inside: avoid; page-break-inside: avoid; }
 
        /* Letterhead — page 1 only */
        .po-letterhead {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            border: 1px solid #111;
            padding: 8px 10px;
            min-height: 62px;
            background: #f4f4f4;
            text-align: center;
        }
        .po-letterhead-logo {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            flex-shrink: 0;
        }
        .po-letterhead-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
        .po-letterhead-text h1 { margin: 0; color: #1261a0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.03em; }
        .po-letterhead-text .po-tagline { margin: 1px 0 0; font-size: 9px; font-style: italic; }
        .po-letterhead-text .po-contact,
        .po-letterhead-text .po-office { margin: 2px 0 0; font-size: 8px; }
 
        .po-title-bar {
            text-align: center;
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 0.05em;
            border: 1px solid #111;
            border-top: 0;
            padding: 3px 0;
            text-transform: uppercase;
        }
 
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #111; padding: 3px 5px; vertical-align: top; }
        th { background: #e7e7e7; text-align: center; font-size: 8px; font-weight: 700; }
        td { font-size: 8px; }
 
        /* Supplier/PO and Billing/Shipping key-value tables */
        .po-kv-table { border-top: 0; }
        .po-kv-header td { background: #e7e7e7; font-weight: 700; text-transform: uppercase; font-size: 9px; }
        .po-kv-label { width: 14%; font-weight: 700; white-space: nowrap; }
        .po-kv-value { width: 36%; }
        .po-address-cell { font-size: 8px; }
 
        .po-items-table { margin-top: 0; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
 
        /* Totals block — full width, matching the items table and amount-in-words row above/below it */
        .po-summary-table {
            width: 100%;
            margin: 0;
            border-top: 0;
            table-layout: fixed;
        }
        .po-summary-label { text-align: left; font-weight: 700; width: 82%; }
        .po-summary-value { text-align: right; width: 18%; }
        .po-summary-strong td { font-weight: 700; }
 
        .po-words-table td { font-size: 8.5px; padding: 4px 6px; }
 
        .po-charges-table { margin-top: 0; table-layout: fixed; }
        .po-charge-label { text-align: left; font-weight: 700; width: 82%; }
        .po-charge-value { text-align: right; width: 18%; }
 
        .po-note-block {
            border: 1px solid #111;
            border-top: 0;
            padding: 5px 7px;
            font-size: 8px;
        }
        .po-note-label { font-weight: 700; }
 
        /* Page 2 — terms & signatures only, no letterhead */
        .po-section-title {
            background: #e7e7e7;
            border: 1px solid #111;
            padding: 3px 6px;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9px;
            margin-top: 8px;
        }
        .po-terms-block {
            border: 1px solid #111;
            border-top: 0;
            padding: 6px 8px;
            font-size: 8px;
        }
        .po-terms-block p { margin: 3px 0; }
 
        .po-signature-row {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .po-signature-block { width: 42%; text-align: center; }
        .po-signature-line { border-top: 1px solid #111; padding-top: 4px; font-weight: 700; font-size: 9px; }
        .po-signature-name { margin-top: 20px; font-size: 8px; }
    `;
    }
    private printValue(source: any, keys: string[], fallback: any = ''): any {
        const value = keys.map((key) => source?.[key]).find((item) => item !== null && item !== undefined && item !== '');
        return value ?? fallback;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // MF DIALOG
    // ──────────────────────────────────────────────────────────────────────────

    // openMFDialog(): void {
    //     // Pre-select already-chosen MFs
    //      const payload = {
    //         p_returntype: 'MFAPPROVED',
    //         p_returnvalue: '',
    //         username: ''
    //     };
    //     this.inventoryService.Getreturndropdowndetails(payload).subscribe({
    //         next: (res) => {
    //             this.mfList = res.data;
    //              this.mfSelections = this.mfList.filter((m) => this.selectedMFNos.includes(m.mfno));
    //     this.showMFDialog = true;
    //         },
    //         error: (err) => console.error(err)
    //     });

    // }

    private mapItemsToFormArray(items: any[]): void {
        this.poItemArray.clear();
        this.vendorOptionsByRow = [];
        items.forEach((it) => {
            const requiredQty = (it.forecast_qty ?? 0) - (it.pending_qty ?? 0) - (it.available_stock ?? 0);
            this.poItemArray.push(
                this.fb.group({
                    department: [it.department_name ?? ''],
                    mf_no: [it.mf_no ?? ''],
                    category: [it.categoryname ?? ''],
                    item: [it.itemname ?? ''],
                    uom: [it.uomname ?? ''],
                    forecastQty: [it.forecast_qty ?? 0],
                    availableStock: [it.available_stock ?? 0],
                    pendingPOQty: [it.pending_qty ?? 0],
                    requiredQty: [requiredQty],
                    poQty: [requiredQty, [Validators.max(requiredQty)]],
                    vendorName: [it.suppliername],
                    rate: [null],
                    amount: [null],
                    tax_id: [it.tax_id ?? '18'],
                    taxPercent: [Number(it.tax_percent ?? 18)],
                    cgstPercent: [Number(it.cgst_percent ?? it.cgst_rate ?? 0)],
                    sgstPercent: [Number(it.sgst_percent ?? it.sgst_rate ?? 0)],
                    igstPercent: [Number(it.igst_percent ?? it.igst_rate ?? 0)],
                    cgstAmount: [Number(it.cgst_amount ?? 0)],
                    sgstAmount: [Number(it.sgst_amount ?? 0)],
                    igstAmount: [Number(it.igst_amount ?? 0)],
                    totalAmount: [null],
                    remarks: [''],

                    mf_id: [it.mf_id ?? null],
                    mfdetailid: [it.mfdetailid ?? null],
                    department_id: [it.department_id ?? null],
                    vendor_id: [it.supplierid],
                    item_category_id: [it.item_category_id ?? null],
                    item_id: [it.item_id ?? null],
                    uom_id: [it.uom_id ?? null]
                })
            );
        });
        this.syncSelectedVendors();
        this.recalcGrandTotal();
    }

    private mapProjectRfqItemsToFormArray(items: any[]): void {
        this.poItemArray.clear();
        this.vendorOptionsByRow = [];
        items.forEach((it) => {
            const requiredQty = it.required_qty ?? 0;
            this.poItemArray.push(
                this.fb.group({
                    department: [''],
                    mf_no: [it.mf_no ?? ''],
                    category: [it.item_category ?? ''],
                    item: [it.item_description ?? ''],
                    uom: [it.uom ?? ''],
                    forecastQty: [it.buffer_stock ?? 0],
                    availableStock: [it.available_stock ?? 0],
                    pendingPOQty: [it.pending_qty ?? 0],
                    requiredQty: [requiredQty],
                    poQty: [requiredQty, [Validators.max(requiredQty)]],
                    vendorName: [''],
                    rate: [null],
                    amount: [null],
                    tax_id: [''],
                    taxPercent: [it.gsttax ?? ''],
                    cgstPercent: [Number(it.cgst_percent ?? it.cgst_rate ?? 0)],
                    sgstPercent: [Number(it.sgst_percent ?? it.sgst_rate ?? 0)],
                    igstPercent: [Number(it.igst_percent ?? it.igst_rate ?? 0)],
                    cgstAmount: [Number(it.cgst_amount ?? 0)],
                    sgstAmount: [Number(it.sgst_amount ?? 0)],
                    igstAmount: [Number(it.igst_amount ?? 0)],
                    totalAmount: [null],
                    remarks: [''],

                    mf_id: [null],
                    mfdetailid: [null],
                    department_id: [null],
                    vendor_id: [null],
                    item_category_id: [it.item_category_id ?? null],
                    item_id: [it.item_id ?? null],
                    uom_id: [it.uom_id ?? null]
                })
            );
        });
        this.syncSelectedVendors();
        this.recalcGrandTotal();
    }

    getVendorOptions(index: number): any[] {
        return this.vendorOptionsByRow[index] ?? this.vendorMasterOptions;
    }

    onPoQtyChange(i: number): void {
        this.recalcRow(i);
    }

    onRateChange(i: number): void {
        this.recalcRow(i);
    }

    get statusColor(): string {
        const status = (this.poForm.get('status')?.value || '').toUpperCase();
        switch (status) {
            case 'APPROVED':
                return 'green';
            case 'SUBMITTED':
                return 'blue';
            case 'REJECTED':
                return 'red';
            case 'DRAFT':
                return 'grey';
            case 'APPROVAL PENDING':
                return 'orange';
            default:
                return 'grey';
        }
    }

    private recalcRow(i: number): void {
        const row = this.poItemArray.at(i);
        const qty = Number(row.get('poQty')?.value || 0);
        const rate = Number(row.get('rate')?.value || 0);
        const amount = qty && rate ? +(qty * rate).toFixed(2) : 0;
        const taxPercent = Number(row.get('taxPercent')?.value || 0);
        const totalAmount = +(amount + (amount * taxPercent) / 100).toFixed(2);
        row.patchValue(
            {
                amount: amount || null,
                totalAmount: amount ? totalAmount : null
            },
            { emitEvent: false }
        );
        this.recalcGrandTotal();
    }

    private recalcGrandTotal(): void {
        this.grandTotal = this.poItemArray.controls.reduce((sum, row) => {
            return sum + (Number(row.get('totalAmount')?.value) || Number(row.get('amount')?.value) || 0);
        }, 0);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VENDOR ASSIGNMENT DIALOG
    // ──────────────────────────────────────────────────────────────────────────

    openVendorDialog(): void {
        if (this.poItemArray.length === 0) return;
        if (!this.poForm.get('p_project')?.value) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a project before opening the vendor dialog.' });
            return;
        }
        this.showVendorDialog = true;
        this.isLoadingVendorDialog = true;
        const payload = this.createReturnPayload('VENDORSELECTION', this.poForm.get('p_project')?.value.toString(), this.authService.isLogIntType()?.companyid.toString());
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.allVendorList = Array.isArray(res.data) ? res.data : [];
                this.vendorOptionsByRow = this.poItemArray.controls.map((row) => {
                    const categoryId = row.get('item_category_id')?.value;
                    const itemId = row.get('item_id')?.value;
                    return this.allVendorList.filter((vendor) => vendor.item_category_id === categoryId && vendor.item_id === itemId);
                });
                this.buildVendorDialogRows();
                this.isLoadingVendorDialog = false;
            },
            error: (err: any) => {
                console.error('Error fetching vendor dialog item:', err);
                this.allVendorList = [];
                this.vendorOptionsByRow = [];
                this.isLoadingVendorDialog = false;
            }
        });
    }

    private buildVendorDialogRows(): void {
        this.vendorDialogRows = this.poItemArray.controls.map((row, index) => {
            const preferredVendor = this.vendorOptionsByRow[index].find((vendor) => vendor.preferred_vc === 'Y');
            return {
                category: row.get('category')?.value ?? '',
                item: row.get('item')?.value ?? '',
                vendorId: preferredVendor?.supplierid ?? row.get('vendor_id')?.value ?? null,
                rate: this.getVendorRate(preferredVendor)
            };
        });
    }

    onVendorDialogVendorChange(index: number, vendorId: number | null): void {
        const dialogRow = this.vendorDialogRows[index];
        const vendor = this.getVendorOptions(index).find((option) => option.supplierid === vendorId);
        dialogRow.vendorId = vendorId;
        dialogRow.rate = this.getVendorRate(vendor) ?? dialogRow.rate;
    }

    submitVendorAssignments(): void {
        this.vendorDialogRows.forEach((dialogRow, index) => {
            const vendor = this.getVendorOptions(index).find((option) => option.supplierid === dialogRow.vendorId);
            const row = this.poItemArray.at(index);
            row.patchValue(
                {
                    vendorName: vendor?.suppliername ?? null,
                    vendor_id: dialogRow.vendorId,
                    rate: dialogRow.rate
                },
                { emitEvent: false }
            );
            this.recalcRow(index);
        });
        this.syncSelectedVendors();
        this.showVendorDialog = false;
    }

    private getVendorRate(vendor: any): number | null {
        if (!vendor) return null;
        const rate = vendor.item_rate ?? null;
        return rate == null ? null : Number(rate);
    }

    openVendorMail(): void {
        const poId = this.poForm.get('p_pono')?.value;
        if (!poId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Select PO No',
                detail: 'Select a purchase order before opening mail.',
                life: 2500
            });
            return;
        }

        const payload = {
            p_returntype: 'GETPOMAIL',
            p_returnvalue: String(poId),
            p_username: ''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = Array.isArray(res.data) ? res.data : [];
                this.poMailVendorRows = rows.map((row: any) => ({
                    selected: false,
                    vendor: row.suppliername,
                    category: row.categoryname,
                    count: Number(row.attempt_count ?? 0),
                    vendorId: row.vendorid ?? row.supplierid ?? null,
                    email: row.vendor_email ?? row.supplieremail ?? null,
                    ccEmail: row.cc_email ?? null,
                    bccEmail: row.bcc_email ?? null,
                    subject: row.mail_subject ?? '',
                    body1: row.mail_body1 ?? '',
                    body2: row.mail_body2 ?? '',
                    attachmentPath: row.attachment_path ?? null,
                    mailLogId: row.mail_log_id ?? null
                }));
                this.showPoMailDialog = true;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Mail data load failed', detail: 'Unable to load vendors for this purchase order.', life: 2500 });
            }
        });
    }

    private sendMailToVendors(poId: number | null | undefined): void {
        if (!poId) return;

        const payload = {
            p_returntype: 'GETPOMAIL',
            p_returnvalue: String(poId),
            p_username: ''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = Array.isArray(res.data) ? res.data : [];
                const readyRows = rows.filter((row) => row.vendor_email ?? row.supplieremail);
                const missingEmail = rows.filter((row) => !(row.vendor_email ?? row.supplieremail));

                if (!readyRows.length) {
                    this.messageService.add({ severity: 'warn', summary: 'No vendor emails found', life: 2500 });
                    return;
                }

                this.workService
                    .sendVendorMail({
                        p_poid: poId,
                        p_username: this.userId,
                        p_mails: readyRows.map((row) => ({
                            vendorId: row.vendorid ?? row.supplierid ?? null,
                            email: row.vendor_email ?? row.supplieremail,
                            ccEmail: row.cc_email ?? null,
                            bccEmail: row.bcc_email ?? null,
                            subject: row.mail_subject ?? '',
                            body: `${row.mail_body1 ?? ''}${row.mail_body2 ?? ''}`,
                            attachmentPath: row.attachment_path ?? null,
                            mailLogId: row.mail_log_id ?? null
                        }))
                    })
                    .subscribe({
                        next: () => {
                            this.messageService.add({ severity: 'success', summary: 'PO emails sent', detail: `Purchase order shared with ${readyRows.length} vendor(s).`, life: 2500 });
                            if (missingEmail.length) {
                                this.messageService.add({ severity: 'warn', summary: 'Some vendors skipped', detail: `${missingEmail.map((row) => row.suppliername).join(', ')} has no email on file.`, life: 3000 });
                            }
                        },
                        error: (err) => this.messageService.add({ severity: 'error', summary: 'Mail send failed', detail: err.message, life: 2500 })
                    });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Vendor mail data load failed', life: 2500 })
        });
    }

    sendVendorPo(): void {
        const selectedRows = this.poMailVendorRows.filter((row) => row.selected);
        if (!selectedRows.length) {
            this.messageService.add({ severity: 'warn', summary: 'Select vendor', detail: 'Select at least one vendor before sending the PO email.', life: 2500 });
            return;
        }

        const missingEmail = selectedRows.filter((row) => !row.email);
        if (missingEmail.length) {
            this.messageService.add({ severity: 'warn', summary: 'Missing email', detail: `${missingEmail.map((row) => row.vendor).join(', ')} has no email on file.`, life: 3000 });
            return;
        }

        this.workService
            .sendVendorMail({
                p_poid: this.poForm.get('p_pono')?.value,
                p_username: this.userId,
                p_mails: selectedRows.map((row) => ({
                    vendorId: row.vendorId,
                    email: row.email,
                    ccEmail: row.ccEmail,
                    bccEmail: row.bccEmail,
                    subject: row.subject,
                    body: `${row.body1}${row.body2}`,
                    attachmentPath: row.attachmentPath,
                    mailLogId: row.mailLogId
                }))
            })
            .subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'PO email sent', detail: `Purchase order shared with ${selectedRows.length} vendor(s).`, life: 2500 });
                    this.showPoMailDialog = false;
                },
                error: (err) => this.messageService.add({ severity: 'error', summary: 'Send failed', detail: err.message, life: 2500 })
            });
    }

    private syncSelectedVendors(): void {
        const uniqueVendors = [...new Set(this.poItemArray.controls.map((row) => row.get('vendorName')?.value as string).filter((name) => !!name))];
        this.selectedVendorNames = uniqueVendors;
        this.poForm.get('p_vendor')?.setValue(uniqueVendors.join(', '), { emitEvent: false });
    }

    openMrDialog(): void {
        const poId = this.poForm.get('p_pono')?.value;
        if (!poId) {
            this.messageService.add({ severity: 'warn', summary: 'Select a pono first', life: 2500 });
            return;
        }
        this.showMrDialog = true;
        this.isLoadingMrPopup = true;
        const payload = this.createReturnPayload('PO4MR', poId.toString(), this.authService.isLogIntType()?.userid.toString());

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.mrPopupRows = res.data ?? [];
                this.includedMrList = this.buildIncludedMrList(this.mrPopupRows);
                this.isLoadingMrPopup = false;
            },
            error: (err: any) => {
                console.error('Error fetching MR popup rows:', err);
                this.mrPopupRows = [];
                this.includedMrList = [];
                this.isLoadingMrPopup = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to load material requisitions',
                    life: 2500
                });
            }
        });
    }

    private buildIncludedMrList(rows: any[]): any[] {
        const grouped = new Map<string, any>();

        rows.forEach((row) => {
            const key = row.mf_no ?? '';
            if (!key || grouped.has(key)) return;
            grouped.set(key, {
                mr_no: key,
                mf_id: row.mf_id ?? null,
                mr_date: row.mf_date ?? row.forecast_month ?? null,
                department: row.department_name ?? '',
                requested_by: row.requester ?? ''
            });
        });

        return Array.from(grouped.values());
    }

    // ── View click: same navigation flow as RFQ's included MR list ─────────────
    openMaterialRequisition(row: any): void {
        this.showMrDialog = false;
        this.sharedService.setReturnView({
            route: ['/layout/purchase/purchase-order'],
            state: {
                returnViewState: {
                    formValue: this.poForm.getRawValue(),
                    items: this.poItemArray.getRawValue(),
                    selectedVendorNames: this.selectedVendorNames,
                    grandTotal: this.grandTotal,
                    submitted: this.submitted
                }
            }
        });
        this.router.navigate(['/layout/purchase/material-requisition'], {
            queryParams: { mfNo: row.mr_no, mfId: row.mf_id ?? null, fromPurchaseOrderView: true }
        });
    }

    addAdvancePayment(): void {
        const total = Number(this.poForm.get('p_totalpayment')?.value || 0);

        // Guard: don't overpay
        const alreadyPaid = this.paymentHistory.reduce((s, p) => s + p.amount, 0);
        const maxAllowed = total - alreadyPaid;

        if ((this.newPayment.amount ?? 0) > maxAllowed) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Excess Amount',
                detail: `Maximum payable now is ₹${maxAllowed.toFixed(2)}`,
                life: 3000
            });
            return;
        }

        const newTotal = alreadyPaid + (this.newPayment.amount ?? 0);
        const remaining = +(total - newTotal).toFixed(2);

        const entry: PaymentEntry = {
            date: this.newPayment.date!,
            amount: +(this.newPayment.amount ?? 0).toFixed(2),
            mode: this.newPayment.mode || '—',
            referenceNo: this.newPayment.referenceNo || '',
            invoiceNo: this.newPayment.invoiceNo || '',
            performaInvoiceNo: this.newPayment.performaInvoiceNo || '',
            remainingAfter: remaining
        };

        this.paymentHistory = [...this.paymentHistory, entry];
        this.recalcPaymentSummary();

        // Reset input row
        this.newPayment = { date: new Date(), amount: 0, mode: '', referenceNo: '', invoiceNo: '', performaInvoiceNo: '' };
    }

    removePayment(index: number): void {
        this.paymentHistory.splice(index, 1);
        this.paymentHistory = [...this.paymentHistory]; // trigger change detection
        this.recalcPaymentSummary();
    }

    private recalcPaymentSummary(): void {
        const total = Number(this.poForm.get('p_totalpayment')?.value || 0);
        let running = 0;

        // Recalculate remainingAfter for every row after a deletion
        this.paymentHistory = this.paymentHistory.map((p) => {
            running += p.amount;
            return { ...p, remainingAfter: +(total - running).toFixed(2) };
        });

        this.totalPaid = +running.toFixed(2);

        this.poForm.patchValue({
            p_advancepayment: this.totalPaid,
            p_remainingpayment: (total - this.totalPaid).toFixed(2)
        });
    }

    resetPerformaTab(): void {
        this.editingPerformaIndex = null;
        this.performaFileName = '';
        this.performaFileDataUrl = '';
        this.showExistingPerformaDate = false;
        this.clearFileInput(this.performaFileInputRef);
        this.poForm.patchValue({
            p_performainvoiceno: '',
            p_performadate: this.today,
            p_performaamount: null,
            p_performafile: null
        });
    }

    resetInvoiceTab(): void {
        this.editingInvoiceIndex = null;
        this.invoiceFileName = '';
        this.invoiceFileDataUrl = '';
        this.clearFileInput(this.invoiceFileInputRef);
        this.poForm.patchValue({
            p_invoiceno: '',
            p_invoicedate: null,
            p_invoicepayment: null,
            p_invoicefile: null,
            p_freight: null,
            p_loadingcharge: null,
            p_cgst: null,
            p_sgst: null,
            p_igst: null,
            p_totaltaxableamount: null,
            p_misccharge: null,
            p_grandtotal: null,
            p_performainvoiceno_invoice: ''
        });
    }

    resetPaymentTab(): void {
        this.editingPaymentIndex = null;
        this.newPayment = { date: new Date(), amount: 0, mode: '', referenceNo: '', invoiceNo: '', performaInvoiceNo: '' };
    }
}
