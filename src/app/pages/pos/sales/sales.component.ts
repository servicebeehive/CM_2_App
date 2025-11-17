import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
      //  AddinventoryComponent,
        
        // GlobalFilterComponent
    ],
    templateUrl: './sales.component.html',
    styleUrl: './sales.component.scss',
    providers: [ConfirmationService,DatePipe]
})
export class SalesComponent {

    public transactionid:any;
    salesForm!: FormGroup;
    visibleDialog=false;
    selectedRow: any = null;
    mode:'add'|'edit' ='add';
    pagedProducts: StockIn[] = [];
    first: number = 0;
    rowsPerPage: number = 5;
    products: StockIn[] = [];
    filteredProducts: StockIn[] = [];
    filteredCustomerName: any[]=[];
    filteredMobile: any[]=[];
    globalFilter: string = '';
     childUomStatus:boolean =false;
     showGlobalSearch:boolean=true;
     today: Date = new Date();
     public authService=inject(AuthService);
    public getUserDetails={
     "uname": "admin",
    "p_username": "admin",
    "clientcode": "CG01-SE",
   "x-access-token":this.authService.getToken(),
  }
     searchValue:string='';
     itemOptions:any[]=[];
      transactionIdOptions = []; 
      public itemOptionslist:[]=[]
      //for testing
  @ViewChild(AddinventoryComponent) addInventoryComp!:AddinventoryComponent;

    // ✅ Move dropdown options into variables
    billNoOptions:any []= [];

    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService,
        private salesService:InventoryService,
        private messageService : MessageService,
        public datepipe:DatePipe
    ) {}

    ngOnInit(): void {
        this.OnGetDropdown();
        this.loadAllDropdowns();
       //  this.onGetStockIn();
       this.salesForm = this.fb.group({
      p_itemdata:[null],
  p_transactiontype: [''],
  p_itemid:[null],
  p_billno:[null],
  p_transactionid: [0],
  p_transactiondate: [''],
  p_customername: ['',[Validators.required]],
  p_mobileno: ['',[Validators.required]],
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

  // ⬇️ FormArray for p_sale
  p_sale: this.fb.array([])
});

    }
    get saleArray(): FormArray {
  return this.salesForm.get('p_sale') as FormArray;
}
// Sales Array
createSaleItem(data?: any): FormGroup {
  return this.fb.group({
    TransactiondetailId:this.salesForm.controls['p_transactionid'].value||0,
    ItemId: [data?.itemid || 0],
    
    ItemName: [data?.itemname || ''],
    UOMId: [data?.uomid || 0],
    Quantity: [1],                        // default qty
    itemcost: [data?.pruchaseprice || 0],
    MRP: [data?.saleprice || 0],
    totalPayable: [data ? data.saleprice : 0],

    // Extra fields shown in table
    curStock: [data?.currentstock || 0],
    warPeriod: [data?.warrentyperiod || 0],
    location: [data?.location || ''],
    itemsku:[data?.itemsku|| '']
    
  });
}
OnItemChange(event: any) {

  const latetData = this.itemOptions.find(item => item.itemid == event.value);
  console.log(latetData)
  if (latetData) {

    // Push new row
    this.saleArray.push(this.createSaleItem(latetData));   

    // Get NEW row index
    const index = this.saleArray.length - 1;

    // Call updateTotal for this row
    this.updateTotal(index);
  }
}



   OnGetDropdown(){
    let payload={
      ...this.getUserDetails,
    "p_returntype": "ITEM",
    "clientcode": "CG01-SE",
  
}
this.salesService.Getreturndropdowndetails(payload).subscribe({
    next:(res)=>{
        console.log('result:',res);
        this.itemOptionslist=res.data
    },
  error:(err)=>console.log(err)
});
}

// remove table vaue
removeItem(i: number) {

  this.saleArray.removeAt(i);

  // 🚫 If no items left → do not call updateTotal()
  if (this.saleArray.length === 0) {
    this.calculateSummary();  // optional reset summary
    return;
  }

  // ✔ Otherwise recalc using last valid row
  const index = this.saleArray.length - 1;
  this.updateTotal(index);
}

