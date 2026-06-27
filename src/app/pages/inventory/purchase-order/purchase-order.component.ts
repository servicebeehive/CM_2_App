import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
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

// ── Replace these imports with your actual services ──────────────────────────
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { FileUploadModule } from 'primeng/fileupload';
import { TabViewModule } from 'primeng/tabview';
import { MultiSelectModule } from 'primeng/multiselect';
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of a single MF record returned by the backend */
export interface MFRecord {
  mfno: string;
  department: string;
  requestedBy: string;
  forecastDate: string;
  totalItems: number;
  status: string;
  /** Items belonging to this MF */
  items: MFItem[];
}

/** A single line item inside an MF */
export interface MFItem {
  category: string;
  item: string;
  uom: string;
  forecastQty: number;
  availableStock: number;
  pendingPOQty: number;
  requiredQty: number;
}

/** A vendor record for comparison */
export interface VendorRecord {
  name: string;
  lastOrder: string;
  lastRate: number;
  paymentTerm: string;
  deliveryDays: number;
}

/** A single advance payment entry */
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

  // ── Form ───────────────────────────────────────────────────────────────────
  poForm!: FormGroup;

  // ── UI state ───────────────────────────────────────────────────────────────
  today: Date = new Date();
  submitted = false;
 
  isLoadingProjects = false;
  isLoadingLocations = false;
  showForecastError = false;

  // ── Submitted PO list (for the top dropdown) ───────────────────────────────
  poList: { pono: string; [key: string]: any }[] = [];

  // ── Forecast reference chips ───────────────────────────────────────────────
  selectedMFNos: string[] = [];

  // ── Dropdown data (replace with API calls) ─────────────────────────────────
  projectOptions: { label: string; value: string }[] = [
    { label: 'Project A', value: 'Project A' },
    { label: 'Project B', value: 'Project B' },
    { label: 'Project C', value: 'Project C' }
  ];

  deliveryLocationOptions: { label: string; value: string }[] = [
    { label: 'Site Office - Block A', value: 'Site Office - Block A' },
    { label: 'Site Office - Block B', value: 'Site Office - Block B' },
    { label: 'Warehouse - Main', value: 'Warehouse - Main' },
    { label: 'Warehouse - South', value: 'Warehouse - South' }
  ];

  paymentTermsOptions: { label: string; value: string }[] = [
    { label: '30 Days Net', value: '30 Days Net' },
    { label: '60 Days Net', value: '60 Days Net' },
    { label: 'Advance Payment', value: 'Advance Payment' },
    { label: 'On Delivery', value: 'On Delivery' }
  ];

  // ── MF Dialog ──────────────────────────────────────────────────────────────
  showMFDialog = false;
  mfList: MFRecord[] = [];
  mfSelections: MFRecord[] = [];
  generatedPONos: { label: string; value: string }[] = [];
selectedVendorNames: string[] = [];

  // ── Vendor Comparison Dialog ───────────────────────────────────────────────
  showVendorDialog = false;
  vendorDialogItem: AbstractControl | null = null;
  vendorDialogIndex: number | null = null;
  vendorFilter: 'lowest' | 'fastest' | 'preferred' = 'lowest';
  allVendorList: VendorRecord[] = [];
  filteredVendorList: VendorRecord[] = [];
  selectedVendor: VendorRecord | null = null;
  performaFileName: string = '';

  // ── Grand total ────────────────────────────────────────────────────────────
  grandTotal = 0;

  // ── PO counter (replace with backend auto-increment) ──────────────────────
  private poCounter = 124;
  // ── Payment history ────────────────────────────────────────────────────────
paymentHistory: PaymentEntry[] = [];
totalPaid = 0;

newPayment: Partial<PaymentEntry> = {
  date: new Date(),
  amount: 0,
  mode: '',
  referenceNo: ''
};

