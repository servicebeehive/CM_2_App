import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
   
     pagedProducts:any[]=[];
     first:number=0;
      today: Date = new Date();
     rowsPerPage:number=5;
    submitDisable:boolean=true;
     companyName:string='';
    companyAddress:string='';
    companycity:string='';
    companystate:string='';
    statecode:string='';
    companyemail:string='';
    companygstno:string='';
    bankname:string='';
    accountno:string='';
    branchname:string='';
    ifsc:string='';
    pan:string='';
    hsncode:string='';
        // ✅ Move dropdown options into variables
        cusMobileOptions = [];
        cusNameOptions = [];
        profileOptions:any={};
        statusOptions:any[]= [];
        products: any[] = [];
        filteredProducts: any[] = [];
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
            private confirmationService:ConfirmationService
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
            totalDueAmount:[''],
            p_checked:[false],
            p_stock:this.fb.array([])
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


validateReceivedAmount(row:any){
     const due = parseFloat(row.due_amount) || 0;
      const received = parseFloat(row.received_amount) || 0;
        
        if (received > due) {
            row.amountError = true;
            this.submitDisable=true;
        } else {
            row.amountError = false;
            this.submitDisable=false;
        }
}

   getStockArray(): FormArray {
        return this.invoiceForm.get('p_stock') as FormArray;
    }
    onGetStockIn() {
      this.products=this.inventoryService.productItem || [];
    }

    updateReceivedAmount(index:number,value:number):void{
        if(this.products[index]){
            this.products[index].received_amount=value;
            // this.validateReceivedAmount(this.products[index]);      
        }
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
                    this.totalDueAmount();
                    this.initialzeFormArray();
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
totalDueAmount():void{
  if(!this.products || this.products.length ===0){
    this.invoiceForm.get('totalDueAmount')?.setValue('0');
    return;
  }
  const totalSaleDue=this.products.reduce((total,product)=>{
    const isSaleTransaction = product.transactiontype && product.transactiontype.toUpperCase()==='SALE';
    if(isSaleTransaction){
        const dueAmount = Number(product.due_amount) || 0;
        return total +dueAmount;
    }
    return total;
  },0);
 const roundedTotal = Number(totalSaleDue.toFixed(2));

this.invoiceForm.get('totalDueAmount')?.setValue(roundedTotal);
}
   private initialzeFormArray():void{
     const stockArray = this.getStockArray();
    
    // Clear existing controls
    while (stockArray.length !== 0) {
        stockArray.removeAt(0);
    }
    
    // Add controls for each product
    this.products.forEach((product) => {
        stockArray.push(this.fb.control(product.received_amount || 0));
    });
}
 saveCurrentState() {
    const currentFilters = this.invoiceForm.value;
    this.sharedService.setInvoiceState(currentFilters, this.products);
  }
onDueAmountFilter(event:any){
    const isChecked = this.invoiceForm.controls['p_checked'].value;
    if(isChecked){
        this.filteredProducts=this.products.filter((item:any)=>{
            const dueAmount=Number(item.due_amount)||0;
            return dueAmount>0;
        });
    }
    else{
        this.filteredProducts=[...this.products];
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

     OnGetProfile() {
        const payload = this.createDropdownPayload('PROFILE');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
            if(res.data && res.data.length>0){
                this.profileOptions=res.data;
                const profile=res.data[0];
                this.companyName=profile.companyname,
                this.companyAddress=profile.companyaddress,
                this.companystate=profile.state_name,
                this.companycity=profile.city_name,
                this.companyemail=profile.companyemail,
                this.companygstno=profile.companygstno,
                this.statecode=profile.statecode,
                this.bankname=profile.bankname,
                this.accountno=profile.accountno,
                this.branchname=profile.branch,
                this.ifsc=profile.ifsc,
                this.pan=profile.pan
            }
            },
            error: (err) => console.log(err)
        });
    }

    loadAllDropdowns() {
        this.OnGetStatus();
        this.OnGetCusName();
        this.OnGetCusMobile(); 
        this.OnGetProfile(); 
    }


    openInvoice(row:any){
      if(!row || !row.invoice_no) return;
      const payload = {
        p_username:'admin',
        p_returntype:'SALEPRINT',
        p_returnvalue:row.invoice_no,
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

getReceivedAmountControl(index: number): AbstractControl | null {
    const stockArray = this.getStockArray();
    return stockArray.at(index)?.get('received_amount') || null;
}

    onChangeROPdown(){
    const payloadItems = [];
        
        // Process only rows with received amount > 0
        for (let i = 0; i < this.products.length; i++) {
            const row = this.products[i];
            const receivedAmount = parseFloat(row.received_amount) || 0;
            
            if (receivedAmount > 0) {
                // Validate amount before adding
                if (receivedAmount > parseFloat(row.due_amount)) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: `Received amount for invoice ${row.invoice_no} exceeds due amount`
                    });
                    return;
                }
                
                payloadItems.push({
                    adjtype: row.invoice_no,
                    // Add other required fields
                    ItemId: 0,
                    batchId: 0,
                    Quantity: 0,
                    mrpvalue: receivedAmount
                });
            }
        }
        
        if (payloadItems.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please enter received amount for at least one invoice'
            });
            return;
        }
        
        const payload = {
            p_stock: payloadItems,
            p_updatetype: 'DUE',
            p_username: 'admin' // Add username if required
        };
        
        // Call API
        this.inventoryService.updatestockadjustment(payload).subscribe({
            next: (res: any) => {
                this.showSuccess('Transaction has been saved successfully');
                
                // Refresh the data
                this.display();
            },
            error: (err) => {
                console.error('Error saving amounts:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save received amounts'
                });
            }
        });
    }
    submit(){
       this.confirmationService.confirm({
        message:'Are you sure you want to make change?',
        header: 'Confirm',
        acceptLabel:'Yes',
        rejectLabel:'Cancel',
        accept:()=>{
          this.onChangeROPdown();
        },
        reject:()=>{}
       });
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
          this.hsncode=res.data[0].hsncode;
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

            const popupWindow = window.open('', '_blank', 'width=900,height=1500');
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