onBillDetails(event:any){
    console.log(event.value)
 const billDetails= this.billNoOptions.find(billitem=>billitem.billno===event.value)
 console.log(billDetails)
if (billDetails) {
  this.SaleDetails(billDetails)

  this.salesForm.patchValue({

    p_transactionid: billDetails.transactionid,

    // Convert string date → JS Date
    p_transactiondate: billDetails.transactiondate 
        ? new Date(billDetails.transactiondate) 
        : null,

    //p_customername: billDetails.customerid,   // (If customer name is available use that)
    p_mobileno: billDetails.mobileno,

    p_totalcost: billDetails.totalcost,
    p_totalsale: billDetails.totalsale,

    p_overalldiscount: billDetails.discount,
    p_roundoff: billDetails.roundoff,

    p_totalpayable: billDetails.totalpayable
  });

}


}


   OnGetItem() {
  const payload = this.createDropdownPayload("ITEM");
  this.stockInService.getdropdowndetails(payload).subscribe({
    next: (res) => this.itemOptions = res.data,
    error: (err) => console.log(err)
  });
}
loadAllDropdowns(){
    this.OnGetItem();
    this.OnGetBillNo();
}


//Form action
saleIdDetail(event:any){

}

allowOnlyNumbers(event:any){

}





  onSubmit() {

  // 🚫 FORM INVALID → Show PrimeNG message
  if (this.isSubmitDisabled()) {
    this.messageService.add({
      severity: 'error',
      summary: 'Validation Failed',
      detail: 'Please correct all errors before submitting.',
      life: 2500
    });
    return;
  }

  // 🟢 Confirm submission
  this.confirmationService.confirm({
    message:'Are you sure you want to submit?',
    header:'Confirm',
    acceptLabel:'Yes',
    rejectLabel:'Cancel',
    accept: ()=>{

      // Prepare and send API
      this.OnSalesHeaderCreate(this.salesForm.value);

      // this.messageService.add({
      //   severity: 'success',
      //   summary: 'Submitted',
      //   detail: 'Sales saved successfully!',
      //   life: 2500
      // });
    }
  });
}
onReset(){
  this.salesForm.reset()
  this.saleArray.clear()
   // 4️⃣ Optional: success toast
  this.messageService.add({
    severity: 'info',
    summary: 'Reset',
    detail: 'Form reset successfully.',
    life: 2000
  });
  
}
// 🔐 Disable submit until all conditions satisfied
isSubmitDisabled(): boolean {

  // 1️⃣ No items added → disable
  if (this.saleArray.length === 0) return true;

  // 2️⃣ Check stock errors (set in updateTotal)
  for (let row of this.saleArray.controls) {
    if (row.get('Quantity')?.errors?.['maxStock']) return true;
  }

  // 3️⃣ Required header fields missing → disable
  if (!this.salesForm.get('p_customername')?.value) return true;
  if (!this.salesForm.get('p_mobileno')?.value) return true;
  if (!this.salesForm.get('p_transactiondate')?.value) return true;

  // 4️⃣ Validate each item row
  for (let row of this.saleArray.controls) {
    const qty = Number(row.get('Quantity')?.value || 0);
    const stock = Number(row.get('curStock')?.value || 0);

    // Quantity cannot be 0
    if (qty === 0) return true;

    // Quantity cannot exceed stock
    if (qty > stock) return true;
  }

  // 5️⃣ Everything valid → enable Submit
  return false;
}

blockDecimal(event: KeyboardEvent) {
  if (event.key === '.' || event.key === ',') {
    event.preventDefault();  // ❌ block decimal
  }
}



onItemSearch(event:any){
    this.searchValue=event.filter || '';
}
    createDropdownPayload(returnType:string){
        return{
           
            p_returntype:returnType,
           ...this.getUserDetails,
        };
    }

    OnGetBillNo(){
        const payload=this.createDropdownPayload("NEWTRANSACTIONID");
        this.salesService.getdropdowndetails(payload).subscribe({
            next:(res)=>{
              const billdata:any=res.data
              this.billNoOptions=billdata.filter((item: { billno: null; })=>item.billno!=null);
          
          },
            error:(err)=>console.log(err)
        });
    }
     showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
// Calculation
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
    totalSale += qty * mrp;       // OR use your own total property
  });

  // Assign Values
  this.salesForm.patchValue({
    p_totalcost: totalCost,
    p_totalsale: totalMRP,
    p_roundoff: 0,
    p_totalpayable: totalMRP
  });

  // Apply Discount FINAL Step
  this.applyDiscount();
}

updateTotal(i: number) {
  const row = this.saleArray.at(i);

  const qty = Number(row.get('Quantity')?.value || 0);
  const stock = Number(row.get('curStock')?.value || 0);
  const mrp = Number(row.get('MRP')?.value || 0);

  // ❌ If quantity > stock → block and show error
  if (qty > stock) {
    row.get('Quantity')?.setErrors({ maxStock: true });

    this.messageService.add({
      severity: 'warn',
      summary: 'Stock Limit Exceeded',
      detail: `Only ${stock} units available.`,
      life: 2000
    });

    return;
  } 
  else {
    // ✔ Clear error if now valid
    row.get('Quantity')?.setErrors(null);
  }

  // Update total price for the row
  row.patchValue({
    totalPayable: qty * mrp
  });

  // Recalculate bill totals
  this.calculateSummary();
}




