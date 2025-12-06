import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
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
import { Paginator } from 'primeng/paginator';
import { RouterLink } from "@angular/router";
import { AuthService } from '@/core/services/auth.service';
import { RadioButtonModule } from 'primeng/radiobutton';
interface Product {
    name: string;
    price: string;
    code: string;
    sku: string;
    status: string;
    tags: string[];
    category: string;
    colors: string[];
    stock: string;
    inStock: boolean;
    description: string;
    images: Image[];
}

interface Image {
    name: string;
    objectURL: string;
}

@Component({
    selector: 'app-transaction-report',
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
    ToggleSwitchModule,
    RippleModule,
    ChipModule,
    FluidModule,
    MessageModule,
    DatePickerModule,
    DialogModule,
    AutoCompleteModule,
    ConfirmDialogModule,
    CheckboxModule,
    RadioButtonModule
],
    templateUrl: './transaction-report.component.html',
    styleUrl: './transaction-report.component.scss',
    providers:[ConfirmationService,DatePipe]
})
export class TransactionReportComponent {
    reportForm!: FormGroup;

     visibleDialog=false;
     selectedRow:any=null;
     selection:boolean=true;
     pagedProducts:StockIn[]=[];
     first:number=0;
     rowsPerPage:number=5;
     today:Date = new Date();
     gstTransaction: string = 'all';
    globalFilter: string = '';
    columns : any[]=[];
        // ✅ Move dropdown options into variables
        categoryOptions = [];
        itemOptions = [];
        products: StockIn[] = [];
        filteredProducts: StockIn[] = [];
        constructor(
            private fb: FormBuilder,
            private inventoryService: InventoryService,
            private authService: AuthService,
            private messageService: MessageService,
            public datepipe:DatePipe
        ) {}
 reportTypeOptions:any[]= [
    {label:'Sale', value:'SALE'},
    {label:'Return', value:'RETURN'},
    {label:'Replace', value:'REPLACE'},
    {label:'Purchase', value:'PURCHASE'},
    {label:'Debit Note', value:'DEBITNOTE'},
 ];

 setTableColumns(type:String){
     if(!type || type === '') {
        this.columns=[
            {fields:'' , header:'Invoice No'},
            {fields:'' , header:'Invoice Date'},
            {fields:'' , header:'Category', widthClass: 'fixed-category-col'},
            {fields:'' , header:'Item', widthClass: 'fixed-item-col'},
            {fields:'' , header:'UOM'},
            {fields:'' , header:'Status'},
            {fields:'' , header:'GST'},
            {fields:'' , header:'MRP'},
            {fields:'' , header:'Quantity'},
            {fields:'' , header:'Amount'},
            {fields:'' , header:'Discount'},
            {fields:'' , header:'Grand Total'}
        ];
         this.filteredProducts = [];
    return;
    }
   else if(type === 'SALE' || type === 'REPLACE'){
        this.columns=[
            {fields:'invoiceno' , header:'Invoice No'},
            {fields:'invoicedate' , header:'Invoice Date'},
            {fields:'category' , header:'Category', widthClass: 'fixed-category-col'},
            {fields:'item' , header:'Item', widthClass: 'fixed-item-col'},
            {fields:'uom' , header:'UOM'},
            {fields:'status' , header:'Status'},
            {fields:'gsttans' , header:'GST'},
            {fields:'mrp' , header:'MRP'},
            {fields:'qty' , header:'Quantity'},
            {fields:'amount' , header:'Amount'},
            {fields:'overalldiscount' , header:'Discount'},
            {fields:'grandtotal' , header:'Grand Total'}
        ];
    }
    else if(type==='RETURN'){
            this.columns=[
            {fields:'returninvoiceno' , header:'Invoice No'},
            {fields:'returninvoicedate' , header:'Invoice Date'},
            {fields:'saleinvoiceno' , header:'Sale Invoice No',widthClass: 'fixed-saleinvoice-col'},
            {fields:'category' , header:'Category', widthClass: 'fixed-category-col'},
            {fields:'item' , header:'Item', widthClass: 'fixed-item-col'},
            {fields:'uom' , header:'UOM'},
            {fields:'status' , header:'Status'},
            {fields:'gsttans' , header:'GST'},
            {fields:'mrp' , header:'MRP'},
            {fields:'qty' , header:'Quantity'},
            {fields:'amount' , header:'Amount'},
            {fields:'overalldiscount' , header:'Discount'},
            {fields:'grandtotal' , header:'Grand Total'}
        ];
    }
    else if(type === 'PURCHASE'){
         this.columns=[
            {fields:'purchaseid' , header:'Purchase id'},
            {fields:'purchasedate' , header:'Purchase Date'},
            {fields:'invoiceno' , header:'Invoice No'},
            {fields:'invoicedate' , header:'Invoice Date'},
            {fields:'category' , header:'Category', widthClass: 'fixed-category-col'},
            {fields:'item' , header:'Item', widthClass: 'fixed-item-col'},
            {fields:'uom' , header:'UOM'},
            {fields:'status' , header:'Status'},
            {fields:'costprice' , header:'Cost Price'},
            {fields:'qty' , header:'Quantity'},
            {fields:'amount' , header:'Amount'},
            {fields:'grandtotal' , header:'Grand Total'}
        ];
    }
    else if(type=== 'DEBITNOTE') {
        this.columns=[
            {fields:'debitnote' , header:'Debit Note'},
            {fields:'creditnote' , header:'Credit Note'},
            {fields:'repinvoiceno' , header:'Invoice No'},
            {fields:'repinvoicedate' , header:'Invoice Date'},
            {fields:'category' , header:'Category', widthClass: 'fixed-category-col'},
            {fields:'item' , header:'Item', widthClass: 'fixed-item-col'},
            {fields:'uom' , header:'UOM'},
            {fields:'status' , header:'Status'},
            {fields:'mrp' , header:'MRP'},
            {fields:'qty' , header:'Quantity'},
            {fields:'amount' , header:'Amount'},
            {fields:'overalldiscount' , header:'Discount'},
            {fields:'grandtotal' , header:'Grand Total'}
        ]; 
    }
   
    else{
        this.columns=[];
    }
   
 }
    ngOnInit(): void {
        this.reportForm = this.fb.group(
            {
                item: [{value:'',disable:true}],
                fromDate: [this.today,[Validators.required]],
                toDate:[this.today,[Validators.required]],
                category:[{value:'',disable:true}],
                reportType:['',Validators.required],
            },{validators: this.dateRangeValidator}
        );

        this.gstTransaction = 'all';
          this.reportForm.get('category')?.disable();
        this.reportForm.get('item')?.disable();
        this.setTableColumns('');
       this.loadAllDropdowns();
        this.onGetStockIn(); 
        this.reportForm.get('reportType')?.valueChanges.subscribe(selected=>{
            if(selected){
                this.reportForm.get('category')?.enable();
                this.reportForm.get('item')?.enable();
            }
             else {
        this.reportForm.get('category')?.disable();
        this.reportForm.get('item')?.disable();
         this.reportForm.patchValue({ category: null, item: null });
      }
        });

        this.reportForm.get('category')?.valueChanges.subscribe(() => this.applyGlobalFilter());
        this.reportForm.get('item')?.valueChanges.subscribe(() => this.applyGlobalFilter());
    }

private resetGstTransaction(reportType:string){
    if(reportType === 'SALE' || reportType === 'RETURN'){
        this.gstTransaction='all';
    }
    else if(reportType === 'DEBITNOTE'){
        this.gstTransaction='none';
    }
    else{
        this.gstTransaction='all';
    }
}

