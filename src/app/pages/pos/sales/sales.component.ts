import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
    providers: [ConfirmationService]
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
        private messageService : MessageService
    ) {}

    ngOnInit(): void {
        this.OnGetDropdown();
        this.loadAllDropdowns();
         this.onGetStockIn();
        this.salesForm = this.fb.group({
            billNo: [''],
            customerName: [''],
            mobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],
            transactionDate:[this.today],
            totalCost:[''],
            mrpTotal:[''],
            roundOff:[''],
            discountLabel:[''],
            finalPayable:[''],
        });
        this.salesForm.valueChanges.subscribe(() => {
            this.filterProducts();
        });
        this.salesForm.get('discountLabel')?.valueChanges.subscribe(()=>{
            this.updatedFinalAmount();
        })
    }

    allowOnlyNumbers(event:KeyboardEvent){
        const allowedChars=/[0-9]\b/;
        const inputChar=String.fromCharCode(event.key.charCodeAt(0));
        if(!allowedChars.test(inputChar)){
            event.preventDefault();
        }
    }

    onGetStockIn() {
        this.products = this.stockInService.productItem || [];
        console.log('sales',this.products.values);
        this.products.forEach((p:any) => {
            p.selection = true;
            // p.quantity = 0;
            p.total= 0;
        }
    );
        this.filteredProducts = [...this.products];

    }
    filterProducts() {
        const searchTerm = this.globalFilter?.toLowerCase() || '';
        this.filteredProducts = this.products.filter((p) => {
            const globalMatch = searchTerm ? Object.values(p).some((val) => String(val).toLowerCase().includes(searchTerm)) : true;
            return globalMatch;
        });
        console.log('filtered data:', this.filteredProducts);
    }
    
    // applyGlobalFilter() {
    //     // const searchTerm = this.salesForm.get('globalFilter')?.value?.toLowerCase() || '';
    //     // this.filteredProducts = this.products.filter((p) => {
    //     //     return Object.values(p).some((value) => String(value).toLowerCase().includes(searchTerm));
    //     // });
    //      const searchTerm=this.globalFilter?.toLowerCase().trim() || '';
    //     this.filteredProducts=this.products.filter((p:any)=>{
    //          return Object.values(p).some((val)=>String(val).toLowerCase().includes(searchTerm));
    //     });
    // }

   filterCustomerName(event:any){
    const query= event.query.toLowerCase();
    if(!this.filteredCustomerName.some(v=>v.label.toLowerCase()===query)){
        this.filteredCustomerName.push({label:event.query});
    }
   }

     filterMobile(event:any){
    const query= event.query.toLowerCase();
    if(!this.filteredMobile.some(v=>v.label.toLowerCase()===query)){
        this.filteredMobile.push({label:event.query});
    }
   }


    updateTotal(item:any){
        const qty = Number(item.quantity);
        const mrp = Number(item.mrp) || 0;
        item.total = + (mrp*qty).toFixed(2);
        this.calculateTotals();
    }
    calculateTotals(){
        const totalMrp= this.filteredProducts.reduce((sum,p) => sum + ((p.mrp || 0) * (p.quantity || 0)),0);
        this.salesForm.patchValue({
            mrpTotal:totalMrp.toFixed(2)
        },{emitEvent:false});
         this.updatedFinalAmount();
    }
    updatedFinalAmount(){
        const mrpTotal=Number(this.salesForm.get('mrpTotal')?.value || 0);
        const disc=Number(this.salesForm.get('discountLabel')?.value || 0);
        const discountedAmount=mrpTotal-(mrpTotal*disc/100);
        const roundedAmount=Math.round(discountedAmount);
        const roundOff = +(roundedAmount - discountedAmount).toFixed(2);
        this.salesForm.patchValue(
            {
               roundOff:roundOff,
               finalPayable:roundedAmount
            },{emitEvent:false}
        );
        this.salesForm.patchValue({finalPayable:roundedAmount},{emitEvent:false});
    }
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.updatePagedProducts();
    }
    updatePagedProducts() {
        this.pagedProducts = this.products.slice(this.first, this.first + this.rowsPerPage);
    }

    //for testing
     addItem(){
        this.mode='add';
        this.selectedRow=null;
        this.visibleDialog=true;
        setTimeout(() => {
          this.addInventoryComp.resetForm();
        });
    }
    closeDialog(){
        this.visibleDialog=false;
    }
    onChildUom(status:boolean):boolean{
        this.childUomStatus=status;
        return this.childUomStatus;
    }

   deleteItem(product:any) {
     this.confirmationService.confirm({
       message: `Are you sure you want to delete <b>${product.name}</b>?`,
       header: 'Confirm Delete',
       icon: 'pi pi-exclamation-triangle',
       acceptLabel: 'Yes',
       rejectLabel: 'No',
       acceptButtonStyleClass: 'p-button-danger',
       rejectButtonStyleClass: 'p-button-secondary',
       accept: () => {
         this.products = this.products.filter(p => p.code !== product.code);
         this.filterProducts();
         this.calculateTotals();
       },
       reject: () => {
         // Optional: Add toast or log cancel
         console.log('Deletion cancelled');
       }
     });
     }
   print(){

   }
   OnSalesHeaderCreate(data:any){
    const payload:any={
        "uname":"admin",
        "p_transactiontype":"SALE",
        "p_transactionid":0,
        "p_transactiondate":"09/11/2025",
        "p_customername":"Arushi",
        "p_mobileno":"9999999990",
        "p_totalcost":1000,
        "p_totalsale":1200,
        "p_overalldiscount":10,
        "p_roundoff":"0.20",
        "p_totalpayable":1080,
        "p_currencyid":0,
        "p_gsttran":"N",
        "p_status":"Complete",
        "p_isactive":"Y",
        "p_linktransactionid":0,
        "p_replacesimilir": "",
    "p_creditnoteno": "",
    "p_paymentmode": "Cash",
    "p_paymentdue": 0,
    "p_sale": [
        {
            "TransactiondetailId": 10,
            "ItemId": 19,
            "ItemName": "Switch 3 socket",
            "UOMId": 3,
            "Quantity":10,
            "itemcost":50,
            "MRP":60,
            "totalPayable":600
        },
                {
            "TransactiondetailId": 10,
            "ItemId": 19,
            "ItemName": "Switch 3 socket",
            "UOMId": 3,
            "Quantity":10,
            "itemcost":50,
            "MRP":60,
            "totalPayable":600
        }
    ],
    "clientcode": "CG01-SE",
    "x-access-token": this.authService.getToken()
   };
   this.salesService.OnSalesHeaderCreate(payload).subscribe({
    next:(res)=>{
        console.log('sales result',res);
        this.transactionid=res.data[0].tranpurchaseid;
        this.transactionIdOptions=res.data;

        const id=Number(res.data[0].tranpurchaseid);
        const exists = this.billNoOptions.some(item=>item.billno===id);
        if(!exists){
            const newItem={
                customername:"",
                transactiondate:null,
                billno:id,
                mobile:"",
            };
            this.billNoOptions.push(newItem);
        }
        this.salesForm.patchValue({
           p_tranpurchaseid: id
        });
        this.loadAllDropdowns();
    },
    error:(error)=>{
        console.log(error);
    }
   })
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
   onItemSelect(event:any){
    this.transactionid=event.value;
    const item=this.itemOptions.find((x)=>x.itemsku === event.value);
    console.log('item',item);
    if(!item) return;
     const newRow={
        selection:true,
        code:item.itemsku,
        name:item.itemname,
        curStock:item.currentstock,
        uom:item.uomid,
        quantity:item.quantity,
        mrp:item.saleprice,
        total:item.saleprice,
        warPeriod:item.warrentyperiod,
        location:item.location
     };
   const exists = this.products.some(p=>p.code === newRow.code);
   if(!exists){
    this.products.push(newRow);
    this.filteredProducts=[...this.products];
   }
   this.calculateTotals();
   }
   OnGetPurchaseItem(id:any){
    //  const payload={
    //     "uname":"admin",
    //     "p_type":"SALE"

    //  }
   }
   saleIdDetail(event:any){
    this.transactionid=event.value;
    console.log('trans',this.transactionid);
    const selectBillNo=this.billNoOptions.find((item)=>item.billno==event.value)
    console.log('bill:',selectBillNo);
    this.salesForm.patchValue({
        transactionDate:selectBillNo.transactiondate ? new Date(selectBillNo.transactiondate):null,
        customerName:selectBillNo.customerid,
        mobile:selectBillNo.mobileno
    })
  if(this.salesForm.valid){
    this.transactionid=event.value;
  }
  this.OnGetPurchaseItem(event.value);
   }
   
    onSave(updatedData: any) {
        const mappedData = {
            selection: true,
            code: updatedData.itemCode.label || updatedData.itemCode,
            name: updatedData.itemName,
            category: updatedData.category,
            curStock: updatedData.curStock,
            purchasePrice: updatedData.purchasePrice,
            quantity: updatedData.qty,
            total: +(updatedData.mrp * updatedData.qty).toFixed(2),
            uom: updatedData.uom,
            mrp: updatedData.mrp,
            discount: updatedData.discount,
            minStock: updatedData.minStock,
            warPeriod: updatedData.warPeriod,
            location: updatedData.location
        };
        const index = this.filteredProducts.findIndex((p) => p.code === this.selectedRow?.code);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...mappedData };
        }
        if(this.mode==='add'){
           this.products.push(mappedData);
        }
         this.filteredProducts = [...this.products];
  this.calculateTotals();
        this.closeDialog();
    }