applyDiscount() {
  const discountPercent = Number(this.salesForm.get('p_overalldiscount')?.value || 0);
  const totalMRP = Number(this.salesForm.get('p_totalsale')?.value || 0);

  const discountAmount = (totalMRP * discountPercent) / 100;
  let finalPayable = totalMRP - discountAmount;

  // Round Off
  const roundOff = +(finalPayable - Math.floor(finalPayable)).toFixed(2);

  this.salesForm.patchValue({
    p_roundoff: roundOff,
    p_totalpayable: Math.round(finalPayable)
  });
}
cleanRequestBody(body: any) {
 const formattedDate = this.datepipe.transform(
   body.p_transactiondate,
    'dd/MM/yyyy'
  );
  return {
 ...this.getUserDetails,
    p_transactiontype:"SALE",
    p_transactionid: body.p_transactionid ?? 0,
    p_transactiondate: formattedDate || "",
    p_customername: body.p_customername || "",
    p_mobileno: body.p_mobileno || "",
    p_totalcost: Number(body.p_totalcost) || 0,
    p_totalsale: Number(body.p_totalsale) || 0,
    p_overalldiscount: Number(body.p_overalldiscount) || 0,

    // Always convert to string "0.20"
    p_roundoff: body.p_roundoff ? body.p_roundoff.toString() : "0.00",

    p_totalpayable: Number(body.p_totalpayable) || 0,
    p_currencyid: Number(body.p_currencyid) || 0,

    // Convert boolean to Y/N
    p_gsttran: body.p_gsttran === true ? "Y" :
               body.p_gsttran === false ? "N" : "N",

    p_status: body.p_status || "Complete",
    p_isactive: "Y",
   
    p_linktransactionid: 0,
    p_replacesimilir: body.p_replacesimilir || "",
    p_creditnoteno: body.p_creditnoteno || "",
    p_paymentmode: body.p_paymentmode || "Cash",
    p_paymentdue: Number(body.p_paymentdue) || 0,

    // FILTER SALE ARRAY
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

OnSalesHeaderCreate(data: any) {

  // Convert transaction date to dd/MM/yyyy
  // const formattedDate = this.datepipe.transform(
  //   data.p_transactiondate,
  //   'dd/MM/yyyy'
  // );

  let apibody = this.cleanRequestBody(this.salesForm.value); 

  this.stockInService.Getreturndropdowndetails(apibody).subscribe({
    next: (res) => {
      console.log(res.data);

      // 🟢 SUCCESS NOTIFICATION
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Sales saved successfully!',
        life: 3000
      });
    },

    error: (err) => {
      console.error(err);

      // 🔴 ERROR NOTIFICATION
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save sales. Please try again.',
        life: 3000
      });
    }
  });
}
SaleDetails(data:any){
 let apibody = {
   ...this.getUserDetails,
    "p_returntype": "SALEDETAIL",
    "p_returnvalue":data.transactionid,
  
}
; 

  this.stockInService.Getreturndropdowndetails(apibody).subscribe({
    next: (res) => {
            this.mapSaleItems(res.data)

    }})
}

mapSaleItems(apiItems: any[]) {
  this.saleArray.clear(); // Remove old rows if any

  apiItems.forEach(item => {
    this.saleArray.push(
      this.fb.group({
        TransactiondetailId: item.transactiondetailid || 0,
        ItemId: item.itemsku || 0,    // OR item.itemid if API gives it separately
        ItemName: item.itemname || '',
        UOMId: item.uomid || 0,
        Quantity: item.quantity || 1,
        itemcost: item.itemcost || 0,
        MRP: item.mrp || 0,
        totalPayable: (item.quantity || 1) * (item.mrp || 0),

        // Additional fields used in your UI
        curStock: item.current_stock || 0,
        warPeriod: 0,  // API not providing → default 0
        location: "",  // API not providing → default empty
        itemsku: item.itemsku || ''
      })
    );
  });
  // Get NEW row index
    const index = this.saleArray.length - 1;

    // Call updateTotal for this row
    this.updateTotal(index);
  // After mapping all, recalculate totals
  this.calculateSummary();
}
printInvoice() {
  window.print();
}
// Return FormArray rows as FormGroup[]
get saleRows(): FormGroup[] {
  return this.saleArray.controls as FormGroup[];
}

}
