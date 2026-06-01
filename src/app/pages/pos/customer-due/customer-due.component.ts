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
import * as XLSX from 'xlsx';

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
    requestOptions: any[] = [
        { fieldid: 'APPROVED', fieldname: 'APPROVED' },
        { fieldid: 'PENDING', fieldname: 'PENDING' },
        { fieldid: 'REJECTED', fieldname: 'REJECTED' }
    ];
    selectedStatus: string = 'PENDING';

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

    onRequestChange(event: any) {
        const selectedRequest = event.value;
        if (selectedRequest) {
            this.filteredProducts = this.products.filter((i) => i.status === selectedRequest);
        } else {
            this.filteredProducts = [...this.products];
        }
        this.totalDueAmount();
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
        const username = this.authService.isLogIntType()?.username;
        const payload = {
            p_startdate: this.datePipe.transform(fromdate, 'yyyy/MM/dd'),
            p_enddate: this.datePipe.transform(todate, 'yyyy/MM/dd'),
            p_customer: cusName || null,
            p_username: username
        };
        this.showData = false;
        this.inventoryService.getinvoicedetail(payload).subscribe({
            next: (res: any) => {
                const data = res?.data || [];
                this.products = Object.values(
                    data.reduce((acc: any, item: any) => {
                        const key = item.customer;
                        if (!acc[key]) {
                            acc[key] = {
                                invoice_no: item.invoice_no,
                                customer: item.customer,
                                customerphone: item.customerphone,
                                due_amount: 0,
                                status: item.approvalstatus ?? null,
                                remarks:item.remarks,
                                transactions: []
                            };
                        }
                        acc[key].due_amount += Number(item.due_amount || 0);
                        if (item.approvalstatus) {
                            acc[key].status = item.approvalstatus;
                        }

                        acc[key].transactions.push({
                            transaction_id: item.transactionid,
                            due_amount: Number(item.due_amount || 0)
                        });
                        return acc;
                    }, {})
                ).filter((item: any) => item.due_amount > 0);

                this.filteredProducts = this.products.filter((i) => i.status === this.selectedStatus);

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
        this.customerForm.reset({
            fromDate: new Date(),
            toDate: new Date()
        });
        
        this.filteredProducts = [];
        this.products = [];
        this.showData = false;
    }

    createDropdownPayload(returnType: string) {
        const username = this.authService.isLogIntType()?.username;
        return {
            p_username: username,
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

    // 2. writeoff() — build payload and call API
    writeoff() {
        const rowsWithWriteOff = this.filteredProducts.filter((row) => row.write_off && parseFloat(row.write_off) > 0 && !row.amountError);

        if (rowsWithWriteOff.length === 0) {
            this.errorSuccess('Please enter a write-off amount for at least one customer.');
            return;
        }

        // Build flat transaction-level array
        const writeOffJson: { transaction_id: number; writeoff_amount: number }[] = [];

        for (const row of rowsWithWriteOff) {
            const totalDue = parseFloat(row.due_amount) || 0;
            const totalWriteOff = parseFloat(row.write_off) || 0;
            let remaining = totalWriteOff;

            // Distribute write-off across transactions proportionally
            for (let i = 0; i < row.transactions.length; i++) {
                const txn = row.transactions[i];
                const isLast = i === row.transactions.length - 1;

                let txnWriteOff: number;
                if (isLast) {
                    txnWriteOff = parseFloat(remaining.toFixed(2));
                } else {
                    txnWriteOff = parseFloat(((txn.due_amount / totalDue) * totalWriteOff).toFixed(2));
                    remaining -= txnWriteOff;
                }

                if (txnWriteOff > 0) {
                    writeOffJson.push({
                        transaction_id: txn.transaction_id,
                        writeoff_amount: txnWriteOff
                    });
                }
            }
        }
        const userid = this.authService.isLogIntType()?.userid.toString();
        const payload = {
            p_writeoff_json: writeOffJson,
            p_username: userid
        };

        this.inventoryService.updatewriteoffamount(payload).subscribe({
            next: (res: any) => {
                this.showSuccess(res.data.message);
                this.Onreturndropdowndetails(); 
                this.selectedStatus='PENDING';
                this.submitDisable = true;
            },
            error: (err) => {
                console.error(err);
                this.errorSuccess('Failed to update write-off. Please try again.');
            }
        });
    }

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
        this.generateXLSX();
        this.showSuccess('Excel file downloaded successfully!');
    }

private generateXLSX(): void {
    const rows = this.filteredProducts.map((item) => ({
        'Customer Name': item.customer ?? '',
        'Mobile No':     item.customerphone ?? '',
        'Due Amount':    Number(item.due_amount) || 0,
        'Status':        item.status ?? '',
        'Remarks':       item.remarks ?? ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch: Math.max(
            key.length,
            ...rows.map((r: any) => String(r[key] ?? '').length)
        ) + 2
    }));
    worksheet['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddr]) {
            worksheet[cellAddr].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: 'D9E1F2' } },
                alignment: { horizontal: 'center' }
            };
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Due');

    const fileName = this.generateFileName() + '.xlsx';
    XLSX.writeFile(workbook, fileName);
}

    private generateFileName(): string {
        const customer = this.customerForm.get('p_cusname')?.value;
        const customername = this.cusMobNameOptions.find((c) => c.fieldid === customer);
        console.log();
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
