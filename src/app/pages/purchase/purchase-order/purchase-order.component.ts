import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
import { forkJoin } from 'rxjs';

export interface PaymentEntry {
    date: Date;
    amount: number;
    mode: string;
    referenceNo: string;
    remainingAfter: number;
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
    poForm!: FormGroup;
    today: Date = new Date();
    submitted = false;
    isLoadingProjects = false;
    isLoadingLocations = false;
    showForecastError = false;
    onPODraftOptions:any[] = [];
    projectOptions:any[]=[];

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
    ponoOptions:any[]=[];
    vendorMasterOptions: any[] = [];
    vendorOptionsByRow: any[][] = [];

    showVendorDialog = false;
    showMrDialog = false;
    showPoMailDialog = false;
    allVendorList:any[] = [];
    isLoadingVendorDialog = false;
    vendorDialogRows: { category: string; item: string; vendorId: number | null; rate: number | null }[] = [];
    performaFileName: string = '';
    
    companyId = '';
    userId = '';
    grandTotal = 0;
    isLoadingMrPopup = false;
    mrPopupRows: any[] = [];
    includedMrList: any[] = [];
    paymentHistory: PaymentEntry[] = [];
    totalPaid = 0;
    poMailVendorRows: GmailVendorRow[] = [];

    newPayment: Partial<PaymentEntry> = {
        date: new Date(),
        amount: 0,
        mode: '',
        referenceNo: ''
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
        private sharedService: ShareService
    ) {}

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.companyId= this.authService.isLogIntType()?.companyid;
        this.userId = this.authService.isLogIntType()?.userid?.toString() ?? '';
        this.initForm();
        this.restoreViewState();
        this.loadDropdowns();
    }

    // ── Form initialisation ────────────────────────────────────────────────────
    private initForm(): void {
        this.poForm = this.fb.group(
            {
                p_pono: [null],
                status: [''],
                p_podate: [this.today, Validators.required],
                p_project: [null, Validators.required],
                p_vendor: [{ value: [], disabled: true }],
                p_deliverylocation: [{value: null, disabled:true}],
                p_deliverydate: [null],
                p_paymentterms: [{value: null, disabled:true}],
                p_remarks: [''],
                p_forecastrefno: [''],
                p_items: this.fb.array([]),
                // ── Performa fields ──
                p_performainvoiceno: [''],
                p_performadate: [null],
                p_performafile: [null],

                // ── Invoice fields ──
                p_invoiceno: [''],
                p_invoicedate: [null],
                p_invoicepayment: [null],
                p_freight: [null],
                p_loadingcharge: [null],
                p_gst: [null],
                p_transit: [null],

                // ── Payment fields ──
                p_payment: [null],
                p_totalpayment: [{ value: '', disabled: true }],
                p_remainingpayment: [{ value: '', disabled: true }]
            },
            { validators: this.dateRangeValidator() }
        );

        this.poForm.get('p_podate')?.valueChanges.subscribe(() => {
            this.poForm.get('p_deliverydate')?.updateValueAndValidity();
        });
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

                // PO date must not be less than today
                if (po < today) {
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
   const payload =  this.createReturnPayload('PROJECTRFQ4PO', projectId.toString(), this.authService.isLogIntType()?.userid.toString());
   this.inventoryService.Getreturndropdowndetails(payload).subscribe({
    next: (res: any) => {
        const rows: any[] = res.data || [];

        if (rows.length === 0) {
            this.poItemArray.clear();
            this.recalcGrandTotal();
            this.messageService.add({
                severity: 'info',
                summary: 'No Data',
                detail: 'No RFQ items found for this site.',
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
   })
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

    this.poForm.patchValue({
        p_pono: isDraft ? header.draft_id : header.po_id,
        p_project: header.project_id ?? null,
        status: header.status ?? '',
        p_deliverylocation: header.delivery_location ?? '',
        p_deliverydate: (header.delivery_date) ? new Date(header.delivery_date) : null,
        p_paymentterms: header.payment_terms ?? null,
        p_remarks: header.remarks ?? ''
    });

    this.mapPODetailRowsToFormArray(rows, header.vendor_id);
    this.submitted = true;
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
                mf_no: [''],
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

    // ── Disable submit when no items ───────────────────────────────────────────
    isSubmitDisabled(): boolean {
        return this.poItemArray.length === 0;
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
        const payload:PurchaseOrderPayload = {
            p_action: 'SUBMIT',
            p_operation:'INSERT',
            p_po_id: 0,
            p_draft_id: 0,
            p_company_id: Number(this.companyId),
            p_project_id: formVal.p_project,
            p_department_id: formVal.department_id ||8,
            p_po_date: this.datePipe.transform(formVal.p_podate, 'yyyy-MM-dd'),
            p_delivery_date: this.datePipe.transform(formVal.p_deliverydate, 'yyyy-MM-dd'),
            p_delivery_location: formVal.p_deliverylocation || '',
            p_payment_terms: formVal.p_paymentterms,
            p_remarks: formVal.p_remarks,
            p_items_json: this.buildItemsPayload(),
            p_loginuser: this.authService.isLogIntType()?.userid.toString()
        };

     this.workService.upsertPurchaseOrder(payload).subscribe({
        next: (res: any) => {
            const data = res.data;

            if (data.success) {
                const pos = data.data as any[];

                   this.ponoOptions = pos.map((po) => ({
                    po_id: po.po_id,
                    po_no: po.po_no
                }));

                this.poForm.patchValue({
                    p_pono: pos[0]?.po_id ?? null,
                    status: data.tran_status
                });

                this.onPODraftOptions = [...this.onPODraftOptions, ...pos];
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
        this.poForm.patchValue({ p_performafile: file });
    }

    savePerforma(): void {
        const val = this.poForm.getRawValue();
        const payload = {
            p_operation: 'INSERT',
            p_performa_id: null,
            p_po_id: this.poForm.get('p_pono')?.value,
            p_invoice_no: val.p_performainvoiceno || null,
            p_invoice_date: this.datePipe.transform(val.p_performadate, 'yyyy-MM-dd'),
            p_amount: this.grandTotal,
            p_document_path: val.p_performafile?.name || null,
            p_remarks: val.p_remarks || null,
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertPOPerforma(payload).subscribe({
            next: (res: any) => this.showSaveResult(res, 'Performa details saved.'),
            error: (err) => this.showSaveError(err, 'Performa save failed.')
        });
    }

    // ── Invoice ───────────────────────────────────────────────
    onInvoicePaymentChange(): void {
        this.recalcPayments();
    }

    saveInvoice(): void {
        const val = this.poForm.getRawValue();
        const payload = {
            p_operation: 'INSERT',
            p_invoice_id: null,
            p_po_id: this.poForm.get('p_pono')?.value,
            p_invoice_no: val.p_invoiceno || null,
            p_invoice_date: this.datePipe.transform(val.p_invoicedate, 'yyyy-MM-dd'),
            p_amount: Number(val.p_invoicepayment || 0),
            p_freight: Number(val.p_freight || 0),
            p_loading_charge: Number(val.p_loadingcharge || 0),
            p_gst_amount: Number(val.p_gst || 0),
            p_invoice_transit: val.p_transit || null,
            p_document_path: null,
            p_remarks: val.p_remarks || null,
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertPOInvoice(payload).subscribe({
            next: (res: any) => this.showSaveResult(res, 'Invoice details saved.'),
            error: (err) => this.showSaveError(err, 'Invoice save failed.')
        });
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
        const payments = this.paymentHistory.map((payment) => this.workService.upsertPOPayment({
            p_operation: 'INSERT',
            p_payment_id: null,
            p_po_id: poId,
            p_payment_date: this.datePipe.transform(payment.date, 'yyyy-MM-dd'),
            p_amount: Number(payment.amount || 0),
            p_payment_mode: payment.mode || null,
            p_transaction_no: payment.referenceNo || null,
            p_bank_name: null,
            p_remarks: this.poForm.get('p_remarks')?.value || null,
            p_loginuser: Number(this.userId)
        }));

        if (!payments.length) {
            return;
        }

        forkJoin(payments).subscribe({
            next: (responses: any[]) => {
                const failed = responses.find((res) => res?.data?.success === false);
                if (failed) {
                    this.showSaveResult(failed, 'Payment save failed.');
                    return;
                }
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Payment details saved.', life: 2500 });
            },
            error: (err) => this.showSaveError(err, 'Payment save failed.')
        });
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

submitDraft(): void {
    if (this.poItemArray.length === 0) {
        this.messageService.add({ severity: 'error', summary: 'No Items', detail: 'Add at least one MF item before saving a draft.', life: 3000 });
        return;
    }

    const v = this.poForm.getRawValue();
    console.log('v=',v)
    const draftId: number = v.p_draft_id ?? 0;
    const operation = draftId ? 'UPDATE' : 'INSERT';

    const payload:PurchaseDraftPayload = {
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
        p_loginuser:this.authService.isLogIntType().userid
    };

    this.workService.upsertPODraft(payload).subscribe({
        next: (res) => {
          
            if(res.data.success){
                  this.poForm.patchValue({ 
                    p_pono: res.data.draft_no,
                    p_draft_id: res.data.draft_id
                });
            this.messageService.add({
                severity: 'success',
                summary: res.data.msg,
                detail: `Draft PO #${res.data.draft_no} saved.`,
                life: 2500
            });
        }else {
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
        this.poForm.reset({
            p_podate: this.today
        });
        this.poItemArray.clear();
        this.submitted = false;
        this.showForecastError = false;
        this.grandTotal = 0;
        this.selectedVendorNames = [];
        this.paymentHistory = [];
        this.totalPaid = 0;
        this.newPayment = { date: new Date(), amount: 0, mode: '', referenceNo: '' };
    }

    // ── Print ──────────────────────────────────────────────────────────────────
    printPO(): void {
        const printContents = document.getElementById('poPrintSection')?.innerHTML;
        if (!printContents) return;
        const w = window.open('', '_blank', 'width=900,height=1200');
        w!.document.open();
        w!.document.write(
            `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;}</style></head><body>${printContents}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}</script></body></html>`
        );
        w!.document.close();
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
                mf_no: [''],
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
            case 'SUBMIT':
                return 'blue';
            case 'REJECTED':
                return 'red';
            case 'DRAFT':
                return 'grey';
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
         if(!this.poForm.get('p_project')?.value) {
            this.messageService.add({severity:'warn', summary:'Warning', detail:'Please select a project before opening the vendor dialog.'});
            return;
         };
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
    const rate = vendor.item_rate ??  null;
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

                this.workService.sendRfqMail({
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
                }).subscribe({
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

        this.workService.sendRfqMail({
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
        }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'PO email sent', detail: `Purchase order shared with ${selectedRows.length} vendor(s).`, life: 2500 });
                this.showPoMailDialog = false;
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Send failed', detail: err.message, life: 2500 })
        });
    }

    private syncSelectedVendors(): void {
        const uniqueVendors = [
            ...new Set(this.poItemArray.controls.map((row) => row.get('vendorName')?.value as string).filter((name) => !!name))
        ];
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
        const payload = this.createReturnPayload('PROJECTRFQ4MR', poId.toString(), this.authService.isLogIntType()?.userid.toString());

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
            remainingAfter: remaining
        };

        this.paymentHistory = [...this.paymentHistory, entry];
        this.recalcPaymentSummary();

        // Reset input row
        this.newPayment = { date: new Date(), amount: 0, mode: '', referenceNo: '' };
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
}