mapFormToPayLoad(form:any,sales:any[]){
    return{
        p_transactionid:this.transactionid || 0,
        p_transactiontype:'SALE',
        p_transactiondate:form.transactionDate,
        p_customername:form.customerName,
        p_mobileno:form.mobile || '',
        p_totalcost:form.mrpTotal || 0,
         p_totalsale: form.mrpTotal || 0,
        p_overalldiscount: form.discountLabel || 0,
        p_roundoff: form.roundOff || 0,
        p_totalpayable: form.finalPayable || 0,
        p_currencyid: 0,
        p_gsttran: "N",
        p_status: "Complete",
        p_isactive: "Y",
        p_linktransactionid: 0,
        p_replacesimilir: "",
        p_creditnoteno: "",
        p_paymentmode: "Cash",
        p_paymentdue: 0,

        /* ---- SALES ITEM ARRAY ---- */
        p_sale: sales.map((item: any) => ({
            TransactiondetailId: 0,
            ItemId: item.code,
            ItemName: item.name,
            UOMId: item.uom,
            Quantity: item.quantity,
            itemcost: item.purchasePrice || 0,
            MRP: item.mrp,
            totalPayable: item.total
        })),
          uname: 'admin',
     clientcode: 'CG01-SE',
            'x-access-token': this.authService.getToken(),
        };
}

    saveAllChanges(){
        // this.stockInService.productItem = [...this.filteredProducts];
        if(this.salesForm.invalid) return;
        this.salesService.OninsertSalesDetails(this.mapFormToPayLoad(this.salesForm.getRawValue(),this.products)).subscribe({
            next:(res)=>{
                const msg = res?.data?.[0]?.msg || "Sales saved successfully";
                this.showSuccess(msg);
            },
            error:(res)=>{}
        })
    }
    onSubmit() {
        console.log(this.salesForm.value);
        this.confirmationService.confirm({
            message:'Are you sure you want to submit?',
            header:'Confirm',
            acceptLabel:'Yes',
            rejectLabel:'Cancel',
            accept: ()=>{
              this.saveAllChanges();
              this.OnSalesHeaderCreate(this.salesForm.value);
            },
            reject: ()=>{

            }
        })

    }

    reset() {
        this.salesForm.reset();
       this.products=[];
       this.filteredProducts=[];
       this.pagedProducts=[];
       this.first=0;
      this.salesForm.patchValue({
        mrpTotal:'',
        totalCost:'',
        roundOff:'',
        discountLabel:'',
        finalPayable:''
      },{emitEvent:false});
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
}