paymentModeOptions: { label: string; value: string }[] = [
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'Cash',          value: 'Cash'          },
  { label: 'Cheque',        value: 'Cheque'        },
  { label: 'UPI',           value: 'UPI'           }
];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  // ── Form initialisation ────────────────────────────────────────────────────
  private initForm(): void {
    this.poForm = this.fb.group({
      p_pono:             [null],
      p_podate:           [this.today, Validators.required],
      p_project:          [null, Validators.required],
     p_vendor: [{ value: [], disabled: true }],
      p_deliverylocation: [null],
      p_deliverydate:     [null],
      p_paymentterms:     [null],
      p_remarks:          [''],
      p_forecastrefno:    [''],
      p_items:            this.fb.array([]),
      // ── Performa fields ──
p_performainvoiceno: [''],
p_performadate:      [null],
p_performafile:      [null],

// ── Invoice fields ──
p_invoiceno:         [''],
p_invoicedate:       [null],
p_invoicepayment:    [null],
p_freight:           [null],
p_loadingcharge:     [null],
p_gst:               [null],
p_transit:           [null],

// ── Payment fields ──
p_payment:    [null],
p_totalpayment:      [{ value: '', disabled: true }],
p_remainingpayment:  [{ value: '', disabled: true }],
    }, { validators: this.dateRangeValidator() });

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
    this.loadProjects();
    this.loadDeliveryLocations();
    this.loadMFList();
    this.loadDraftPOs();
  }

  private dateRangeValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const poDate       = group.get('p_podate')?.value;
    const deliveryDate = group.get('p_deliverydate')?.value;
    const today        = new Date();
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
      const po       = new Date(poDate);
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


getTotalPayable(): number {
  return Number(this.poForm.get('p_totalpayment')?.value || 0);
}