 dateRangeValidator(form:FormGroup){
    const fromDate = form.get('fromDate')?.value;
    const toDate=form.get('toDate')?.value;
  if(!fromDate || !toDate)
    return null;
 const from=new Date(fromDate);
 const to=new Date(toDate);
  return to >= from ? null :{ dateRangeInvalid:true }; 
 }



  getStockArray(): FormArray {
        return this.reportForm.get('p_stock') as FormArray;
    }
    Onreturndropdowndetails() {
        const category = this.reportForm.controls['category'].value;
        const item = this.reportForm.controls['item'].value;
        const reportType= this.reportForm.controls['reportType'].value;
        const fromDate = this.reportForm.controls['fromDate'].value;
        const toDate = this.reportForm.controls['toDate'].value;
        const gstType = this.gstTransaction;
        
        if ( (fromDate && toDate && reportType )|| category || item || gstType) {
            const payload = {
                uname: 'admin',
                p_categoryid: category || null,
                p_itemid: item || null,
                p_fromdate: this.datepipe.transform(fromDate,'yyyy/MM/dd'),
                p_todate: this.datepipe.transform(toDate,'yyyy/MM/dd'),
                p_username:'admin',
                p_gsttran: ((reportType==='DEBITNOTE')?(gstType ==='none' ? null : gstType) : (gstType === 'all' ? null : gstType)),
                p_reporttype: reportType || 'SALE',
                clientcode: 'CG01-SE',
                'x-access-token': this.authService.getToken()
            };
            this.setTableColumns(reportType);
            this.inventoryService.gettransactionreportdetail(payload).subscribe({
                next: (res: any) => {
                    console.log('API RESULT:', res.data);
                    this.products = res?.data || [];
                    this.filteredProducts = [...this.products];
                    // this.buildFormArrayFormProducts(this.filteredProducts);
                    if (this.products.length == 0) {
                        let message = 'No Data Available for this Category and Item';
                        this.showSuccess(message);
                    }
                },
                error: (err) => {
                    console.error(err);
                }
            });
        } else {
            let message = 'Please select both Category and Item before filtering.';
            this.errorSuccess(message);
        }
    }
    // private buildFormArrayFormProducts(products: any[]) {
    //     const stockArray = this.getStockArray();
    //     console.log('stock arrary', stockArray);
    //     stockArray.clear();
    //     products.forEach((p: any) => {
    //         const group = this.fb.group({
    //            itemid:[p.itemid],
    // categoryid:[p.categoryid],
    // mrp:[p.mrp],
    // purchaseprice:[p.purchaseprice] 
    //         });
    //         stockArray.push(group);
    //     });
    // }
    applyGlobalFilter() {
       const searchTerm=(this.globalFilter || '')?.toLowerCase().trim();
       const selectedCategory=this.reportForm.get('category')?.value;
       const selectedItem=this.reportForm.get('item')?.value;
       this.filteredProducts=this.products.filter((p:any)=>{
        const matchesSearch=!searchTerm || String(p.itemcombine ?? p.name ?? '').toLowerCase() .includes(searchTerm) ||
        String(p.categoryname ?? p.category ?? '').toLowerCase() .includes(searchTerm) ||
      String(p.curStock ?? p.currentstock ?? '')
                    .toLowerCase()
                    .includes(searchTerm);

            const matchesCategory = !selectedCategory || p.category === selectedCategory || p.categoryid === selectedCategory;
            const matchesItem = !selectedItem || p.name === selectedItem || p.itemid === selectedItem;

            return matchesSearch && matchesCategory && matchesItem;
       });
    //    this.buildFormArrayFormProducts(this.filteredProducts);
    }
    onGetStockIn() {
      this.products=this.inventoryService.productItem || [];
    //   this.buildFormArrayFormProducts(this.products);
    }
    onItemChange(event:any){
  const itemId = event.value;
  if(!itemId){
     this.products = [];
        this.filteredProducts = [];
        // this.buildFormArrayFormProducts([]);
        
        return;
  }
}

onCategoryItem(event: any) {
  const categoryId = event.value;
this.reportForm.get('item')?.setValue(null);
  // If category is null → load all items
  if (!categoryId) {
    this.OnGetItem();     // reload full item list
    return;
  }

  // If category has value → load category-specific items
  this.categoryRelavantItem(categoryId);
}
onReportChange(event:any){
   const reportType=event.value;
   if(reportType){
    this.setTableColumns(reportType || '');
   }
   if(!reportType){
  this.products = [];
        this.filteredProducts = [];
         this.reportForm.get('category')?.setValue(null);
        this.reportForm.get('item')?.setValue(null);
        this.reportForm.get('fromDate')?.setValue(this.today);
        this.reportForm.get('toDate')?.setValue(this.today);
        return;
   } 
   this.resetGstTransaction(reportType);
}
 categoryRelavantItem(id:any){
   console.log('item:',id);
   this.itemOptions=[];
   const payload={
    uname:"admin",
    p_username:"admin",
    p_returntype:"CATEGORY",
    p_returnvalue:id.toString(),
    clientcode:"CG01-SE",
    "x-access-token":this.authService.getToken()
   };
   this.inventoryService.Getreturndropdowndetails(payload).subscribe({
    next:(res: any) => {
    if(!res.data || res.data.length==0){
         this.itemOptions = [];
        // Clear filtered products if no items for this category
        this.filteredProducts = [];
        this.products = [];
        // this.buildFormArrayFormProducts([]);
        this.showSuccess('No items found for this category.');
        return;
      }
      this.itemOptions=res.data;
    },
    error:(err)=>{
      console.error(err);
    }
   });
 }
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.updatePagedProducts();
    }

    updatePagedProducts() {
        // this.pagedProducts = this.products.slice(this.first, this.first + this.rowsPerPage);
    }

    reset() {
        this.reportForm.reset({
         fromDate : new Date(),
    toDate : new Date()
        });
        this.filteredProducts = [];
         this.products = [];
        this.setTableColumns('');
 this.reportForm.get('category')?.disable();
    this.reportForm.get('item')?.disable();
    const currentReportType = this.reportForm.get('reportType')?.value;
        if (currentReportType) {
            this.resetGstTransaction(currentReportType);
        } else {
            this.gstTransaction = 'all';
        }
         this.OnGetItem();
    }
    createDropdownPayload(returnType: string) {
        return {
            uname: 'admin',
            p_username: 'admin',
            p_returntype: returnType,
            clientcode: 'CG01-SE',
            'x-access-token': this.authService.getToken()
        };
    }
    OnGetItem() {
        const payload = this.createDropdownPayload('ITEM');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    // OnGetReport() {
    //     // const payload = this.createDropdownPayload('ITEM');
    //     // this.inventoryService.getdropdowndetails(payload).subscribe({
    //     //     next: (res) => (this.itemOptions = res.data),
    //     //     error: (err) => console.log(err)
    //     // });
    // }
    OnGetCategory() {
        const payload = this.createDropdownPayload('CATEGORY');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.categoryOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    loadAllDropdowns() {
        // this.OnGetReport();
        this.OnGetCategory();
        this.OnGetItem();
       
    }
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
