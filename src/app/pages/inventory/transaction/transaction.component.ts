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
    selector: 'app-transaction',
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
],
    templateUrl: './transaction.component.html',
    styleUrl: './transaction.component.scss',
    providers:[ConfirmationService,DatePipe]
})
export class TransactionComponent {
    transactionForm!: FormGroup;

     visibleDialog=false;
     selectedRow:any=null;
     selection:boolean=true;
     pagedProducts:StockIn[]=[];
     first:number=0;
     rowsPerPage:number=5;
    globalFilter: string = '';
    today:Date =new Date();
        // ✅ Move dropdown options into variables
        vendorOptions = [];
        invoiceOptions = [];
        products: StockIn[] = [];
        filteredProducts: StockIn[] = [];
        constructor(
            private fb: FormBuilder,
            private inventoryService: InventoryService,
            private authService: AuthService,
            private messageService: MessageService,
            public datepipe : DatePipe
        ) {}
 reportTypeOptions:any[]= [];
    ngOnInit(): void {
        this.transactionForm = this.fb.group(
            {
                invoice: [''],
                fromDate: [this.today,Validators.required],
                toDate:[this.today,Validators.required],
                p_vendor:[''],
            },{validators:this.dateRangeValidator}
        );
       this.loadAllDropdowns();
        this.onGetStockIn();
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
        return this.transactionForm.get('p_stock') as FormArray;
    }
    
    onGetStockIn() {
      this.products=this.inventoryService.productItem || [];
    }
  
 display(){
  const invoice = this.transactionForm.controls['invoice'].value;
  const p_vendor=this.transactionForm.controls['p_vendor'].value;
  const startDate = this.transactionForm.controls['fromDate'].value;
  const endDate = this.transactionForm.controls['toDate'].value;

  if((startDate && endDate) || p_vendor || invoice){
    const payload={
        uname:'admin',
        p_invoicestart: this.datepipe.transform(startDate,'yyyy/MM/dd'),
        p_invoiceend:this.datepipe.transform(endDate,'yyyy/MM/dd'),
        p_vendor:p_vendor||null,
        p_invoicenumber:invoice||null,
        p_username:'admin',
        clientcode:'CG01-SE',
        'x-access-token':this.authService.getToken()
    };
    this.inventoryService.gettransactiondetail(payload).subscribe({
        next:(res:any)=>{
          console.log('API RESULT:', res.data);
          this.products=res?.data || [];
          this.filteredProducts=[...this.products];
          if(this.products.length ==0){
             let message = 'No Data Available for this Category and Item';
                        this.showSuccess(message);
          }  
        },
        error:(err)=>{
            console.error(err);
        }
    });
  }
 else{
     let message = 'Please select both Category and Item before filtering.';
            this.errorSuccess(message);
        }
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
        this.transactionForm.reset({
            fromDate : new Date(),
            toDate : new Date()
        });
        this.filteredProducts = [];
         this.products = [];
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
    OnGetInvoice() {
        const payload = this.createDropdownPayload('INVOICENO');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.invoiceOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    OnGetVendor() {
        const payload = this.createDropdownPayload('VENDOR');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.vendorOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    loadAllDropdowns() {
        this.OnGetVendor();
        this.OnGetInvoice();
       
    }
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