/** Live preview of remaining after typing amount in the input row */
getPreviewRemaining(): number {
  return +(this.getRemainingPayment() - (this.newPayment.amount ?? 0)).toFixed(2);
}
  /**
   * Load projects from backend.
   * Replace body with your real API call.
   */
  private loadProjects(): void {
    this.isLoadingProjects = true;
    // Example:
    // this.inventoryService.getdropdowndetails({ p_returntype: 'PROJECT' }).subscribe({
    //   next: res => {
    //     this.projectOptions = res.data.map((d: any) => ({ label: d.projectname, value: d.projectid }));
    //     this.isLoadingProjects = false;
    //   },
    //   error: () => this.isLoadingProjects = false
    // });
    this.isLoadingProjects = false; // remove once API is wired
  }

  /**
   * Load delivery locations from backend.
   * Replace body with your real API call.
   */
  private loadDeliveryLocations(): void {
    this.isLoadingLocations = true;
    // Example:
    // this.inventoryService.getdropdowndetails({ p_returntype: 'DELIVERY_LOCATION' }).subscribe({
    //   next: res => {
    //     this.deliveryLocationOptions = res.data.map((d: any) => ({ label: d.locationname, value: d.locationid }));
    //     this.isLoadingLocations = false;
    //   },
    //   error: () => this.isLoadingLocations = false
    // });
    this.isLoadingLocations = false; // remove once API is wired
  }

  /**
   * Load approved MF records from backend.
   * Replace body with your real API call.
   */
  private loadMFList(): void {
    // Example:
    // this.inventoryService.getdropdowndetails({ p_returntype: 'APPROVED_MF' }).subscribe({
    //   next: res => { this.mfList = res.data; },
    //   error: err => console.error(err)
    // });

    // ── Static mock data — remove once API is wired ────────────────────────
    this.mfList = [
      {
        mfno: 'MF-00125', department: 'Civil', requestedBy: 'Rajesh',
        forecastDate: '10-Jun-26', totalItems: 15, status: 'Approved',
        items: [
          { category: 'Cement', item: 'Cement OPC 53', uom: 'Bag', forecastQty: 1200, availableStock: 400, pendingPOQty: 300, requiredQty: 500 },
          { category: 'Steel', item: 'Steel TMT 12mm', uom: 'Kg', forecastQty: 13500, availableStock: 5000, pendingPOQty: 3000, requiredQty: 5500 }
        ]
      },
      {
        mfno: 'MF-00128', department: 'Electrical', requestedBy: 'Amit',
        forecastDate: '11-Jun-26', totalItems: 8, status: 'Approved',
        items: [
          { category: 'Wire', item: 'Copper Wire 2.5mm', uom: 'Mtr', forecastQty: 500, availableStock: 100, pendingPOQty: 50, requiredQty: 350 }
        ]
      },
      {
        mfno: 'MF-00130', department: 'Plumbing', requestedBy: 'Suresh',
        forecastDate: '11-Jun-26', totalItems: 6, status: 'Approved',
        items: [
          { category: 'Pipe', item: 'PVC Pipe 4 inch', uom: 'Mtr', forecastQty: 200, availableStock: 50, pendingPOQty: 20, requiredQty: 130 }
        ]
      }
    ];
  }

  /**
   * Load already-submitted draft POs for the top dropdown.
   * Replace body with your real API call.
   */
  private loadDraftPOs(): void {
    // this.isLoadingPOs = true;
    // Example:
    // this.inventoryService.getdropdowndetails({ p_returntype: 'DRAFT_PO' }).subscribe({
    //   next: res => { this.poList = res.data; this.isLoadingPOs = false; },
    //   error: () => this.isLoadingPOs = false
    // });
    // this.isLoadingPOs = false;
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.poForm.markAllAsTouched();
    this.showForecastError = this.selectedMFNos.length === 0;

    if (this.poForm.invalid || this.showForecastError || this.poItemArray.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Failed',
        detail: 'Please fill all required fields.',
        life: 3000
      });
      return;
    }

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
    const newPONo = this.generatePONo();
    const formVal = this.poForm.getRawValue();

    const payload = {
      p_pono:             newPONo,
      p_podate:           this.datePipe.transform(formVal.p_podate, 'dd/MM/yyyy'),
      p_project:          formVal.p_project,
      p_vendor:           formVal.p_vendor,
      p_deliverylocation: formVal.p_deliverylocation,
      p_deliverydate:     this.datePipe.transform(formVal.p_deliverydate, 'dd/MM/yyyy'),
      p_paymentterms:     formVal.p_paymentterms,
      p_remarks:          formVal.p_remarks,
      p_forecastrefno:    this.selectedMFNos.join(', '),
      p_items:            formVal.p_items
    };

    // ── Replace below with your real API call ──────────────────────────────
    // this.inventoryService.createPurchaseOrder(payload).subscribe({
    //   next: res => { ... },
    //   error: err => { ... }
    // });

    // ── Mock success flow (remove once API is wired) ────────────────────────
    this.poList = [...this.poList, { ...payload, pono: newPONo }];
    this.poForm.patchValue({ p_pono: newPONo });
    this.submitted = true;

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Purchase Order ${newPONo} submitted successfully!`,
      life: 3000
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
    severity: 'success', summary: 'Saved', detail: 'Performa details saved.', life: 2500
  });
}

// ── Invoice ───────────────────────────────────────────────
onInvoicePaymentChange(): void {
  this.recalcPayments();
}

saveInvoice(): void {
  // Replace with your API call
  this.messageService.add({
    severity: 'success', summary: 'Saved', detail: 'Invoice details saved.', life: 2500
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
  const freight        = Number(this.poForm.get('p_freight')?.value        || 0);
  const loading        = Number(this.poForm.get('p_loadingcharge')?.value  || 0);
  const total          = +(invoicePayment + freight + loading).toFixed(2);
  const advance        = Number(this.poForm.get('p_payment')?.value || 0);
  const remaining      = +(total - advance).toFixed(2);

  this.poForm.patchValue({
    p_totalpayment:     total.toFixed(2),
    p_remainingpayment: remaining.toFixed(2)
  });
}

savePayment(): void {
  // Replace with your API call
  this.messageService.add({
    severity: 'success', summary: 'Saved', detail: 'Payment details saved.', life: 2500
  });
}

  /** Draft: save without final submission */
  submitDraft(): void {
    const newPONo = this.generatePONo();
    this.poForm.patchValue({ p_pono: newPONo });
    this.messageService.add({
      severity: 'info',
      summary: 'Draft Saved',
      detail: `Draft PO ${newPONo} saved.`,
      life: 2500
    });
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  onReset(): void {
    this.poForm.reset();
    this.poItemArray.clear();
    this.selectedMFNos = [];
    this.mfSelections = [];
    this.submitted = false;
    this.showForecastError = false;
    this.grandTotal = 0;
    this.generatedPONos    = [];  
  this.selectedVendorNames = [];
  this.paymentHistory = [];
this.totalPaid      = 0;
this.newPayment     = { date: new Date(), amount: 0, mode: '', referenceNo: '' };
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  printPO(): void {
    const printContents = document.getElementById('poPrintSection')?.innerHTML;
    if (!printContents) return;
    const w = window.open('', '_blank', 'width=900,height=1200');
    w!.document.open();
    w!.document.write(`<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;}</style></head><body>${printContents}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}</script></body></html>`);
    w!.document.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MF DIALOG
  // ──────────────────────────────────────────────────────────────────────────

  openMFDialog(): void {
    // Pre-select already-chosen MFs
    this.mfSelections = this.mfList.filter(m => this.selectedMFNos.includes(m.mfno));
    this.showMFDialog = true;
  }

  confirmMFSelection(): void {
    this.selectedMFNos = this.mfSelections.map(m => m.mfno);
    this.poForm.patchValue({ p_forecastrefno: this.selectedMFNos.join(', ') });
    this.showForecastError = false;

    // Merge items from all selected MFs (deduplicate by item name)
    const merged: MFItem[] = [];
    this.mfSelections.forEach(mf => {
      mf.items.forEach(it => {
        if (!merged.find(x => x.item === it.item)) {
          merged.push(it);
        }
      });
    });

    this.mapItemsToFormArray(merged);
    this.showMFDialog = false;
  }

  /** Build FormArray rows from an array of items */
  private mapItemsToFormArray(items: MFItem[]): void {
    this.poItemArray.clear();
    items.forEach(it => {
      this.poItemArray.push(this.fb.group({
        category:      [it.category],
        item:          [it.item],
        uom:           [it.uom],
        forecastQty:   [it.forecastQty],
        availableStock:[it.availableStock],
        pendingPOQty:  [it.pendingPOQty],
        requiredQty:   [it.requiredQty],
        poQty:         [null],
        vendorName:    [''],
        rate:          [null],
        amount:        [null]
      }));
    });
    this.recalcGrandTotal();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TABLE CALCULATIONS
  // ──────────────────────────────────────────────────────────────────────────

  onPoQtyChange(i: number): void {
    this.recalcRow(i);
  }

  onRateChange(i: number): void {
    this.recalcRow(i);
  }

  private recalcRow(i: number): void {
    const row = this.poItemArray.at(i);
    const qty  = Number(row.get('poQty')?.value || 0);
    const rate = Number(row.get('rate')?.value || 0);
    row.patchValue({ amount: qty && rate ? +(qty * rate).toFixed(2) : null }, { emitEvent: false });
    this.recalcGrandTotal();
  }

  private recalcGrandTotal(): void {
    this.grandTotal = this.poItemArray.controls.reduce((sum, row) => {
      return sum + (Number(row.get('amount')?.value) || 0);
    }, 0);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VENDOR COMPARISON DIALOG
  // ──────────────────────────────────────────────────────────────────────────

  openVendorDialog(row: AbstractControl, index: number): void {
    this.vendorDialogItem  = row;
    this.vendorDialogIndex = index;
    this.vendorFilter      = 'lowest';
    this.selectedVendor    = null;

    // Load vendor list for this item.
    // Replace with your real API call, e.g.:
    // this.inventoryService.getVendorsForItem({ p_itemname: row.get('item')?.value }).subscribe({
    //   next: res => { this.allVendorList = res.data; this.sortVendors(); },
    //   error: err => console.error(err)
    // });

    // ── Static vendor mock data — remove once API is wired ─────────────────
    const itemName: string = row.get('item')?.value || '';
    const vendorMap: Record<string, VendorRecord[]> = {
      'Cement OPC 53': [
        { name: 'Vendor A', lastOrder: 'ACC Cement',  lastRate: 380, paymentTerm: '30 Days', deliveryDays: 3 },
        { name: 'Vendor B', lastOrder: 'Ultratech',   lastRate: 370, paymentTerm: 'Advance', deliveryDays: 2 },
        { name: 'Vendor C', lastOrder: 'ACC Cement',  lastRate: 395, paymentTerm: '60 Days', deliveryDays: 5 }
      ],
      'Steel TMT 12mm': [
        { name: 'Vendor A', lastOrder: 'TATA Steel',  lastRate: 58,  paymentTerm: '30 Days', deliveryDays: 4 },
        { name: 'Vendor B', lastOrder: 'JSW Steel',   lastRate: 55,  paymentTerm: 'Advance', deliveryDays: 3 },
        { name: 'Vendor C', lastOrder: 'SAIL',        lastRate: 60,  paymentTerm: '60 Days', deliveryDays: 6 }
      ]
    };
    this.allVendorList = vendorMap[itemName] ?? [
      { name: 'Vendor A', lastOrder: 'Generic', lastRate: 100, paymentTerm: '30 Days', deliveryDays: 3 },
      { name: 'Vendor B', lastOrder: 'Generic', lastRate: 95,  paymentTerm: 'Advance', deliveryDays: 2 },
      { name: 'Vendor C', lastOrder: 'Generic', lastRate: 110, paymentTerm: '60 Days', deliveryDays: 5 }
    ];

    this.sortVendors();
    this.showVendorDialog = true;
  }

  /** Sort the vendor list based on the selected radio filter */
  sortVendors(): void {
    const list = [...this.allVendorList];
    if (this.vendorFilter === 'lowest') {
      list.sort((a, b) => a.lastRate - b.lastRate);
    } else if (this.vendorFilter === 'fastest') {
      list.sort((a, b) => a.deliveryDays - b.deliveryDays);
    }
    // 'preferred' keeps original order
    this.filteredVendorList = list;
  }

  confirmVendor(): void {
    if (!this.selectedVendor || this.vendorDialogIndex === null) return;

    const v = this.selectedVendor;
    const row = this.poItemArray.at(this.vendorDialogIndex);
    const qty = Number(row.get('poQty')?.value || 0);

    row.patchValue({
      vendorName: v.name,
      rate:       v.lastRate,
      amount:     qty ? +(qty * v.lastRate).toFixed(2) : null
    });

    // Also patch the header vendor field with the selected vendor name
    this.poForm.patchValue({ p_vendor: v.name });

    this.recalcGrandTotal();
    this.regenerateVendorPONos();
    this.showVendorDialog = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Vendor Selected',
      detail: `${v.name} assigned to ${row.get('item')?.value}`,
      life: 2000
    });
  }

/** Called after every vendor confirmation.
 *  Collects unique vendor names from all item rows,
 *  generates one PO No per vendor, updates the dropdown + multiselect. */
private regenerateVendorPONos(): void {
  // 1. Collect distinct vendor names from item rows
  const uniqueVendors = [
    ...new Set(
      this.poItemArray.controls
        .map(row => row.get('vendorName')?.value as string)
        .filter(name => !!name)
    )
  ];

  // 2. Generate one PO No per vendor (preserve existing mapping if already generated)
  const existingMap = new Map(this.generatedPONos.map(p => [p.label, p.value]));
  this.generatedPONos = uniqueVendors.map(vendorName => {
    const existing = existingMap.get(vendorName);
    return {
      label: `${vendorName}`,           // display: "Vendor A — PO-00125"
      value: existing ?? this.generatePONo()
    };
  });

  // Better label with PO No visible
  this.generatedPONos = uniqueVendors.map(vendorName => {
    const existing = existingMap.get(vendorName);
    const poNo = existing ?? this.generatePONo();
    existingMap.set(vendorName, poNo);
    return { label: `${poNo}  (${vendorName})`, value: poNo };
  });

  // 3. Update the vendor multiselect display
  this.selectedVendorNames = uniqueVendors;
  this.poForm.get('p_vendor')?.setValue(uniqueVendors);

  // 4. Auto-select first PO if only one vendor
  if (this.generatedPONos.length === 1) {
    this.poForm.patchValue({ p_pono: this.generatedPONos[0].value });
  }
}

  // ── Utility ────────────────────────────────────────────────────────────────
  private generatePONo(): string {
    this.poCounter++;
    return `PO-${String(this.poCounter).padStart(5, '0')}`;
  }

  duplicatePO(): void {
  const raw = this.poForm.getRawValue();

  // 1. Snapshot current items
  const itemsSnapshot: MFItem[] = this.poItemArray.controls.map(row => ({
    category:      row.get('category')?.value,
    item:          row.get('item')?.value,
    uom:           row.get('uom')?.value,
    forecastQty:   row.get('forecastQty')?.value,
    availableStock:row.get('availableStock')?.value,
    pendingPOQty:  row.get('pendingPOQty')?.value,
    requiredQty:   row.get('requiredQty')?.value,
  }));

  // 2. Snapshot vendor assignments (poQty, vendorName, rate, amount)
  const vendorSnapshot = this.poItemArray.controls.map(row => ({
    poQty:      row.get('poQty')?.value,
    vendorName: row.get('vendorName')?.value,
    rate:       row.get('rate')?.value,
    amount:     row.get('amount')?.value,
  }));

  // 3. Snapshot MF selections & vendor PO nos
  const mfSnapshot       = [...this.selectedMFNos];
  const mfSelSnapshot    = [...this.mfSelections];
  const vendorNamesSnap  = [...this.selectedVendorNames];

  // 4. Reset form state
  this.poForm.reset();
  this.poItemArray.clear();
  this.submitted         = false;
  this.showForecastError = false;
  this.grandTotal        = 0;
  this.generatedPONos      = [];
  this.selectedVendorNames = [];
  this.paymentHistory = [];
this.totalPaid      = 0;
this.newPayment     = { date: new Date(), amount: 0, mode: '', referenceNo: '' };

  // 5. Patch header fields — clear PO No, set date to today
  this.poForm.patchValue({
    p_pono:             null,           // cleared
    p_podate:           new Date(),     // today
    p_project:          raw.p_project,
    p_deliverylocation: raw.p_deliverylocation,
    p_deliverydate:     raw.p_deliverydate
                          ? new Date(raw.p_deliverydate)
                          : null,
    p_paymentterms:     raw.p_paymentterms,
    p_remarks:          raw.p_remarks,
  });

  // 6. Restore MF chips
  this.selectedMFNos  = mfSnapshot;
  this.mfSelections   = mfSelSnapshot;

  // 7. Rebuild FormArray with items + vendor assignments
  itemsSnapshot.forEach((it, idx) => {
    const v = vendorSnapshot[idx];
    this.poItemArray.push(this.fb.group({
      category:      [it.category],
      item:          [it.item],
      uom:           [it.uom],
      forecastQty:   [it.forecastQty],
      availableStock:[it.availableStock],
      pendingPOQty:  [it.pendingPOQty],
      requiredQty:   [it.requiredQty],
      poQty:         [v.poQty],
      vendorName:    [v.vendorName],
      rate:          [v.rate],
      amount:        [v.amount],
    }));
  });

  // 8. Restore vendor state & regenerate PO Nos fresh
  this.selectedVendorNames = vendorNamesSnap;
  this.poForm.get('p_vendor')?.setValue(vendorNamesSnap);
  this.regenerateVendorPONos();
  this.recalcGrandTotal();

  this.messageService.add({
    severity: 'info',
    summary: 'Duplicated',
    detail: 'PO duplicated — PO No. cleared and date set to today. Ready to submit.',
    life: 3000
  });
}

addAdvancePayment(): void {
  const total = Number(this.poForm.get('p_totalpayment')?.value || 0);

  // Guard: don't overpay
  const alreadyPaid = this.paymentHistory.reduce((s, p) => s + p.amount, 0);
  const maxAllowed  = total - alreadyPaid;

  if ((this.newPayment.amount ?? 0) > maxAllowed) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Excess Amount',
      detail: `Maximum payable now is ₹${maxAllowed.toFixed(2)}`,
      life: 3000
    });
    return;
  }

  const newTotal   = alreadyPaid + (this.newPayment.amount ?? 0);
  const remaining  = +(total - newTotal).toFixed(2);

  const entry: PaymentEntry = {
    date:           this.newPayment.date!,
    amount:         +(this.newPayment.amount ?? 0).toFixed(2),
    mode:           this.newPayment.mode || '—',
    referenceNo:    this.newPayment.referenceNo || '',
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
  this.paymentHistory = this.paymentHistory.map(p => {
    running += p.amount;
    return { ...p, remainingAfter: +(total - running).toFixed(2) };
  });

  this.totalPaid = +running.toFixed(2);

  this.poForm.patchValue({
    p_advancepayment:   this.totalPaid,
    p_remainingpayment: (total - this.totalPaid).toFixed(2)
  });
}

}