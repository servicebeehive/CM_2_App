import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
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
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { StockIn } from '@/types/stockin.model';
import { InventoryService } from '@/core/services/inventory.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { AddinventoryComponent } from '@/pages/inventory/addinventory/addinventory.component';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
import { NgxPrintModule } from 'ngx-print';

@Component({
  selector: 'app-sales',
  imports: [
    CommonModule,
    EditorModule,
    ReactiveFormsModule,
    TextareaModule,
    TableModule,
    InputTextModule,
    FormsModule,
    FileUploadModule,
    ButtonModule,
    SelectModule,
    DropdownModule,
    RippleModule,
    ChipModule,
    FluidModule,
    MessageModule,
    DatePickerModule,
    DialogModule,
    ConfirmDialogModule,
    CheckboxModule,
    NgxPrintModule
    // AddinventoryComponent,
    // GlobalFilterComponent
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
  providers: [ConfirmationService, DatePipe]
})
export class SalesComponent {

  // -----------------------------
  //  Component state / Variables
  // -----------------------------

  public transactionid: any;
  salesForm!: FormGroup;
  visibleDialog = false;
  selectedRow: any = null;
  mode: 'add' | 'edit' = 'add';
  pagedProducts: StockIn[] = [];
  first: number = 0;
  rowsPerPage: number = 5;
  products: StockIn[] = [];
  filteredProducts: StockIn[] = [];
  filteredCustomerName: any[] = [];
  filteredMobile: any[] = [];
  globalFilter: string = '';
  childUomStatus: boolean = false;
  showGlobalSearch: boolean = true;
  today: Date = new Date();
  public authService = inject(AuthService);
  public getUserDetails = {
    "uname": "admin",
    "p_username": "admin",
    "clientcode": "CG01-SE",
    "x-access-token": this.authService.getToken(),
  };
  searchValue: string = '';
  itemOptions: any[] = [];
  transactionIdOptions = [];
  public itemOptionslist: [] = [];
  @ViewChild(AddinventoryComponent) addInventoryComp!: AddinventoryComponent;

  // Dropdowns / lists
  billNoOptions: any[] = [];

  // -----------------------------
  //  Constructor + Lifecycle
  // -----------------------------
  constructor(
    private fb: FormBuilder,
    private stockInService: InventoryService,
    private confirmationService: ConfirmationService,
    private salesService: InventoryService,
    private messageService: MessageService,
    public datepipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.OnGetDropdown();
    this.loadAllDropdowns();

    // Initialize form
    this.salesForm = this.fb.group({
      p_itemdata: [null],
      p_transactiontype: [''],
      p_itemid: [null],
      p_billno: [null],
      p_transactionid: [0],
      p_transactiondate: [''],
      p_customername: ['', [Validators.required]],
      p_mobileno: ['', [Validators.required]],
      p_totalcost: [0],
      p_totalsale: [0],
      p_overalldiscount: [0],
      p_roundoff: [''],
      p_totalpayable: [0],
      p_currencyid: [0],
      p_gsttran: [true],
      p_status: [''],
      p_isactive: [''],
      p_loginuser: [''],
      p_linktransactionid: [0],
      p_replacesimilir: [''],
      p_creditnoteno: [''],
      p_paymentmode: [''],
      p_paymentdue: [0],

      // FormArray for sale rows
      p_sale: this.fb.array([])
    });
  }

  // -----------------------------
  //  FormArray Getters / Helpers
  // -----------------------------

  get saleArray(): FormArray {
    return this.salesForm.get('p_sale') as FormArray;
  }

  // Return FormArray rows as FormGroup[] for template binding (fixes typing issue)
  get saleRows(): FormGroup[] {
    return this.saleArray.controls as FormGroup[];
  }

  // -----------------------------
  //  Row Creation / Mapping
  // -----------------------------

  // Sales Array => Create a FormGroup for a sale item
  createSaleItem(data?: any): FormGroup {
    return this.fb.group({
      TransactiondetailId: this.salesForm.controls['p_transactionid'].value || 0,
      ItemId: [data?.itemid || 0],
      ItemName: [data?.itemname || ''],
      UOMId: [data?.uomid || 0],
      Quantity: [1],                        // default qty = 1
      itemcost: [data?.pruchaseprice || 0],
      MRP: [data?.saleprice || 0],
      totalPayable: [data ? data.saleprice : 0],

      // Extra fields shown in table
      curStock: [data?.currentstock || 0],
      warPeriod: [data?.warrentyperiod || 0],
      location: [data?.location || ''],
      itemsku: [data?.itemsku || '']
    });
  }

  // Map API sale items (array) into the FormArray
  mapSaleItems(apiItems: any[]) {
    this.saleArray.clear(); // Remove old rows if any

    apiItems.forEach(item => {
      this.saleArray.push(
        this.fb.group({
          TransactiondetailId: item.transactiondetailid || 0,
          ItemId: item.itemsku || 0,    // use itemsku when itemid not present
          ItemName: item.itemname || '',
          UOMId: item.uomid || 0,
          Quantity: item.quantity || 1,
          itemcost: item.itemcost || 0,
          MRP: item.mrp || 0,
          totalPayable: (item.quantity || 1) * (item.mrp || 0),

          // Additional fields used in UI
          curStock: item.current_stock || 0,
          warPeriod: 0,
          location: "",
          itemsku: item.itemsku || ''
        })
      );
    });

    // If items were added, update totals for the last row and overall summary
    const index = this.saleArray.length - 1;
    this.updateTotal(index);
    this.calculateSummary();
  }

  // -----------------------------
  //  Dropdown / Data Loading
  // -----------------------------

  // Generic payload creator
  createDropdownPayload(returnType: string) {
    return {
      p_returntype: returnType,
      ...this.getUserDetails,
    };
  }

  // Load items used in dropdowns
  OnGetItem() {
    const payload = this.createDropdownPayload("ITEM");
    this.stockInService.getdropdowndetails(payload).subscribe({
      next: (res) => this.itemOptions = res.data,
      error: (err) => console.log(err)
    });
  }

  // Load initial dropdowns (items, bill no)
  loadAllDropdowns() {
    this.OnGetItem();
    this.OnGetBillNo();
  }

  // Load dropdown via older endpoint (Getreturndropdowndetails)
  OnGetDropdown() {
    const payload = {
      ...this.getUserDetails,
      "p_returntype": "ITEM",
    };
    this.salesService.Getreturndropdowndetails(payload).subscribe({
      next: (res) => {
        console.log('result:', res);
        this.itemOptionslist = res.data;
      },
      error: (err) => console.log(err)
    });
  }

  // Load Bill No dropdown
  OnGetBillNo() {
    const payload = this.createDropdownPayload("NEWTRANSACTIONID");
    this.salesService.getdropdowndetails(payload).subscribe({
      next: (res) => {
        const billdata: any = res.data;
        this.billNoOptions = billdata.filter((item: { billno: null; }) => item.billno != null);
      },
      error: (err) => console.log(err)
    });
  }

  // -----------------------------
  //  Event Handlers (Item / Bill)
  // -----------------------------

  // Called when an item is selected from the item dropdown
  OnItemChange(event: any) {
    const latetData = this.itemOptions.find(item => item.itemid == event.value);
    console.log(latetData);
    if (latetData) {
      // Push new row and update totals
      this.saleArray.push(this.createSaleItem(latetData));
      const index = this.saleArray.length - 1;
      this.updateTotal(index);
    }
  }

  // Called when bill dropdown value changes
  onBillDetails(event: any) {
    console.log(event.value);
    const billDetails = this.billNoOptions.find(billitem => billitem.billno === event.value);
    console.log(billDetails);
    if (billDetails) {
      this.SaleDetails(billDetails);

      this.salesForm.patchValue({
        p_transactionid: billDetails.transactionid,
        p_customername:billDetails.customername,
        p_transactiondate: billDetails.transactiondate ? new Date(billDetails.transactiondate) : null,
        p_mobileno: billDetails.mobileno,
        p_totalcost: billDetails.totalcost,
        p_totalsale: billDetails.totalsale,
        p_overalldiscount: billDetails.discount,
        p_roundoff: billDetails.roundoff,
        p_totalpayable: billDetails.totalpayable
      });
    }
  }

  // Helper for item search from UI
  onItemSearch(event: any) {
    this.searchValue = event.filter || '';
  }

  // SaleDetails → fetch sale detail and map items
  SaleDetails(data: any) {
    const apibody = {
      ...this.getUserDetails,
      "p_returntype": "SALEDETAIL",
      "p_returnvalue": data.transactionid,
    };

    this.stockInService.Getreturndropdowndetails(apibody).subscribe({
      next: (res) => {
        this.mapSaleItems(res.data);
      }
    });
  }

  // -----------------------------
  //  Row operations (remove / block decimals)
  // -----------------------------

  // Remove a row from FormArray and update totals
  removeItem(i: number) {
    this.saleArray.removeAt(i);

    // If no items left → reset summary
    if (this.saleArray.length === 0) {
      this.calculateSummary();
      return;
    }

    // Otherwise update totals based on last valid row
    const index = this.saleArray.length - 1;
    this.updateTotal(index);
  }

  // Prevent decimal input in quantity field (keyboard)
  blockDecimal(event: KeyboardEvent) {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault();  // block decimal
    }
  }

  // -----------------------------
  //  Validation / Submit helpers
  // -----------------------------

  // Returns true when submit should be disabled
  isSubmitDisabled(): boolean {
    // 1) No items → disable
    if (this.saleArray.length === 0) return true;

    // 2) Stock errors set by updateTotal
    for (let row of this.saleArray.controls) {
      if (row.get('Quantity')?.errors?.['maxStock']) return true;
    }

    // 3) Required header fields missing
    if (!this.salesForm.get('p_customername')?.value) return true;
    if (!this.salesForm.get('p_mobileno')?.value) return true;
    if (!this.salesForm.get('p_transactiondate')?.value) return true;

    // 4) Per-row validation: qty cannot be 0 and cannot exceed stock
    for (let row of this.saleArray.controls) {
      const qty = Number(row.get('Quantity')?.value || 0);
      const stock = Number(row.get('curStock')?.value || 0);
      if (qty === 0) return true;
      if (qty > stock) return true;
    }

    // All checks passed → enable submit
    return false;
  }

  // -----------------------------
  //  Form Actions (submit / reset)
  // -----------------------------

  // Submit handler with confirmation and validation
  onSubmit() {
    if (this.isSubmitDisabled()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Failed',
        detail: 'Please correct all errors before submitting.',
        life: 2500
      });
      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to submit?',
      header: 'Confirm',
      acceptLabel: 'Yes',
      rejectLabel: 'Cancel',
      accept: () => {
        this.OnSalesHeaderCreate(this.salesForm.value);
      }
    });
  }

  // Reset form and clear sale array
  onReset() {
    this.salesForm.reset();
    this.saleArray.clear();
    this.messageService.add({
      severity: 'info',
      summary: 'Reset',
      detail: 'Form reset successfully.',
      life: 2000
    });
  }

  // -----------------------------
  //  Calculations (row & summary)
  // -----------------------------

  // Recalculate totals for entire sale
  calculateSummary() {
    let totalCost = 0;
    let totalMRP = 0;
    let totalSale = 0;

    this.saleArray.controls.forEach((row: AbstractControl) => {
      const qty = Number(row.get('Quantity')?.value || 0);
      const cost = Number(row.get('itemcost')?.value || 0);
      const mrp = Number(row.get('MRP')?.value || 0);

      totalCost += qty * cost;
      totalMRP += qty * mrp;
      totalSale += qty * mrp;
    });

    // Assign summary values
    this.salesForm.patchValue({
      p_totalcost: totalCost,
      p_totalsale: totalMRP,
      p_roundoff: 0,
      p_totalpayable: totalMRP
    });

    // Apply discount/rounding adjustments
    this.applyDiscount();
  }

  // Update a specific row total, ensure stock constraints
  updateTotal(i: number) {
    const row = this.saleArray.at(i);

    const qty = Number(row.get('Quantity')?.value || 0);
    const stock = Number(row.get('curStock')?.value || 0);
    const mrp = Number(row.get('MRP')?.value || 0);

    // If quantity > stock → set error + show warning
    if (qty > stock) {
      row.get('Quantity')?.setErrors({ maxStock: true });

      this.messageService.add({
        severity: 'warn',
        summary: 'Stock Limit Exceeded',
        detail: `Only ${stock} units available.`,
        life: 2000
      });

      return;
    } else {
      // Clear error if valid
      row.get('Quantity')?.setErrors(null);
    }

    // Update row total and recalc summary
    row.patchValue({
      totalPayable: qty * mrp
    });

    this.calculateSummary();
  }

  // Apply overall discount & round off
  applyDiscount() {
    const discountPercent = Number(this.salesForm.get('p_overalldiscount')?.value || 0);
    const totalMRP = Number(this.salesForm.get('p_totalsale')?.value || 0);

    const discountAmount = (totalMRP * discountPercent) / 100;
    let finalPayable = totalMRP - discountAmount;

    // Round off to 2 decimals difference and then round to integer for payable
    const roundOff = +(finalPayable - Math.floor(finalPayable)).toFixed(2);

    this.salesForm.patchValue({
      p_roundoff: roundOff,
      p_totalpayable: Math.round(finalPayable)
    });
  }

  // -----------------------------
  //  API Body Cleaning & Submit
  // -----------------------------

  // Prepare a clean request body matching the API expectations
  cleanRequestBody(body: any) {
    const formattedDate = this.datepipe.transform(
      body.p_transactiondate,
      'dd/MM/yyyy'
    );
    return {
      ...this.getUserDetails,
      p_transactiontype: "SALE",
      p_transactionid: body.p_transactionid ?? 0,
      p_transactiondate: formattedDate || "",
      p_customername: body.p_customername || "",
      p_mobileno: body.p_mobileno || "",
      p_totalcost: Number(body.p_totalcost) || 0,
      p_totalsale: Number(body.p_totalsale) || 0,
      p_overalldiscount: Number(body.p_overalldiscount) || 0,
      p_roundoff: body.p_roundoff ? body.p_roundoff.toString() : "0.00",
      p_totalpayable: Number(body.p_totalpayable) || 0,
      p_currencyid: Number(body.p_currencyid) || 0,
      p_gsttran: body.p_gsttran === true ? "Y" :
        body.p_gsttran === false ? "N" : "N",
      p_status: body.p_status || "Complete",
      p_isactive: "Y",
      p_linktransactionid: 0,
      p_replacesimilir: body.p_replacesimilir || "",
      p_creditnoteno: body.p_creditnoteno || "",
      p_paymentmode: body.p_paymentmode || "Cash",
      p_paymentdue: Number(body.p_paymentdue) || 0,
      p_sale: (body.p_sale || []).map((x: any) => ({
        TransactiondetailId: x.TransactiondetailId || 0,
        ItemId: x.ItemId,
        ItemName: x.ItemName,
        UOMId: x.UOMId,
        Quantity: x.Quantity,
        itemcost: x.itemcost,
        MRP: x.MRP,
        totalPayable: x.totalPayable
      }))
    };
  }

  // -----------------------------
  //  API Submit + Notifications
  // -----------------------------

  // Send header (and sale) to API, show toast notifications on result
  OnSalesHeaderCreate(data: any) {
    const apibody = this.cleanRequestBody(this.salesForm.value);

    this.stockInService.Getreturndropdowndetails(apibody).subscribe({
      next: (res) => {
        console.log(res.data);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Sales saved successfully!',
          life: 3000
        });
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save sales. Please try again.',
          life: 3000
        });
      }
    });
  }

  // -----------------------------
  //  Utility / Misc
  // -----------------------------

  showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }
}
