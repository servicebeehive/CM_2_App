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
import { OrderService } from '@/core/services/order.service';
// import { NgxPrintModule } from 'ngx-print';

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
    // NgxPrintModule
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
  submitDisabledByBill:boolean=false;
  discountplace:string='Enter Amount';
  public authService = inject(AuthService);
  public getUserDetails = {
    "uname": "admin",
    "p_loginuser": "admin",
    "clientcode": "CG01-SE",
    "x-access-token": this.authService.getToken(),
  };
  searchValue: string = '';
  itemOptions: any[] = [];
  transactionIdOptions = [];
  public itemOptionslist: [] = [];
  public uomlist:any[]=[]
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
    private orderService:OrderService,
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
      p_transactiondate: [this.today,[Validators.required]],
      p_customername: [''],
      p_mobileno: ['',[Validators.pattern(/^[6-9]\d{9}$/)]],
      p_totalcost: [0],
      p_totalsale: [0],
      p_disctype:[false],
      p_overalldiscount: [''],
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
    },
  {
      validators: [this.costGreaterThanSaleValidator()]
    });
    this.salesForm.get('p_billno')?.valueChanges.subscribe(value=>{
      if(value){
        this.disableItemSearchSubmit();
      }
      else{
        this.enableItemSearchAndSubmit();
      }
    });
    this.salesForm.get('p_disctype')?.valueChanges.subscribe(value=>{
      if(!value){
   this.discountplace="Enter Amount";
}
else{
  this.discountplace="Enter %";
}

//  this.salesForm.get('p_overalldiscount')?.setValue('', { emitEvent: false });
 this.applyDiscount();
    });

  }
  costGreaterThanSaleValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const cost = form.get('p_totalcost')?.value;
    const final = form.get('p_totalpayable')?.value;

    if (cost != null && final != null && Number(cost) > Number(final)) {
      return { costNotGreater: true };
    }
    return null;
  };
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
disableItemSearchSubmit(){
  this.salesForm.get('itemSearch')?.disable();
  this.submitDisabledByBill=true;
}
enableItemSearchAndSubmit() {
  this.salesForm.get('itemSearch')?.enable();
  this.submitDisabledByBill = false;
}
get isPrintDisabled(): boolean {
  const billNo = this.salesForm.get('p_billno')?.value;
 const hasItem = this.saleArray.length > 0;

  // Disable print if BOTH are empty
  return !(billNo || hasItem);
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
          UOMId: item.uomname || 0,
          Quantity: item.quantity || 1,
          itemcost: item.itemcost || 0,
          MRP: (item.mrp || 0).toFixed(2),
          totalPayable: ((item.quantity || 1) * (item.mrp || 0)).toFixed(2),
          // p_totalcost:item.
          // Additional fields used in UI
          curStock: item.current_stock || 0,
          warPeriod: item.warrentyperiod,
          location: item.location,
          itemsku: item.itemsku || ''
        })
      );
    });
   
    // If items were added, update totals for the last row and overall summary
    const index = this.saleArray.length - 1;
    this.updateTotal(index);
    this.calculateSummary();
  }
