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
    selector: 'app-invoice',
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
    templateUrl: './invoice.component.html',
    styleUrl: './invoice.component.scss',
    providers:[ConfirmationService,DatePipe]
})
export class InvoiceComponent {
    invoiceForm!: FormGroup;

     visibleDialog=false;
     selectedRow:any=null;
     selection:boolean=true;
     pagedProducts:StockIn[]=[];
     first:number=0;
      today: Date = new Date();
     rowsPerPage:number=5;
    globalFilter: string = '';
        // ✅ Move dropdown options into variables
        cusMobileOptions = [];
        cusNameOptions = [];
        statusOptions:any[]= [];
        products: StockIn[] = [];
        filteredProducts: StockIn[] = [];
        constructor(
            private fb: FormBuilder,
            private inventoryService: InventoryService,
            private authService: AuthService,
            private messageService: MessageService,
            public datepipe:DatePipe
        ) {}
 
    ngOnInit(): void {
        this.invoiceForm = this.fb.group(
            {
                p_mobile: [''],
               p_cusname:[''],
                fromDate: [this.today,Validators.required],
                toDate:[this.today,Validators.required],
                status:['']
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
        return this.invoiceForm.get('p_stock') as FormArray;
    }
   
    onGetStockIn() {
      this.products=this.inventoryService.productItem || [];
    }
    
     display(){
        const p_mobile = this.invoiceForm.controls['p_mobile'].value;
        const p_cusname = this.invoiceForm.controls['p_cusname'].value;
        const startDate = this.invoiceForm.controls['fromDate'].value;
        const endDate = this.invoiceForm.controls['toDate'].value;
        const status = this.invoiceForm.controls['status'].value;

        if((startDate && endDate) || (p_cusname || p_mobile || status) ){
            const payload={
                 
                p_startdate: this.datepipe.transform(startDate,'yyyy/MM/dd'),
                p_enddate: this.datepipe.transform(endDate,'yyyy/MM/dd'),
                p_mobile: p_mobile || null,
                p_customer: p_cusname || null,
                p_status: status || null,
                p_username:'admin',
                    
                      
            };
            this.inventoryService.getinvoicedetail(payload).subscribe({
                next :(res:any) =>{
                    console.log('API RESEULT:',res.data);
                    this.products=res?.data || [];
                    this.filteredProducts = [...this.products];
                    if(this.products.length===0){
                        let message = 'No Data Available for this Category and Item';
                        this.showSuccess(message);
                    }
                },
                error:(err)=>{
                    console.log(err);
                }
            });
        } else{
            let message='Please select date';
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

    get grandTotal(): number {
        return this.products.reduce((sum, p) => sum + (p.total || 0), 0);
    }

    reset() {
        this.invoiceForm.reset({
            fromDate: new Date(),
            toDate: new Date()
        });
        this.filteredProducts = [];
         this.products = [];
    }
    createDropdownPayload(returnType: string) {
        return {
             
            p_username: 'admin',
            p_returntype: returnType,
                
                  
        };
    }
    OnGetCusName() {
        const payload = this.createDropdownPayload('CUSTOMER');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.cusNameOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    OnGetStatus() {
        const payload = this.createDropdownPayload('STATUS');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.statusOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    OnGetCusMobile() {
        const payload = this.createDropdownPayload('MOBILE');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.cusMobileOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    loadAllDropdowns() {
        this.OnGetStatus();
        this.OnGetCusName();
        this.OnGetCusMobile();
       
    }
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
