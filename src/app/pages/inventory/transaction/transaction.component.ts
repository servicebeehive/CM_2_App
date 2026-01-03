import { CommonModule, DatePipe } from '@angular/common';
import { Component, model, ViewChild } from '@angular/core';
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
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@/core/services/auth.service';
import { ShareService } from '@/core/services/shared.service';
import { forkJoin } from 'rxjs';
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
        CheckboxModule
    ],
    templateUrl: './transaction.component.html',
    styleUrl: './transaction.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class TransactionComponent {
    transactionForm!: FormGroup;

    visibleDialog = false;
    selectedRow: any = null;
    selection: boolean = true;
    pagedProducts: StockIn[] = [];
    first: number = 0;
    rowsPerPage: number = 5;
    globalFilter: string = '';
    today: Date = new Date();
     submitDisable:boolean=true;
    // ✅ Move dropdown options into variables
    vendorOptions = [];
    invoiceOptions = [];
    products: any[] = [];
    filteredProducts: any[] = [];
    
    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        public datepipe: DatePipe,
        private route: Router,
        private sharedService: ShareService,
        private confirmationService:ConfirmationService
    ) {}
    reportTypeOptions: any[] = [];
    ngOnInit(): void {
        this.transactionForm = this.fb.group(
            {
                invoice: [''],
                fromDate: [this.today, Validators.required],
                toDate: [this.today, Validators.required],
                p_vendor: [''],
                totalPayableAmount:[''],
                finalPayableAmount:[''],
                totalDebitNote:[''],
                p_checked:[false],
                p_stock:this.fb.array([])
            },
            { validators: this.dateRangeValidator }
        );
            this.loadAllDropdowns();
            this.onGetStockIn();
        const savedState = this.sharedService.getTransactionState();
        if (savedState) {
            this.transactionForm.patchValue(savedState.filters);
            this.products = savedState.data;
            this.filteredProducts = [...savedState.data];
        } 
    }
    dateRangeValidator(form: FormGroup) {
        const fromDate = form.get('fromDate')?.value;
        const toDate = form.get('toDate')?.value;
        if (!fromDate || !toDate) return null;
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return to >= from ? null : { dateRangeInvalid: true };
    }
    validateReceivedAmount(row:any){
     const due = parseFloat(row.total_due) || 0;
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
        return this.transactionForm.get('p_stock') as FormArray;
    }

    onGetStockIn() {
        this.products = this.inventoryService.productItem || [];
    }

    updateReceivedAmount(index:number,value:number):void{
        if(this.products[index]){
            this.products[index].received_amount=value;
            // this.validateReceivedAmount(this.products[index]);      
        }
    }
    
    display() {
        const invoice = this.transactionForm.controls['invoice'].value;
        const p_vendor = this.transactionForm.controls['p_vendor'].value;
        const startDate = this.transactionForm.controls['fromDate'].value;
        const endDate = this.transactionForm.controls['toDate'].value;

        if ((startDate && endDate) || p_vendor || invoice) {
            const payload = {
                p_invoicestart: this.datepipe.transform(startDate, 'yyyy/MM/dd'),
                p_invoiceend: this.datepipe.transform(endDate, 'yyyy/MM/dd'),
                p_vendor: p_vendor || null,
                p_invoicenumber: invoice || null,
                p_username: 'admin',
                clientcode: 'CG01-SE'
            };
            this.inventoryService.gettransactiondetail(payload).subscribe({
                next: (res: any) => {
                    console.log('API RESULT:', res.data);
                    this.products = res?.data || [];
                    this.filteredProducts = [...this.products];
                    this.totalDueAmount();
                    this.initialzeFormArray();
                    this.saveCurrentState();
                    this.onGetDebitnote(p_vendor);
                    this.totalfinalpayable();
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
   
   totalDueAmount():void{
    if(!this.products || this.products.length===0){
        this.transactionForm.get('totalPayableAmount')?.setValue('0');
        return;
    }
    const totalSaleDue=this.products.reduce((total,product)=>{
        const dueAmount=Number(product.total_due).toFixed(2) || 0;
        return total+ dueAmount;
    },0);
  this.transactionForm.get('totalPayableAmount')?.setValue(totalSaleDue);
   }

totalfinalpayable(){
    if(!this.products ||  this.products.length===0){
        this.transactionForm.get('finalPayableAmount')?.setValue('0');
        return;
    }
    const totalPayableAmount= this.transactionForm.get('totalPayableAmount')?.value;
    const totalDebitNote=this.transactionForm.get('totalDebitNote')?.value;
    const totalFinalAmount = (totalPayableAmount-totalDebitNote).toFixed(2);
    this.transactionForm.get('finalPayableAmount')?.setValue(totalFinalAmount);
}

   private initialzeFormArray():void{
    const stockArray = this.getStockArray();
    while(stockArray.length !==0){
        stockArray.removeAt(0);
    }
    this.products.forEach((product)=>{
        stockArray.push(this.fb.control(product.received_amount || 0));
    });
   }
onDueAmountFilter(event:any){
    const isChecked = this.transactionForm.controls['p_checked'].value;
    if(isChecked){
        this.filteredProducts=this.products.filter((item:any)=>{
            const dueAmount=Number(item.total_due)||0;
            return dueAmount>0;
        });
    }
    else{
        this.filteredProducts=[...this.products];
    }
}
    saveCurrentState() {
        const currentFilters = this.transactionForm.value;
        this.sharedService.setTransactionState(currentFilters, this.products);
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
            fromDate: new Date(),
            toDate: new Date()
        });
        this.filteredProducts = [];
        this.products = [];
        
    }

onGetDebitnote(data?:any){
    const payload={
        p_returntype:'DNNSUM',
        p_returnvalue:data || null
    };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next : (res)=>{
            console.log('result',res.data);
            const debitnote=res.data[0].total_dn_amount;
           console.log('dn:',debitnote)
        if( res.data){
           const data=res.data[0];
           this.transactionForm.patchValue({
            totalDebitNote:data.total_dn_amount
           });
            console.log('Setting totalDebitNote to:', data.total_dn_amount);
        }
        else{
            this.transactionForm.patchValue({
                    totalDebitNote: 0
                });
        }
        },
          error: (err) => {
            console.error('Error fetching debit note:', err);
        }
    })
}

    createDropdownPayload(returnType: string) {
        return {
            p_username: 'admin',
            p_returntype: returnType
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
        this.onGetDebitnote();
    }


    getReceivedAmountControl(index:number):AbstractControl|null{
        const stockArray=this.getStockArray();
        return stockArray.at(index)?.get('received_amount') || null;
    }

    onChangeROPdown(){
        const payloadItems=[];
        for(let i=0; i<this.products.length; i++){
            const row=this.products[i];
            const receivedAmount=parseFloat(row.received_amount) || 0;

            if(receivedAmount>0){
                if(receivedAmount>parseFloat(row.total_due)){
                    this.messageService.add({
                        severity:'error',
                        summary:'Error',
                        detail:`Received amount for transaction ${row.invoice_no} exceeds due amount`
                    });
                    return;
                }
               
                payloadItems.push({
                    adjtype:(row.purchaseid).toString(),
                    ItemId:0,
                    batchId:0,
                    Quantity:0,
                    mrpvalue:receivedAmount
               });
            }
        }
        if(payloadItems.length===0){
            this.messageService.add({
                severity:'warn',
                summary:'Warning',
                detail:'Please enter received amount for at least one invoice'
            });
            return;
        }
        const payload={
            p_stock:payloadItems,
            p_updatetype:'PURDUE',
            p_username:'admin'
        };
        this.inventoryService.updatestockadjustment(payload).subscribe({
            next:(res:any)=>{
                this.showSuccess(res?.message || 'Amount saved successfully');
                this.display();
            },
            error:(err)=>{
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


    openTransaction(row: any) {
        if (!row || !row.purchaseid) return;

        const purchaseId = row.purchaseid;

        // 🔸 First API call: Get purchase details (items)
        const detailsPayload$ = this.inventoryService.Getreturndropdowndetails({
            p_username: 'admin',
            p_returntype: 'PURCHASEDETAIL',
            p_returnvalue: purchaseId
        });

        // 🔸 Second API call: Get purchase header information
        const headerPayload$ = this.inventoryService.getdropdowndetails({
            p_username: 'admin',
            p_returntype: 'PURCHASEID', // Assuming this endpoint exists
            
        });
        forkJoin([detailsPayload$, headerPayload$]).subscribe({
            next: ([detailsPayload, headerPayload]) => {
                if (!detailsPayload.data || detailsPayload.data.length === 0) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'No Data',
                        detail: 'Transaction details not found'
                    });
                    return;
                }
                const itemsData = detailsPayload.data;
                let transactionSummary;
                if (headerPayload.data && headerPayload.data.length>0) {
                    const headerData = headerPayload.data.find((item:any)=>
                item.purchaseid==purchaseId || item.id == purchaseId
                    );
                    transactionSummary = headerData|| itemsData[0];
                    console.log('header',transactionSummary)
                } else {
                    transactionSummary = itemsData[0];
                }
                this.route.navigate(['/layout/inventory/stock-in'], {
                    state: {
                        mode: 'edit',
                        stockData: transactionSummary,
                        itemsData: itemsData,
                        returnUrl: '/layout/inventory/transaction'
                    }
                });
            },
            error: (err) => {
                console.error('API error:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load transaction data'
                });
            }
        });
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