allowOnlyNumbers(event: any) {
  const input = event.target as HTMLInputElement;

  // Block if length is already 10
  if (input.value.length >= 10) {
    event.preventDefault();
    return;
  }

  const char = String.fromCharCode(event.which);

  // Block if not a number (0-9)
  if (!/^[0-9]$/.test(char)) {
    event.preventDefault();
  }
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
// Get UOM placeholder text for a specific row
getUomPlaceholder(index: number): string {
  const row = this.saleArray.at(index);
  const currentUomId = row.get('UOMId')?.value;
  
  if (!currentUomId) {
    return 'Select UOM'; // Default placeholder
  }
  
  // Find the UOM name from the uomlist
  const uomOptions = this.uomlist[index];
  if (uomOptions && Array.isArray(uomOptions)) {
    const selectedUom = uomOptions.find(u =>u.uomid === currentUomId);
    return selectedUom ? selectedUom.uomname : 'Select UOM';
  }
  
  return 'Select UOM';
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
  if (!latetData) return;

  // 🔥 CHECK IF ITEM ALREADY EXISTS IN TABLE
  const alreadyExists = this.saleArray.controls.some(row =>
    row.get('ItemId')?.value === latetData.itemid
  );

  if (alreadyExists) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Duplicate Item',
      detail: `${latetData.itemname} is already added.`,
      life: 2000
    });

    // 🧹 Clear dropdown selection
    this.salesForm.get('p_itemdata')?.setValue(null, { emitEvent: false });

    return;
  }

  // ✅ Add item (no duplicate)
  this.saleArray.push(this.createSaleItem(latetData));

  const index = this.saleArray.length - 1;

  // update totals
  this.updateTotal(index);

  // load UOM list for this row only
  this.OnUMO(event.value, index);

  // 🧹 Clear dropdown after add
  this.salesForm.get('p_itemdata')?.setValue(null, { emitEvent: false });
  this.calculateSummary()
}


  // Called when bill dropdown value changes
  onBillDetails(event: any) {
    const billDetails = this.billNoOptions.find(billitem => billitem.billno === event.value); 
    if (billDetails) {
      this.SaleDetails(billDetails);
 
      this.salesForm.patchValue({
        p_transactionid: billDetails.transactionid,
        p_customername:billDetails.customername,
        p_transactiondate: billDetails.transactiondate ? new Date(billDetails.transactiondate) : null,
        p_mobileno: billDetails.mobileno,
        p_totalcost: (billDetails.totalcost).toFixed(2),
        p_totalsale: (billDetails.totalsale).toFixed(2),
        p_disctype: billDetails.discounttype=='Y'?true:false,
        p_overalldiscount: billDetails.discount,
        p_roundoff: billDetails.roundoff,
        p_totalpayable: (billDetails.totalpayable).toFixed(2),
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
        this.mapSaleItems(res.data );
        if(res.data && res.data.length>0 && res.data[0].discounttype){
          this.salesForm.patchValue({
            p_disctype:(res.data[0].discounttype==='Y')
          });
        }
      }
    });
  }

  // -----------------------------
  //  Row operations (remove / block decimals)
  // -----------------------------

  // Remove a row from FormArray and update totals
  removeItem(i: number) {
  // Remove row from FormArray
  this.saleArray.removeAt(i);

  // 🔥 FIX: Remove its UOM list to keep index sync
  if (this.uomlist && Array.isArray(this.uomlist)) {
    this.uomlist.splice(i, 1);
  }

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
    if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E') {
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
    // if (!this.salesForm.get('p_customername')?.value) return true;
    // if (!this.salesForm.get('p_mobileno')?.value) return true;
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
     this.salesForm.get('p_transactiondate')?.setValue(this.today);
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
      p_totalcost: (totalCost).toFixed(2),
      p_totalsale: (totalMRP).toFixed(2),
      p_roundoff: 0,
      p_totalpayable: (totalMRP).toFixed(2)
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
    const totalSale = Number(this.salesForm.get('p_totalsale')?.value || 0) ;
    const discountValue = Number(this.salesForm.get('p_overalldiscount')?.value || 0);
    const isPresent = this.salesForm.get('p_disctype')?.value;
   let discountAmount=0;

    if(isPresent){
      discountAmount=(totalSale*discountValue)/100;
    }else{
      discountAmount=discountValue;
    }
    let finalPayable = totalSale - discountAmount;

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
      // p_replacesimilir: body.p_replacesimilir || "",
       p_replacesimilir:body.p_disctype === true ?"Y" : "N",
       p_discounttype:body.p_disctype === true ?"Y" : "N",
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
        totalPayable: x.totalPayable,
          currentstock:x.curStock,
      }))
    };
  }

  // -----------------------------
  //  API Submit + Notifications
  // -----------------------------

  // Send header (and sale) to API, show toast notifications on result
  OnSalesHeaderCreate(data: any) {
    const apibody = this.cleanRequestBody(this.salesForm.value);

    // const datada={
    // "uname": "admin",
    // "p_transactiontype": "SALE",
    // "p_transactionid": 0,
    // "p_transactiondate": "08/11/2025",
    // "p_customername": "Chittaranjan",
    // "p_mobileno": "9871757006",
    // "p_totalcost": 1000,
    // "p_totalsale": 1200,
    // "p_overalldiscount": 10,
    // "p_roundoff": "0.20",
    // "p_totalpayable": 1080,
    // "p_currencyid": 0,
    // "p_gsttran": "N",
    // "p_status": "Complete",
    // "p_isactive": "Y",
    // "p_loginuser": "admin",
    // "p_linktransactionid": 0,
    // "p_replacesimilir": "Y",
    // "p_creditnoteno": "",
    // "p_paymentmode": "Cash",
    // "p_paymentdue": 0,
    // "p_sale": [
    //     {
    //         "TransactiondetailId": 0,
    //         "ItemId": 25,
    //         "ItemName": "Switch 3 socket",
    //         "UOMId": 1,
    //         "Quantity":1,
    //         "itemcost":220,
    //         "MRP":240,
    //         "totalPayable":240
    //     }
    // ],
    // "clientcode": "CG01-SE",
    // "x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyY29kZSI6ImFkbWluIiwiaWF0IjoxNzYzNjQyOTY4LCJleHAiOjE3NjM3MjkzNjh9.2yeOGtpWD24Fl1Ske4iVv4D0yy3o_JQ1eMyaXY_Zu_U"

    // }

    this.stockInService.OninsertSalesDetails(apibody).subscribe({
      next: (res) => {
        const billno=res.data[0]?.billno
        this.OnGetBillNo()
      this.salesForm.controls['p_billno'].setValue(billno)
        console.log('res',res);
        
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

  OnUMO(value:any,index:number){
    let apibody={
      ...this.getUserDetails,
         
    "p_returntype": "SALEUOM",
    "p_returnvalue":value,
  
   
    }
    this.salesService.Getreturndropdowndetails(apibody).subscribe({
     
      next:(res)=>{
       //  this.OngetcalculatedMRP()
        console.log(res.data)
        this.uomlist[index]=res.data
      },
      error:(res)=>{

      }
  })
  
   
  }


  OngetcalculatedMRP(data: any, index: number) {
  const row = this.saleArray.at(index);

  const qty = Number(row.get('Quantity')?.value || 0);

  let apibody = {
    ...this.getUserDetails,
    p_itemid: data.ItemId,
    p_qty: qty,
    p_uomid: data.UOMId,
  };

  // remove login user
  delete (apibody as any).p_loginuser;

  this.orderService.getcalculatedMRP(apibody).subscribe({
    next: (res: any) => {
      console.log(res.data);

      // Example: res.data = { totalmrp: 200, totalcost: 100 }

      // ✅ Update only the selected row
      row.patchValue({
        MRP: res.data.totalmrp,
        totalPayable: res.data.totalcost
      });
     // this.updateTotal(index)
      // If your UI needs recalculation based on Quantity:
      // this.updateTotal(index);
      this.calculateSummary();
    },
    error: (err) => {
      console.error(err);
    }
  });
}

  UOMId(event:any,index:number){
    console.log(event)
    this.OngetcalculatedMRP(event.value,index)
  }
  calculateMRP(index: number) {
  const row = this.saleArray.at(index);

  const qty = Number(row.get('Quantity')?.value || 0);
  const uomid = row.get('UOMId')?.value;
  const itemId = row.get('ItemId')?.value;  // use row item id

  if (!uomid || qty <= 0) return; // stop API call if invalid

  let apibody = {
    ...this.getUserDetails,
    p_itemid: itemId,
   // p_itemid:42,
    p_qty: qty,
    p_uomid: uomid
  };

  delete (apibody as any).p_loginuser;

  this.orderService.getcalculatedMRP(apibody).subscribe({
    next: (res: any) => {
      console.log("API Result:", res.data);
     

      row.patchValue({
        MRP: res.data.totalmrp,
        totalPayable: res.data.totalcost
      });
      this.calculateSummary();
      // this.updateTotal(index)
    }
  });
}
OnQtyChange(index: number) {
  this.calculateMRP(index);
}

}
