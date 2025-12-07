import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { AuthService } from '@/core/services/auth.service';
import { RadioButtonModule } from 'primeng/radiobutton';

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
    providers: [ConfirmationService, DatePipe]
})
export class TransactionReportComponent {
    reportForm!: FormGroup;
    visibleDialog = false;
    selectedRow: any = null;
    selection: boolean = true;
    first: number = 0;
    rowsPerPage: number = 5;
    today: Date = new Date();
    gstTransaction: string = 'all';
    globalFilter: string = '';
    columns: any[] = [];
    showData: boolean = false; 
    
    categoryOptions = [];
    itemOptions = [];
    products: StockIn[] = [];
    filteredProducts: StockIn[] = [];
    
    reportTypeOptions: any[] = [
        { label: 'Sale', value: 'SALE' },
        { label: 'Return', value: 'RETURN' },
        { label: 'Replace', value: 'REPLACE' },
        { label: 'Purchase', value: 'PURCHASE' },
        { label: 'Debit Note', value: 'DEBITNOTE' },
    ];
    
    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        public datepipe: DatePipe
    ) {}
    
    setTableColumns(type: string) {
        if (!type || type === '') {
            this.columns = [
                { fields: '', header: 'Invoice No' },
                { fields: '', header: 'Invoice Date' },
                { fields: '', header: 'Category', widthClass: 'fixed-category-col' },
                { fields: '', header: 'Item', widthClass: 'fixed-item-col' },
                { fields: '', header: 'UOM' },
                { fields: '', header: 'Status' },
                { fields: '', header: 'GST' },
                { fields: '', header: 'MRP' },
                { fields: '', header: 'Quantity' },
                { fields: '', header: 'Amount' },
                { fields: '', header: 'Discount' },
                { fields: '', header: 'Grand Total' }
            ];
            this.filteredProducts = [];
            return;
        }
        else if (type === 'SALE' || type === 'REPLACE') {
            this.columns = [
                { fields: 'invoiceno', header: 'Invoice No' },
                { fields: 'invoicedate', header: 'Invoice Date' },
                { fields: 'category', header: 'Category', widthClass: 'fixed-category-col' },
                { fields: 'item', header: 'Item', widthClass: 'fixed-item-col' },
                { fields: 'uom', header: 'UOM' },
                { fields: 'status', header: 'Status' },
                { fields: 'gsttans', header: 'GST' },
                { fields: 'mrp', header: 'MRP' },
                { fields: 'qty', header: 'Quantity' },
                { fields: 'amount', header: 'Amount' },
                { fields: 'overalldiscount', header: 'Discount' },
                { fields: 'grandtotal', header: 'Grand Total' }
            ];
        }
        else if (type === 'RETURN') {
            this.columns = [
                { fields: 'returninvoiceno', header: 'Invoice No' },
                { fields: 'returninvoicedate', header: 'Invoice Date' },
                { fields: 'saleinvoiceno', header: 'Sale Invoice No', widthClass: 'fixed-saleinvoice-col' },
                { fields: 'category', header: 'Category', widthClass: 'fixed-category-col' },
                { fields: 'item', header: 'Item', widthClass: 'fixed-item-col' },
                { fields: 'uom', header: 'UOM' },
                { fields: 'status', header: 'Status' },
                { fields: 'gsttans', header: 'GST' },
                { fields: 'mrp', header: 'MRP' },
                { fields: 'qty', header: 'Quantity' },
                { fields: 'amount', header: 'Amount' },
                { fields: 'overalldiscount', header: 'Discount' },
                { fields: 'grandtotal', header: 'Grand Total' }
            ];
        }
        else if (type === 'PURCHASE') {
            this.columns = [
                { fields: 'purchaseid', header: 'Purchase id' },
                { fields: 'purchasedate', header: 'Purchase Date' },
                { fields: 'invoiceno', header: 'Invoice No' },
                { fields: 'invoicedate', header: 'Invoice Date' },
                { fields: 'category', header: 'Category', widthClass: 'fixed-category-col' },
                { fields: 'item', header: 'Item', widthClass: 'fixed-item-col' },
                { fields: 'uom', header: 'UOM' },
                { fields: 'status', header: 'Status' },
                { fields: 'costprice', header: 'Cost Price' },
                { fields: 'qty', header: 'Quantity' },
                { fields: 'amount', header: 'Amount' },
                { fields: 'grandtotal', header: 'Grand Total' }
            ];
        }
        else if (type === 'DEBITNOTE') {
            this.columns = [
                { fields: 'debitnote', header: 'Debit Note' },
                { fields: 'creditnote', header: 'Credit Note' },
                { fields: 'repinvoiceno', header: 'Invoice No' },
                { fields: 'repinvoicedate', header: 'Invoice Date' },
                { fields: 'category', header: 'Category', widthClass: 'fixed-category-col' },
                { fields: 'item', header: 'Item', widthClass: 'fixed-item-col' },
                { fields: 'uom', header: 'UOM' },
                { fields: 'status', header: 'Status' },
                { fields: 'mrp', header: 'MRP' },
                { fields: 'qty', header: 'Quantity' },
                { fields: 'amount', header: 'Amount' },
                { fields: 'overalldiscount', header: 'Discount' },
                { fields: 'grandtotal', header: 'Grand Total' }
            ];
        }
        else {
            this.columns = [];
        }
    }
    
    ngOnInit(): void {
        this.reportForm = this.fb.group(
            {
                item: [{ value: '', disabled: true }],
                fromDate: [this.today, [Validators.required]],
                toDate: [this.today, [Validators.required]],
                category: [{ value: '', disabled: true }],
                reportType: ['', Validators.required],
            },
            { validators: this.dateRangeValidator }
        );

        this.gstTransaction = 'all';
        this.reportForm.get('category')?.disable();
        this.reportForm.get('item')?.disable();
        this.setTableColumns('');
        this.loadAllDropdowns();
        
        this.reportForm.get('reportType')?.valueChanges.subscribe(selected => {
            if (selected) {
                this.reportForm.get('category')?.enable();
                this.reportForm.get('item')?.enable();
              
                if (this.itemOptions.length === 0) {
                    this.OnGetItem();
                }
            } else {
                this.reportForm.get('category')?.disable();
                this.reportForm.get('item')?.disable();
                this.reportForm.patchValue({ category: null, item: null });
                this.showData = false;
                this.products = [];
                this.filteredProducts = [];
            }
        });
    }
    
    private resetGstTransaction(reportType: string) {
        if (reportType === 'SALE' || reportType === 'RETURN') {
            this.gstTransaction = 'all';
        }
        else if (reportType === 'DEBITNOTE') {
            this.gstTransaction = 'none';
        }
        else {
            this.gstTransaction = 'all';
        }
    }
    
    dateRangeValidator(form: FormGroup) {
        const fromDate = form.get('fromDate')?.value;
        const toDate = form.get('toDate')?.value;
        if (!fromDate || !toDate)
            return null;
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return to >= from ? null : { dateRangeInvalid: true };
    }
    
    Onreturndropdowndetails() {
        const category = this.reportForm.controls['category'].value;
        const item = this.reportForm.controls['item'].value;
        const reportType = this.reportForm.controls['reportType'].value;
        const fromDate = this.reportForm.controls['fromDate'].value;
        const toDate = this.reportForm.controls['toDate'].value;
        const gstType = this.gstTransaction;
        
        // Validate required fields
        if (!reportType) {
            this.errorSuccess('Please select a Report Type.');
            return;
        }
        
        if (!fromDate || !toDate) {
            this.errorSuccess('Please select From Date and To Date.');
            return;
        }
        
        // Validate date range
        const from = new Date(fromDate);
        const to = new Date(toDate);
        if (to < from) {
            this.errorSuccess('To Date must be greater than or equal to From Date.');
            return;
        }
        
        const payload = {
            uname: 'admin',
            p_categoryid: String(category) || null,
            p_itemid: String(item) || null,
            p_fromdate: this.datepipe.transform(fromDate, 'yyyy/MM/dd'),
            p_todate: this.datepipe.transform(toDate, 'yyyy/MM/dd'),
            p_username: 'admin',
            p_gsttran: ((reportType === 'DEBITNOTE') ? (gstType === 'none' ? null : gstType) : (gstType === 'all' ? null : gstType)),
            p_reporttype: reportType || 'SALE',
            clientcode: 'CG01-SE',
            'x-access-token': this.authService.getToken()
        };
        
        this.setTableColumns(reportType);
        this.showData = false; // Hide previous data while loading
        
        this.inventoryService.gettransactionreportdetail(payload).subscribe({
            next: (res: any) => {
                console.log('API RESULT:', res.data);
                this.products = res?.data || [];
                this.filteredProducts = [...this.products];
                this.showData = true; // Show data after successful API call
                
                if (this.products.length == 0) {
                    let message = 'No Data Available for the selected filters';
                    this.showSuccess(message);
                }
            },
            error: (err) => {
                console.error(err);
                this.errorSuccess('Error loading data. Please try again.');
                this.showData = false;
            }
        });
    }
    
  
    
    onReportChange(event: any) {
        const reportType = event.value;
        if (reportType) {
            this.setTableColumns(reportType || '');
            this.resetGstTransaction(reportType);
        }
        
        if (!reportType) {
            this.products = [];
            this.filteredProducts = [];
            this.showData = false;
            this.reportForm.get('category')?.setValue(null);
            this.reportForm.get('item')?.setValue(null);
            this.reportForm.get('fromDate')?.setValue(this.today);
            this.reportForm.get('toDate')?.setValue(this.today);
            return;
        }
    }
    
    onCategoryItem(event: any) {
        const categoryId = event.value;
        this.reportForm.get('item')?.setValue(null);
        
        if (!categoryId) {
            this.OnGetItem();
            return;
        }
        
        this.categoryRelavantItem(categoryId);
    }
    
    categoryRelavantItem(id: any) {
        this.itemOptions = [];
        const payload = {
            uname: "admin",
            p_username: "admin",
            p_returntype: "CATEGORY",
            p_returnvalue: id.toString(),
            clientcode: "CG01-SE",
            "x-access-token": this.authService.getToken()
        };
        
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                if (!res.data || res.data.length === 0) {
                    this.itemOptions = [];
                    this.showSuccess('No items found for this category.');
                    return;
                }
                this.itemOptions = res.data;
            },
            error: (err) => {
                console.error(err);
            }
        });
    }
    
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
    }
    
    reset() {
        this.reportForm.reset({
            fromDate: new Date(),
            toDate: new Date()
        });
        this.filteredProducts = [];
        this.products = [];
        this.showData = false; 
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
            next: (res) => (this.itemOptions = res.data || []),
            error: (err) => console.log(err)
        });
    }
    
    OnGetCategory() {
        const payload = this.createDropdownPayload('CATEGORY');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.categoryOptions = res.data || []),
            error: (err) => console.log(err)
        });
    }
    
    loadAllDropdowns() {
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