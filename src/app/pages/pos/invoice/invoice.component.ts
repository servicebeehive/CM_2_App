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
import { Router, RouterLink } from "@angular/router";
import { AuthService } from '@/core/services/auth.service';
import { ShareService } from '@/core/services/shared.service';
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
        invoiceData:any[]=[];
        invoiceSummary:any={};
        constructor(
            private fb: FormBuilder,
            private inventoryService: InventoryService,
            private authService: AuthService,
            private messageService: MessageService,
            public datepipe:DatePipe,
            private router:Router,
            private sharedService: ShareService,
        ) {}
 
    ngOnInit(): void {
        this.invoiceForm = this.fb.group(
            {
                p_mobile: [''],
               p_cusname:[''],
                fromDate: [this.today,Validators.required],
                toDate:[this.today,Validators.required],
                status:[''],

                //PRINT SECTION VARIABLE
                p_billno: [''],
            p_transactiondate: [''],
            p_transactionid: [''],
            p_customername: [''],
            p_customeraddress: [''],
            p_mobileno: [''],
            p_customergstin: [''],
            p_customerstate: [''],
            p_totalsale: [''],
            p_totalpayable: [''],
            p_disctype: [''],
            p_overalldiscount: [''],
            discountvalueper: [''],
            p_roundoff: [''],
            amount_before_tax: [''],
            cgst_9: [''],
            sgst_9: [''],
            tax_18: [''],
            p_totalqty: [''],
            },{validators:this.dateRangeValidator}
        );
         this.loadAllDropdowns();
        this.onGetStockIn();
        const savedState = this.sharedService.getInvoiceState();
        if(savedState){
            this.invoiceForm.patchValue(savedState.filters);
            this.products=savedState.data;
            this.filteredProducts = [...savedState.data];
            console.log('Restored state from navigation');
        }
       
    }
    blockMinus(event: KeyboardEvent) {
    console.log(event);
    if (event.key === '-' || event.key === 'Minus' || event.key ==='e' || event.key === 'E') {
      event.preventDefault();
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

getDueAmount(row:any):number
{
    return (Number(row.total_amount)||0) -(Number(row.paid_amount)||0);
}
validateReceivedAmount(row:any){
    const due = this.getDueAmount(row);
    if(row.received_amount > due){
        row.amountError=true;
        // row.received_amount=due;
    }
    else{
        row.amountError = false;
    }
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
                     this.saveCurrentState();
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

 saveCurrentState() {
    const currentFilters = this.invoiceForm.value;
    this.sharedService.setInvoiceState(currentFilters, this.products);
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
         this.invoiceData=[];
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


    openInvoice(row:any){
      if(!row || !row.invoice_no) return;
      const payload = {
        p_username:'admin',
        p_returntype:'SALEPRINT',
        p_returnvalue:row.invoice_no
      };

      this.saveCurrentState();
      this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next:(res:any)=>{
           if(res.data && res.data.length>0){
            const invoiceSummary = res.data[0];
            console.log('data data:',invoiceSummary);
            
            this.router.navigate(['/layout/pos/sales'],{
                state:{
                    mode:'edit',
                    saleData:invoiceSummary,
                    itemsData:res.data,
                    returnUrl: '/layout/pos/invoice'
                }
            });
        }
            else{
              this.messageService.add({
                 severity: 'warn',
          summary: 'No Data',
          detail: 'Invoice data not found'
              });
            }
        },
        error:() =>{
            this.messageService.add({
                 severity: 'error',
        summary: 'Error',
        detail: 'Failed to load invoice'
            });
        }
      });
    }
    submit(){

    }
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
    canPrint(row:any):boolean{
        if(!row || !row.transactiontype)
            return false;
        return row.transactiontype.toUpperCase() ==='SALE';
    }
   printInvoice(row: any) {
    
    // Create payload FIRST
    const payload = {
        "p_username": 'admin',
        "p_returntype": 'SALEPRINT',
        "p_returnvalue": row.invoice_no
    };
    
    console.log('Payload:', payload); // Debug: Check if payload is correct
    
    // Make API call
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res) => {
            console.log('API Result:', res.data);
            if(Array.isArray(res.data) && res.data.length>0){
                this.invoiceData=res.data;

            }
            
            this.populateInvoiceForm(res.data[0]);
            setTimeout(()=>{
                this.openPrintWindow();
            },100); 
        },
        error: (err) => {
            console.error('API Error:', err);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load invoice data'
            });
        } 
    });
}

 private populateInvoiceForm(data:any){
    if(!data) return;
            this.invoiceForm.patchValue({
                p_billno:data.billno || '',
                 p_transactiondate: data.transactiondate || '',
            p_transactionid: data.transactionid || '',
            p_customername: data.customername ||'',
            p_mobileno: data.mobileno || '',
            p_totalsale: data.totalsale || 0,
            p_totalpayable: data.totalpayable || 0,
            p_disctype: data.discounttype || 'N',
            p_overalldiscount: data.discount || 0,
            discountvalueper: data.discount || 0,
            p_roundoff: data.roundoff || 0,
            amount_before_tax: data.amount_before_tax || 0,
            cgst_9: data.cgst_9 || 0,
            sgst_9: data.sgst_9 || 0,
            tax_18: data.tax_18 || 0,
            p_totalqty: data.quantity || 0
            });
            
        }
        private openPrintWindow(){
             // Now open print window AFTER getting data
            const printContents = document.getElementById('invoicePrintSection')?.innerHTML;
            if (!printContents) {
                console.error('Invoice print section not found');
                return;
            }

            const popupWindow = window.open('', '_blank', 'width=900,height=1000');
            if (popupWindow) {
                popupWindow.document.open();
                popupWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Invoice Print</title>
                        <style>
                            /* Your print styles here */
                            body { font-family: Arial, sans-serif; }
                            /* Add more styles as needed */
                        </style>
                    </head>
                    <body>
                        ${printContents}
                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            };
                        </script>
                    </body>
                    </html>
                `);
                popupWindow.document.close();
            }
        }
}


