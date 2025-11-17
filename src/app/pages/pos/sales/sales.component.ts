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
        AddinventoryComponent,
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
  p_transactiontype: [''],
  p_itemid:[],
  p_billno:[],
  p_transactionid: [0],
  p_transactiondate: [''],
  p_customername: [''],
  p_mobileno: [''],
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
    "uname": "admin",
    "p_username": "admin",
    "p_returntype": "ITEM",
    "clientcode": "CG01-SE",
    "x-access-token": this.authService.getToken()
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
  const index = this.saleArray.length - 1;
   this.updateTotal(index);
}

onBillDetails(event:any){
    console.log(event.value)
 const billDetails= this.billNoOptions.find(billitem=>billitem.billno===event.value)
 console.log(billDetails)
if (billDetails) {

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
        console.log(this.salesForm.value);
        this.confirmationService.confirm({
            message:'Are you sure you want to submit?',
            header:'Confirm',
            acceptLabel:'Yes',
            rejectLabel:'Cancel',
            accept: ()=>{
             // this.saveAllChanges();
           this.OnSalesHeaderCreate(this.salesForm.value);
            },
            reject: ()=>{

            }
        })

    }


onItemSearch(event:any){
    this.searchValue=event.filter || '';
}
    createDropdownPayload(returnType:string){
        return{
            uname:"admin",
            p_username:"admin",
            p_returntype:returnType,
            clientcode:"CG01-SE",
            "x-access-token":this.authService.getToken()
        };
    }

    OnGetBillNo(){
        const payload=this.createDropdownPayload("NEWTRANSACTIONID");
        this.salesService.getdropdowndetails(payload).subscribe({
            next:(res)=>this.billNoOptions=res.data,
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
  const mrp = Number(row.get('MRP')?.value || 0);

  row.patchValue({
    totalPayable: qty * mrp
  });

  this.calculateSummary();   // <--- ADD THIS
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
OnSalesHeaderCreate(data:any){
    let apibody={
        ...data,
        "uname": "admin",
    "clientcode": "CG01-SE",
    "p_loginuser": "admin",

    }
    console.log(apibody)
    return
    this.stockInService.Getreturndropdowndetails(data).subscribe({
        next:(res)=>{
            console.log(res.data)
        }
    })

}

}
