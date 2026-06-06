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
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { Tag } from 'primeng/tag';
import * as XLSX from 'xlsx';

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
        CheckboxModule,
        Card,
        Divider,
        Tag
    ],
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
    rejectiondetails: boolean = false;
    showData: boolean = false;
    rejectComment: string = '';
    submitted: boolean = false;

    typeOptions: any[] = [];
    requestOptions: any[] = [
        { fieldid: 'APPROVED', fieldname: 'APPROVED' },
        { fieldid: 'PENDING', fieldname: 'PENDING' },
        { fieldid: 'REJECTED', fieldname: 'REJECTED' }
    ];

    products: any[] = [];
    filteredProducts: any[] = [];
    columns: any[] = [];

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
            p_type: [null],
            p_request: ['PENDING']
        });
        this.loadAllDropdowns();
    }

    blockMinus(event: KeyboardEvent) {
        console.log(event);
        if (event.key === '-' || event.key === 'Minus' || event.key === 'e' || event.key === 'E') {
            event.preventDefault();
        }
    }

    display() {
        this.applyFilter();
    }

    applyFilter() {
        const selectedRequest = this.customerForm.get('p_request')?.value;
        const selectedType = this.customerForm.get('p_type')?.value;
        this.filteredProducts = this.products.filter((row) => {
            const matchRequest = selectedRequest ? row.status === selectedRequest : true;
            const matchType = selectedType ? row.request_type === selectedType : true;
            return matchRequest && matchType;
        });
    }

    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
    }

    reset() {
        this.customerForm.reset({
            p_type: null,
            p_request: 'PENDING'
        });
        this.filteredProducts = [...this.products];
        this.showData = false;
        this.selectedRow = null;
    }

    createDropdownPayload(returnType: string) {
        return {
            p_username: 'admin',
            p_returntype: returnType
        };
    }

    OnGetType() {
        const payload = this.createDropdownPayload('RULENAME');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.typeOptions = res.data),
            error: (err) => console.log(err)
        });
    }

    loadAllDropdowns() {
        this.OnGetType();
        this.onGetApprovalList();
    }

    onGetApprovalList() {
        const payload = {
            p_username: this.authService.isLogIntType()?.userid.toString(),
            p_returntype: 'MYAPPROVALENTRY',
            p_returnvalue: this.authService.isLogIntType()?.usertypeid.toString()
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                if (res.data && res.data.length > 0) {
                    this.products = res.data;
                    this.applyFilter();
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'No Data',
                        detail: 'Approval data not found'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load data'
                });
            }
        });
    }

    downloadExcel() {
        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            this.errorSuccess('No data available to download.');
            return;
        }

        const excelData = this.filteredProducts.map((item) => ({
            'Req Id': item.request_id,
            'Invoice No': item.invoice_no,
            Type: item.request_type,
            Requester: item.customer_name,
            Mobile: '',
            Date: this.datePipe.transform(item.request_date, 'dd/MM/yyyy') || '',
            Amount: item.amount,
            Status: item.status
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Approval List');

        const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd_HH-mm');
        const fileName = `Approval_Report_${currentDate}.xlsx`;

        XLSX.writeFile(wb, fileName);

        this.showSuccess('Excel file downloaded successfully!');
    }

    onDownloadClick() {
        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            this.errorSuccess('No data available to download.');
            return;
        }
        this.downloadExcel();
    }

onViewPO(poValue: string): void {
    if (!poValue) return;
    // Add your view/navigation logic here
    console.log('View PO:', poValue);
}

onViewMF(mfValue: string): void {
    if (!mfValue) return;
    // Add your view/navigation logic here
    console.log('View MF:', mfValue);
}


    approved(row: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to approve the request?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                const payload = {
                    p_request_id: row.request_id,
                    p_user_id: this.authService.isLogIntType().userid,
                    p_usertype_id: this.authService.isLogIntType().usertypeid,
                    p_action: 'APPROVE',
                    p_remarks: ''
                };

                this.inventoryService.approverequest(payload).subscribe({
                    next: (res) => {
                        this.showSuccess(res.data.msg);
                        this.onGetApprovalList();
                    }
                });
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

    reject(event: any) {
        this.selectedRow = event;
        this.rejectiondetails = true;
        if (this.rejectComment === '') {
            this.submitted = false;
        } else {
            this.submitted = true;
        }
    }

    submitReject() {
        if (!this.rejectComment || this.rejectComment.trim().length === 0) {
            return;
        }
        if (!this.selectedRow) {
            console.error('No row selected');
            return;
        }
        const payload = {
            p_request_id: this.selectedRow.request_id,
            p_user_id: this.authService.isLogIntType()?.userid,
            p_usertype_id: this.authService.isLogIntType()?.usertypeid,
            p_action: 'REJECT',
            p_remarks: this.rejectComment
        };

        this.inventoryService.approverequest(payload).subscribe({
            next: (res) => {
                this.showSuccess(res.data.msg);
                this.onGetApprovalList();
            }
        });
        this.rejectiondetails = false;
        console.log('Submitted:', this.rejectComment);
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
