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
            private router:Router
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
    openInvoiceInNewTab(row:any){
        console.log('Opening invoice:', row);
        const payload={
            p_username:'admin',
            p_returntype:'SALEPRINT',
            p_returnvalue:row.invoice_no
        };
        this.messageService.add({
            severity:'info',
            summary:'Loading',
            detail:'Opening invoice details...',
            life:2000
        });
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next:(res:any)=>{
                if(res.data && res.data.length>0){
                    const invoiceDetails = res.data[0];
                    console.log('Invoice details:', invoiceDetails);

                    const salePageData = this.prepareSalePageData(invoiceDetails, res.data);
                    
                    // Store in localStorage with a unique key
                    const storageKey = `invoice_${row.invoice_no}_${Date.now()}`;
                    localStorage.setItem(storageKey, JSON.stringify(salePageData));
                    
                    // Open sale page in new tab
                    const salePageUrl = `/sale?storageKey=${storageKey}&mode=edit&invoice_no=${row.invoice_no}`;
                    window.open(salePageUrl, '_blank');
                    
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Invoice opened in sale page'
                    });
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'No Data',
                        detail: 'No invoice details found'
                    });
                }
            },
            error: (err) => {
                console.error('Error fetching invoice details:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load invoice details'
                });
            }
        });
    }

    // Prepare data for sale page
    private prepareSalePageData(invoiceSummary: any, items: any[]): any {
        return {
            // Basic invoice info
            invoice_no: invoiceSummary.billno,
            invoice_date: invoiceSummary.transactiondate,
            
            // Customer info
            customer: {
                name: invoiceSummary.customername || '',
                mobile: invoiceSummary.mobileno || '',
                // Add other customer fields if available
                address: invoiceSummary.customeraddress || '',
                gstin: invoiceSummary.customergstin || '',
                state: invoiceSummary.customerstate || ''
            },
            
            // Items list
            items: items.map(item => ({
                item_id: item.itemid,
                item_name: item.itemname,
                category: item.categoryname,
                quantity: item.quantity,
                uom: item.uomname,
                mrp: item.mrp,
                cost_price: item.costprice,
                discount: item.discount || 0,
                tax_percentage: item.taxpercentage || 0,
                total: (item.quantity * item.mrp) - (item.discount || 0)
            })),
            
            // Totals
            totals: {
                subtotal: invoiceSummary.totalsale || 0,
                discount: invoiceSummary.discount || 0,
                discount_type: invoiceSummary.discounttype || 'N',
                tax: invoiceSummary.tax_18 || 0,
                cgst: invoiceSummary.cgst_9 || 0,
                sgst: invoiceSummary.sgst_9 || 0,
                roundoff: invoiceSummary.roundoff || 0,
                grand_total: invoiceSummary.totalpayable || 0,
                amount_before_tax: invoiceSummary.amount_before_tax || 0
            },
            
            // Payment info
            payment: {
                paid_amount: invoiceSummary.paid_amount || 0,
                balance: invoiceSummary.balance || 0,
                status: invoiceSummary.status || '',
                payment_mode: invoiceSummary.payment_mode || 'Cash'
            },
            
            // Flags for sale page
            mode: 'edit',
            source: 'invoice_report'
        };
    }
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
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


