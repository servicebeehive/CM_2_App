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
    filteredProducts: any[] = [];
    
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
        if (!type && type === '') {
             this.columns=[];
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
        const formatDate=(dateValue:any): string =>{
            if(!dateValue)
                return '';
            if(typeof dateValue ==='string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)){
                return dateValue;
            }
            try{
                const date=new Date(dateValue);
                if (!isNaN(date.getTime())) {
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }
        } catch {}
            return dateValue;
        };
         if (type === 'SALE' || type === 'REPLACE') {
            this.columns = [
                { fields: 'invoiceno', header: 'Invoice No' },
                { fields: 'invoicedate', header: 'Invoice Date',formatter:formatDate },
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
        else if (type === 'RETURN' ) {
            this.columns = [
                { fields: 'returninvoiceno', header: 'Invoice No' },
                { fields: 'returninvoicedate', header: 'Invoice Date',formatter:formatDate },
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
                { fields: 'purchasedate', header: 'Purchase Date',formatter:formatDate },
                { fields: 'invoiceno', header: 'Invoice No' },
                { fields: 'invoicedate', header: 'Invoice Date',formatter:formatDate },
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
                { fields:'suppliername', header:'Supplier Name'},
                { fields: 'debitnote', header: 'Debit Note' },
                { fields: 'creditnote', header: 'Credit Note' },
                { fields: 'repinvoiceno', header: 'Invoice No' },
                { fields: 'repinvoicedate', header: 'Invoice Date',formatter:formatDate },
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
        
         const categoryValue = category ? category.toString() : null;
    const itemValue = item ? item.toString() : null;
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
             
            p_category: categoryValue,
            p_item: itemValue,
            p_fromdate: this.datepipe.transform(fromDate, 'yyyy/MM/dd'),
            p_todate: this.datepipe.transform(toDate, 'yyyy/MM/dd'),
            p_username: 'admin',
            p_gsttran: ((reportType === 'DEBITNOTE') ? (gstType === 'none' ? null : gstType) : (gstType === 'all' ? null : gstType)),
            p_reporttype: reportType || 'SALE',
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
        console.log('ans:',reportType);
        if (reportType) {
            this.setTableColumns(reportType || '');
            this.resetGstTransaction(reportType);
             this.filteredProducts = [];
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
             
            p_username: "admin",
            p_returntype: "CATEGORY",
            p_returnvalue: id.toString(),
            
             
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
             
            p_username: 'admin',
            p_returntype: returnType,
                
                  
        };
    }
    
    OnGetItem() {
        const payload = this.createDropdownPayload('ITEMALL');
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
    downloadExcel() {
    if (!this.filteredProducts || this.filteredProducts.length === 0) {
        this.errorSuccess('No data available to download.');
        return;
    }

    // Generate CSV content
    const csvContent = this.generateCSV();
    
    // Create and trigger download
    this.downloadFile(csvContent, 'text/csv;charset=utf-8;', '.csv');
    
    this.showSuccess('Excel file downloaded successfully!');
}

private generateCSV(): string {
    // Create header row
    const headers = this.columns.map(col => this.escapeCSV(col.header));
    const headerRow = headers.join(',');
    
    // Create data rows
    const dataRows = this.filteredProducts.map(item => {
        const row = this.columns.map(col => {
            const value = item[col.fields];
            const formattedValue = col.formatter ? col.formatter(value) : value;
            return this.escapeCSV(formattedValue);
        });
        return row.join(',');
    });
    
    // Combine header and data rows
    return [headerRow, ...dataRows].join('\n');
}

private escapeCSV(value: any): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    
    const stringValue = String(value);
    
    // Escape double quotes
    const escapedValue = stringValue.replace(/"/g, '""');
    
    // Wrap in quotes if contains comma, double quote, or newline
    if (/[,"\n\r]/.test(escapedValue)) {
        return `"${escapedValue}"`;
    }
    
    return escapedValue;
}

private downloadFile(data: string, mimeType: string, extension: string) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = this.generateFileName() + extension;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
}

private generateFileName(): string {
    const reportType = this.reportForm.get('reportType')?.value || 'Transaction';
    const fromDate = this.reportForm.get('fromDate')?.value;
    const toDate = this.reportForm.get('toDate')?.value;
    
    let fileName = `${reportType}_Report`;
    
    if (fromDate && toDate) {
        const fromStr = this.datepipe.transform(fromDate, 'yyyy-MM-dd');
        const toStr = this.datepipe.transform(toDate, 'yyyy-MM-dd');
        fileName += `_${fromStr}_to_${toStr}`;
    }
    
    return fileName;
}

onDownloadClick() {
    // Check if form is valid
    if (this.reportForm.invalid) {
        this.errorSuccess('Please fill all required fields before downloading.');
        return;
    }
    
    // Check if we have data
    if (!this.filteredProducts || this.filteredProducts.length === 0) {
        if (!this.showData) {
            this.errorSuccess('Please click "Display" first to load data before downloading.');
            return;
        } else {
            this.errorSuccess('No data available to download.');
            return;
        }
    }
    
    this.downloadExcel();
}
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
} 