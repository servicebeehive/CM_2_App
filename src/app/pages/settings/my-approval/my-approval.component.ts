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
import { Card } from "primeng/card";
import { Divider } from "primeng/divider";
import { Tag } from "primeng/tag";

@Component({
    selector: 'app-my-approval',
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
    CheckboxModule, Card, Divider, Tag],
    templateUrl: './my-approval.component.html',
    styleUrl: './my-approval.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class MyApprovalComponent {
    customerForm!: FormGroup;
    visibleDialog = false;
    selectedRow: any = null;
    selection: boolean = true;
    first: number = 0;
    rowsPerPage: number = 5;
    globalFilter: string = '';
    viewdetails: boolean = false;
    rejectiondetails: boolean = false;
    showData: boolean = false;
   rejectComment: string = '';
   submitted: boolean = false;


    typeOptions = [
        { fieldid: 'bankcharge', fieldname: 'Bank Charge' },
        { fieldid: 'paytmcharge', fieldname: 'Paytm Charge' },
        { fieldid: 'writeoff', fieldname: 'Write Off' }
    ];
    requestOptions = [
        { fieldid: 'all', fieldname: 'All' },
        { fieldid: 'approved', fieldname: 'Approved' },
        { fieldid: 'pending', fieldname: 'Pending' },
        { fieldid: 'rejected', fieldname: 'Rejected' }
    ];
    products: any[] = [];
    filteredProducts: any[] = [
      {
        id:'1005',
        type:'Write off',
        requester:'John',
        mobile:'9898989899',
        date:'10/05/2026',
        amount:'10000',
        status:'Pending'
      }
    ];
    columns: any[] = [];
    selectedRows: any[] = [];

    
    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        private datePipe: DatePipe,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.customerForm = this.fb.group({
            p_type: [new Date()],
            p_request: ['pending'],
        });
        this.setTableColumns();
        // this.loadAllDropdowns();
    }

    blockMinus(event: KeyboardEvent) {
        console.log(event);
        if (event.key === '-' || event.key === 'Minus' || event.key === 'e' || event.key === 'E') {
            event.preventDefault();
        }
    }

    Onreturndropdowndetails() {
        const fromdate = this.customerForm.controls['date'].value;
        const head = this.customerForm.controls['p_head'].value;

        const payload = {
            p_startdate: this.datePipe.transform(fromdate, 'yyyy/MM/dd'),
            p_customer: head || null,
            p_username: 'admin'
        };
        this.showData = false;
        this.inventoryService.getinvoicedetail(payload).subscribe({
            next: (res: any) => {
                console.log('API RESULT:', res.data);
                this.products = res?.data || [];
                this.filteredProducts = [...this.products];
                this.showData = true;
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
            curdate: new Date()
        });
    }

    // createDropdownPayload(returnType: string) {
    //     return {
    //         p_username: 'admin',
    //         p_returntype: returnType
    //     };
    // }

    // OnGetCustomer() {
    //     const payload = this.createDropdownPayload('CUSTOMER');
    //     this.inventoryService.getdropdowndetails(payload).subscribe({
    //         next: (res) => (this.cusMobNameOptions = res.data),
    //         error: (err) => console.log(err)
    //     });
    // }

    // loadAllDropdowns() {
    //     this.OnGetCustomer();
    // }

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
            { fields: 'curdate', header: 'Date', formatter: formatDate },
            { fields: 'head', header: 'Head' },
            { fields: 'categoryname', header: 'Amount' },
            { fields: 'currentstock', header: 'Status' },
            { fields: 'uomname', header: 'Reason' }
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
        const reportType = this.customerForm.get('curdate')?.value;
        const category = this.customerForm.get('category')?.value;
        const item = this.customerForm.get('item')?.value;
        const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd_HH-mm');

        let fileName = `${reportType}_Report_${currentDate}`;

        if (category) {
            fileName += `_Category_${category}`;
        }

        if (item) {
            fileName += `_Item_${item}`;
        }

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

    view(id: number) {
        console.log(id);
        this.viewdetails=true;
        const payload = {
            p_username: 'admin',
            p_returntype: 'CHILDUOM',
            p_returnvalue: id.toString()
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                if (!res.data || res.data.length === 0) {
                    //  this.showError("No Child UOM Data Available");
                    return;
                }

                // this.childUOMList = res.data; // assign data
                // this.childUomDialog = true; // open popup
            },
            error: (err) => {
                // this.showError("Failed to load Child UOM Details");
                console.error(err);
            }
        });
    }

    approved(event: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to approve the request?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.showSuccess('Request Aprroved successfully!');
            }
        });
    }
approvalHistory = [
  {
    level: 'L1',
    approver: 'Manager',
    status: 'Approved',
    date: '19-Mar-2026',
    comment: 'Looks good.'
  },
  {
    level: 'L2',
    approver: 'Finance',
    status: 'Rejected',
    date: '20-Mar-2026',
    comment: 'Pricing is too low.'
  }
];

getSeverity(status: string) {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'danger';
    case 'Pending':
      return 'warning';
    default:
      return 'info';
  }
}
    reject(event: any) {
        this.rejectiondetails = true;
        if(this.rejectComment===''){
 this.submitted = false;
        }
        else{
 this.submitted = true;
        }
    }

   submitReject() {
  if (!this.rejectComment || this.rejectComment.trim().length === 0) {
    return;
  }
this.rejectiondetails=false;
  console.log('Submitted:', this.rejectComment);
}

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
