import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { FileUploadModule } from 'primeng/fileupload';
import { TabViewModule } from 'primeng/tabview';
import { MultiSelectModule } from 'primeng/multiselect';
import { WorkService } from '@/core/services/work.service';
import { PurchaseDraftPayload, PurchaseOrderItem, PurchaseOrderPayload } from '@/core/models/authmodel/work.model';

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
        DropdownModule,
        InputNumberModule,
        InputTextModule,
        RadioButtonModule,
        TableModule,
        TooltipModule,
        TabViewModule,
        FileUploadModule,
        MultiSelectModule
    ],
    templateUrl: './purchase-order.component.html',
    styleUrl: './purchase-order.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class PurchaseOrderComponent implements OnInit {
    poForm!: FormGroup;
    today: Date = new Date();
    submitted = false;
    isLoadingProjects = false;
    isLoadingLocations = false;
    showForecastError = false;
    poList: { pono: string; [key: string]: any }[] = [];
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
    generatedPONos:any[]=[];
    vendorMasterOptions: any[] = [];

    showVendorDialog = false;
    showMrDialog = false;
    vendorDialogItem: AbstractControl | null = null;
    vendorDialogIndex: number | null = null;
    vendorFilter: 'lowest' | 'fastest' | 'preferred' = 'lowest';
    allVendorList:any[] = [];
    filteredVendorList: any[] = [];
    selectedVendor: any | null = null;
    performaFileName: string = '';
    
    companyId = '';
    userId = '';
    grandTotal = 0;
    isLoadingMrPopup = false;
    mrPopupRows: any[] = [];
    paymentHistory: PaymentEntry[] = [];
    totalPaid = 0;

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
        private workService: WorkService
    ) {}

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.companyId= this.authService.isLogIntType()?.companyid;
        this.initForm();
        this.loadDropdowns();
    }

    // ── Form initialisation ────────────────────────────────────────────────────
    private initForm(): void {
        this.poForm = this.fb.group(
            {
                p_pono: [null],
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

    // ── FormArray accessor ─────────────────────────────────────────────────────
    get poItemArray(): FormArray {
        return this.poForm.get('p_items') as FormArray;
    }

    getRowGroup(i: number): FormGroup {
        return this.poItemArray.at(i) as FormGroup;
    }

    // ── Load all dropdowns ─────────────────────────────────────────────────────
    private loadDropdowns(): void {
        this.onGetProject();
        this.onGetDraftPO();
        this.onGetPO();
        this.loadVendorMaster();
    }

    private loadVendorMaster(): void {
        const payload = {
            p_returntype: 'VENDORLIST',
            p_returnvalue: this.companyId.toString(),
            username: ''
        };

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

onGetPO(){
 const payload = {
            p_returntype: 'PONO',
            p_returnvalue: this.companyId.toString(),
            username: ''
        };
  this.inventoryService.Getreturndropdowndetails(payload).subscribe({
    next: (res: any) => {
      this.generatedPONos = res.data;
    },
    error: (err: any) => {
      console.error('Error fetching PO numbers:', err);
    }
  });
}

onGetDraftPO() {
   const payload = {
            p_returntype: 'PODRAFT',
            p_returnvalue: this.companyId.toString(),
            username: ''
        };
  this.inventoryService.Getreturndropdowndetails(payload).subscribe({
    next: (res: any) => {
      this.poList = res.data;
    },
    error: (err: any) => {
      console.error('Error fetching PO numbers:', err);
    }
  });
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
        this.loadItemsForProject(selectedProjectId);
    } else {
        this.poItemArray.clear();
        this.recalcGrandTotal();
    }
}

private loadItemsForProject(projectId: number): void {
    const payload = {
        p_returntype: 'MFAPPROVED',       // ⬅️ confirm this is the right return type for your API
        p_returnvalue: projectId.toString(),
        username: ''
    };

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

    // ── PO dropdown: load a previously submitted PO into the form ─────────────
    onPOSelect(event: any): void {
        // const po = this.poList.find(p => p.pono === event.value);
        // if (!po) return;
        // this.poForm.patchValue({
        //   p_podate:           po.poDate ? new Date(po.poDate) : null,
        //   p_project:          po.project,
        //   p_vendor:           po.vendor,
        //   p_deliverylocation: po.deliveryLocation,
        //   p_deliverydate:     po.deliveryDate ? new Date(po.deliveryDate) : null,
        //   p_paymentterms:     po.paymentTerms,
        //   p_remarks:          po.remarks
        // });
        // this.selectedMFNos = po.forecastRefNo ? po.forecastRefNo.split(', ') : [];
        // this.mapItemsToFormArray(po.items || []);
        // this.submitted = true;
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
            p_items_json: formVal.p_items,
            p_loginuser: this.authService.isLogIntType()?.userid.toString()
        };

     this.workService.upsertPurchaseOrder(payload).subscribe({
        next: (res: any) => {
            const data = res.data;

            if (data.success) {
                const pos = data.data as any[];

                   this.generatedPONos = pos.map((po) => ({
                    po_id: po.po_id,
                    po_no: po.po_no
                }));

                this.poForm.patchValue({
                    p_pono: pos[0]?.po_id ?? null,
                });

                this.poList = [...this.poList, ...pos];
                this.submitted = true;

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: data.msg,
                    life: 2500
                });
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
        // Replace with your API call:
        // this.inventoryService.savePerforma({ ...val }).subscribe(...)
        this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Performa details saved.',
            life: 2500
        });
    }

    // ── Invoice ───────────────────────────────────────────────
    onInvoicePaymentChange(): void {
        this.recalcPayments();
    }

    saveInvoice(): void {
        // Replace with your API call
        this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Invoice details saved.',
            life: 2500
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
        // Replace with your API call
        this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Payment details saved.',
            life: 2500
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
        tax_id: row.get('tax_id')?.value ?? null,
        tax_percent: row.get('taxPercent')?.value ?? 0,
        total_amount: row.get('totalAmount')?.value ?? 0,
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

    // ── Reset ──────────────────────────────────────────────────────────────────
    onReset(): void {
        this.poForm.reset();
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
    items.forEach((it) => {
        console.log(it)
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
                requiredQty: [(it.forecast_qty ?? 0) - (it.pending_qty ?? 0) - (it.available_stock ?? 0)],
                poQty: [null],
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

    onVendorDropdownChange(index: number, vendorId: number | null): void {
        const row = this.poItemArray.at(index);

        if (!vendorId) {
            row.patchValue(
                {
                    vendorName: null,
                    vendor_id: null
                },
                { emitEvent: false }
            );
            this.syncSelectedVendors();
            return;
        }

        const vendor = this.vendorMasterOptions.find((v) => v.supplierid === vendorId);
        row.patchValue(
            {
                vendorName: vendor?.suppliername ?? null,
                vendor_id: vendorId,
                rate: vendor?.lastrate ?? row.get('rate')?.value ?? null
            },
            { emitEvent: false }
        );

        this.recalcRow(index);
        this.syncSelectedVendors();
    }

    onPoQtyChange(i: number): void {
        this.recalcRow(i);
    }

    onRateChange(i: number): void {
        this.recalcRow(i);
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
    // VENDOR COMPARISON DIALOG
    // ──────────────────────────────────────────────────────────────────────────

private vendorFilterReturnTypeMap: Record<string, string> = {
    lowest: 'VENDORRATE',
    fastest: 'VENDORFAST',
    preferred: 'VENDORPREF'
};

    openVendorDialog(row: AbstractControl, index: number): void {
        this.vendorDialogItem = row;
        this.vendorDialogIndex = index;
        this.vendorFilter = 'lowest';
        this.selectedVendor = null;
       
        this.showVendorDialog = true;
        this.fetchVendorsForFilter(row)
    }

    onVendorFilterChange(filter: 'lowest' | 'fastest' | 'preferred'): void {
    this.vendorFilter = filter;
    if (this.vendorDialogItem) {
        this.fetchVendorsForFilter(this.vendorDialogItem);
    }
}

    private fetchVendorsForFilter(row:AbstractControl):void{
        const returnType = this.vendorFilterReturnTypeMap[this.vendorFilter]??'VENDORRATE';
        const payload = {
            p_returntype: returnType,
            p_returnvalue: this.companyId.toString(),
            username:''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next:(res:any)=>{
                console.log(res.data)
                this.allVendorList = res.data ?? [];
                this.filteredVendorList = [...this.allVendorList];
            },
             error: (err: any) => {
            console.error('Error fetching vendor list:', err);
            this.allVendorList = [];
            this.filteredVendorList = [];
        }
        });
    }

    confirmVendor(): void {
        if (!this.selectedVendor || this.vendorDialogIndex === null) return;

        const v = this.selectedVendor as any;
        const row = this.poItemArray.at(this.vendorDialogIndex);
        const qty = Number(row.get('poQty')?.value || 0);

        row.patchValue({
            vendorName: v.suppliername,
            vendor_id: v.supplierid ?? null,
            rate: v.lastrate,
            amount: qty ? +(qty * v.lastrate).toFixed(2) : null
        });

        this.recalcGrandTotal();
        this.syncSelectedVendors();
        this.showVendorDialog = false;

        this.messageService.add({
            severity: 'success',
            summary: 'Vendor Selected',
            detail: `${v.suppliername} assigned to ${row.get('item')?.value}`,
            life: 2000
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
        const projectId = this.poForm.get('p_project')?.value;
        if (!projectId) {
            this.messageService.add({ severity: 'warn', summary: 'Select a site first', life: 2500 });
            return;
        }

        this.showMrDialog = true;
        this.loadMrPopupRows(projectId);
    }

    private loadMrPopupRows(projectId: number): void {
        this.isLoadingMrPopup = true;
        const payload = {
            p_returntype: 'MFAPPROVED',
            p_returnvalue: projectId.toString(),
            username: ''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.mrPopupRows = res.data ?? [];
                this.isLoadingMrPopup = false;
            },
            error: (err: any) => {
                console.error('Error fetching MR popup rows:', err);
                this.mrPopupRows = [];
                this.isLoadingMrPopup = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to load material requisitions',
                    life: 2500
                });
            }
        });
    }

    /** Called after every vendor confirmation.
     *  Collects unique vendor names from all item rows,
     *  generates one PO No per vendor, updates the dropdown + multiselect. */
    // private regenerateVendorPONos(): void {
    //     // 1. Collect distinct vendor names from item rows
    //     const uniqueVendors = [...new Set(this.poItemArray.controls.map((row) => row.get('vendorName')?.value as string).filter((name) => !!name))];

    //     // 2. Generate one PO No per vendor (preserve existing mapping if already generated)
    //     const existingMap = new Map(this.generatedPONos.map((p) => [p.label, p.value]));
    //     this.generatedPONos = uniqueVendors.map((vendorName) => {
    //         const existing = existingMap.get(vendorName);
    //         return {
    //             label: `${vendorName}`, // display: "Vendor A — PO-00125"
    //             value: existing ?? this.generatePONo()
    //         };
    //     });

    //     // Better label with PO No visible
    //     this.generatedPONos = uniqueVendors.map((vendorName) => {
    //         const existing = existingMap.get(vendorName);
    //         const poNo = existing ?? this.generatePONo();
    //         existingMap.set(vendorName, poNo);
    //         return { label: `${poNo}  (${vendorName})`, value: poNo };
    //     });

    //     // 3. Update the vendor multiselect display
    //     this.selectedVendorNames = uniqueVendors;
    //     this.poForm.get('p_vendor')?.setValue(uniqueVendors);

    //     // 4. Auto-select first PO if only one vendor
    //     if (this.generatedPONos.length === 1) {
    //         this.poForm.patchValue({ p_pono: this.generatedPONos[0].value });
    //     }
    // }

    // ── Utility ────────────────────────────────────────────────────────────────
    // private generatePONo(): string {
    //     this.poCounter++;
    //     return `PO-${String(this.poCounter).padStart(5, '0')}`;
    // }

    // duplicatePO(): void {
    //     const raw = this.poForm.getRawValue();

    //     // 1. Snapshot current items
    //     const itemsSnapshot: MFItem[] = this.poItemArray.controls.map((row) => ({
    //         category: row.get('category')?.value,
    //         item: row.get('item')?.value,
    //         uom: row.get('uom')?.value,
    //         forecastQty: row.get('forecastQty')?.value,
    //         availableStock: row.get('availableStock')?.value,
    //         pendingPOQty: row.get('pendingPOQty')?.value,
    //         requiredQty: row.get('requiredQty')?.value
    //     }));

    //     // 2. Snapshot vendor assignments (poQty, vendorName, rate, amount)
    //     const vendorSnapshot = this.poItemArray.controls.map((row) => ({
    //         poQty: row.get('poQty')?.value,
    //         vendorName: row.get('vendorName')?.value,
    //         rate: row.get('rate')?.value,
    //         amount: row.get('amount')?.value
    //     }));

    //     // 3. Snapshot MF selections & vendor PO nos
    //     const mfSnapshot = [...this.selectedMFNos];
    //     const mfSelSnapshot = [...this.mfSelections];
    //     const vendorNamesSnap = [...this.selectedVendorNames];

    //     // 4. Reset form state
    //     this.poForm.reset();
    //     this.poItemArray.clear();
    //     this.submitted = false;
    //     this.showForecastError = false;
    //     this.grandTotal = 0;
    //     this.generatedPONos = [];
    //     this.selectedVendorNames = [];
    //     this.paymentHistory = [];
    //     this.totalPaid = 0;
    //     this.newPayment = { date: new Date(), amount: 0, mode: '', referenceNo: '' };

    //     // 5. Patch header fields — clear PO No, set date to today
    //     this.poForm.patchValue({
    //         p_pono: null, // cleared
    //         p_podate: new Date(), // today
    //         p_project: raw.p_project,
    //         p_deliverylocation: raw.p_deliverylocation,
    //         p_deliverydate: raw.p_deliverydate ? new Date(raw.p_deliverydate) : null,
    //         p_paymentterms: raw.p_paymentterms,
    //         p_remarks: raw.p_remarks
    //     });

    //     // 6. Restore MF chips
    //     this.selectedMFNos = mfSnapshot;
    //     this.mfSelections = mfSelSnapshot;

    //     // 7. Rebuild FormArray with items + vendor assignments
    //     itemsSnapshot.forEach((it, idx) => {
    //         const v = vendorSnapshot[idx];
    //         this.poItemArray.push(
    //             this.fb.group({
    //                 category: [it.category],
    //                 item: [it.item],
    //                 uom: [it.uom],
    //                 forecastQty: [it.forecastQty],
    //                 availableStock: [it.availableStock],
    //                 pendingPOQty: [it.pendingPOQty],
    //                 requiredQty: [it.requiredQty],
    //                 poQty: [v.poQty],
    //                 vendorName: [v.vendorName],
    //                 rate: [v.rate],
    //                 amount: [v.amount]
    //             })
    //         );
    //     });

    //     // 8. Restore vendor state & regenerate PO Nos fresh
    //     this.selectedVendorNames = vendorNamesSnap;
    //     this.poForm.get('p_vendor')?.setValue(vendorNamesSnap);
    //     this.regenerateVendorPONos();
    //     this.recalcGrandTotal();

    //     this.messageService.add({
    //         severity: 'info',
    //         summary: 'Duplicated',
    //         detail: 'PO duplicated — PO No. cleared and date set to today. Ready to submit.',
    //         life: 3000
    //     });
    // }

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
