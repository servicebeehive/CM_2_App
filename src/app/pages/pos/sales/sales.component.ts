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
import { ConfirmationService } from 'primeng/api';
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
      //for testing
  @ViewChild(AddinventoryComponent) addInventoryComp!:AddinventoryComponent;

    // ✅ Move dropdown options into variables
    billNoOptions = [];

    holdTransIdOptions = [
        { label: 'Trans 1', value: 'trans1' },
        { label: 'Trans 2', value: 'trans2' },
        { label: 'Trans 3', value: 'trans3' }
    ];

    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService,
        private salesService:InventoryService
    ) {}

    ngOnInit(): void {
        this.loadAllDropdowns();
         this.onGetStockIn();
        this.salesForm = this.fb.group({
            billNo: ['', Validators.required],
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
   this.salesService.OnPurchesHeaderCreate(payload).subscribe({
    next:(res)=>{
        console.log('sales result',res);
        this.transactionid=res.data[0].tranpurchaseid;
        this.transactionIdOptions=res.data
        this.loadAllDropdowns();

    },
    error:(error)=>{
        console.log(error);
    }
   })
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
    this.salesForm.patchValue({
    
    })
    // if(!item) return;
    // this.salesForm.patchValue({
    //     itemCode:item.itemsku,
    //       itemName: item.itemname,
    // stock: item.currentstock,
    // mrp: item.saleprice,
    // gstItem: item.gstitem === 'Y',
    // uom: item.uomid
    // });
   }
   salesDetail(event:any){
//     this.transactionid=event.value;
//     console.log('trans',this.transactionid);
//     const selectBillNo=this.billNoOptions.find(item=>item.billno==event.value)
//     this.salesForm.patchValue({
//         transactionDate:selectBillNo.transactiondate ? new Date(selectBillNo.invoicedate)
//   : null,
//         customerName:selectBillNo.customerid,
//         mobile:selectBillNo.mobileno
//     })
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

    saveAllChanges(){
        // this.stockInService.productItem = [...this.filteredProducts];
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
}


