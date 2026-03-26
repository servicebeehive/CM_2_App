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

interface Customer {
    fieldid: number;
    fieldname: string;
    fieldvalue: string;
    customergstno: string;
}

@Component({
    selector: 'app-customer-due',
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
    templateUrl: './customer-due.component.html',
    styleUrl: './customer-due.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class CustomerDueComponent {
    customerForm!: FormGroup;
    visibleDialog = false;
    selectedRow: any = null;
    selection: boolean = true;
    first: number = 0;
    rowsPerPage: number = 5;
    globalFilter: string = '';
    showData: boolean = false;
    submitDisable: boolean = true;
    cusMobNameOptions: Customer[] = [];
    products: any[] = [];
    filteredProducts: any[] = [];
    columns: any[] = [];
    selectedRows: any[] = [];

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        private datePipe: DatePipe
    ) {}

    ngOnInit(): void {
        this.customerForm = this.fb.group({
            fromDate: [new Date()],
            toDate: [new Date()],
            p_cusname: [],
            totalDueAmount: []
        });
        this.setTableColumns();
        this.loadAllDropdowns();
    }

    blockMinus(event: KeyboardEvent) {
        console.log(event);
        if (event.key === '-' || event.key === 'Minus' || event.key === 'e' || event.key === 'E') {
            event.preventDefault();
        }
    }

    updatewriteoff(index: number, value: number) {
        if (this.products[index]) {
            this.products[index].write_off = value;
        }
    }

    validateWriteoffAmount(row: any) {
        const due = parseFloat(row.due_amount) || 0;
        const writeoff = parseFloat(row.write_off) || 0;
        if (writeoff > due) {
            row.amountError = true;
            this.submitDisable = true;
        } else {
            row.amountError = false;
            this.submitDisable = false;
        }
    }

    Onreturndropdowndetails() {
        const fromdate = this.customerForm.controls['fromDate'].value;
        const todate = this.customerForm.controls['toDate'].value;
        const cusName = this.customerForm.controls['p_cusname'].value;

        const payload = {
            p_startdate: this.datePipe.transform(fromdate, 'yyyy/MM/dd'),
            p_enddate: this.datePipe.transform(todate, 'yyyy/MM/dd'),
            p_customer: cusName || null,
            p_username: 'admin'
        };
        this.showData = false;
        this.inventoryService.getinvoicedetail(payload).subscribe({
            next: (res: any) => {
                console.log('API RESULT:', res.data);
                const data = res?.data || [];
                this.products = Object.values(
                    data.reduce((acc: any, item: any) => {
                        const key = item.customer;
                        if (!acc[key]) {
                            acc[key] = {
                                customer: item.customer,
                                customerphone: item.customerphone,
                                due_amount: 0
                            };
                        } 
                        acc[key].due_amount += Number(item.due_amount || 0);
                        return acc;
                    },{})
                ).filter((item:any)=> item.due_amount>0);
                this.filteredProducts = [...this.products];
                this.showData = true;
                this.totalDueAmount();
                if (this.products.length === 0) {
                    this.showSuccess('No Data Available for the selected filters.');
                }
            },
            error: (err) => {
                console.error(err);
                this.errorSuccess('Error loading data. Please try again.');
                this.showData = false;
            }
        });
    }

    totalDueAmount(): void {
        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            this.customerForm.get('totalDueAmount')?.setValue('0');
            return;
        }
        const totalSaleDue = this.filteredProducts.reduce((total, product) => {
            const dueAmount = Number(product.due_amount) || 0;
            return total + dueAmount;
        }, 0);
        const roundedTotal = Number(totalSaleDue.toFixed(2));

        this.customerForm.get('totalDueAmount')?.setValue(roundedTotal);
    }

    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
    }

    reset() {
        this.customerForm.reset();
        this.filteredProducts = [];
        this.products = [];
        this.showData = false;
        this.customerForm.reset({
            fromDate: new Date(),
            toDate: new Date()
        });
    }

    createDropdownPayload(returnType: string) {
        return {
            p_username: 'admin',
            p_returntype: returnType
        };
    }

    OnGetCustomer() {
        const payload = this.createDropdownPayload('CUSTOMER');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.cusMobNameOptions = res.data),
            error: (err) => console.log(err)
        });
    }

    loadAllDropdowns() {
        this.OnGetCustomer();
    }

    writeoff() {}

    private setTableColumns(): void {
        const formatDate = (dateValue: any): string => {
            if (!dateValue) return '';
            try {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
                }
            } catch {}
            return String(dateValue);
        };

        this.columns = [
            { fields: 'customer', header: 'Name' },
            { fields: 'customerphone', header: 'Mobile No' },
            { fields: 'due_amount', header: 'Due Amount' }
        ];
    }

    downloadExcel() {
        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            this.errorSuccess('No data available to download.');
            return;
        }
        const csvContent = this.generateCSV();
        this.downloadFile(csvContent, 'text/csv;charset=utf-8;', '.csv');

        this.showSuccess('Excel file downloaded successfully!');
    }

    private generateCSV(): string {
        const headers = this.columns.map((col) => this.escapeCSV(col.header));
        const headerRow = headers.join(',');

        // Create data rows
        const dataRows = this.filteredProducts.map((item) => {
            const row = this.columns.map((col) => {
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
        const escapedValue = stringValue.replace(/"/g, '""');
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
        const customer = this.customerForm.get('p_cusname')?.value;
        const customername = this.cusMobNameOptions.find((c) => c.fieldid === customer);
        console.log()
        let fileName = `${customername?.fieldname || 'Customer'}_Report`;
        return fileName;
    }
    onDownloadClick() {
        if (this.customerForm.invalid) {
            this.errorSuccess('Please fill all required fields before downloading.');
            return;
        }

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
