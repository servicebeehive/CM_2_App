import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { InventoryService } from '@/core/services/inventory.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '@/core/services/auth.service';
import * as XLSX from 'xlsx';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-my-approval',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TextareaModule,
        TableModule,
        InputTextModule,
        FormsModule,
        ButtonModule,
        DropdownModule,
        MessageModule,
        DialogModule,
        ConfirmDialogModule
    ],
    templateUrl: './my-approval.component.html',
    styleUrl: './my-approval.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class MyApprovalComponent {
    approvalForm!: FormGroup;
    logForm!: FormGroup;
    selectedRow: any = null;
    rejectiondetails: boolean = false;
    rejectComment: string = '';
    submitted: boolean = false;
    industryTypeId: string = '';
    typeOptions: any[] = [];
    requestOptions: any[] = [
        { fieldid: 'APPROVED', fieldname: 'APPROVED' },
        { fieldid: 'PENDING', fieldname: 'PENDING' },
        { fieldid: 'REJECTED', fieldname: 'REJECTED' }
    ];

    products: any[] = [];
    filteredProducts: any[] = [];
    logDetailsVisible = false;

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        private datePipe: DatePipe,
        private confirmationService: ConfirmationService,
        private router:Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.industryTypeId = this.authService.isLogIntType()?.industry_type_id.toString() || '';
        this.approvalForm = this.fb.group({
            p_type: [null, Validators.required],
            p_request: ['PENDING']
        });
        this.logForm = this.fb.group({
            mfNo: [''],
            requestedBy: ['']
        });
        this.approvalForm.patchValue({
            p_type: this.route.snapshot.queryParamMap.get('p_type'),
            p_request: this.route.snapshot.queryParamMap.get('p_request') || 'PENDING'
        });
        this.loadAllDropdowns();
        if (this.approvalForm.get('p_type')?.value) {
            this.onGetApprovalList();
        }
    }

    blockMinus(event: KeyboardEvent) {
        console.log(event);
        if (event.key === '-' || event.key === 'Minus' || event.key === 'e' || event.key === 'E') {
            event.preventDefault();
        }
    }

    onTypeChange(): void {
        if (!this.approvalForm.get('p_type')?.value) {
            this.products = [];
            this.filteredProducts = [];
            return;
        }
        this.onGetApprovalList();
    }

    applyFilter() {
        const selectedRequest = this.approvalForm.get('p_request')?.value;
        const selectedType = this.approvalForm.get('p_type')?.value;
        if (!selectedType) {
            this.filteredProducts = [];
            return;
        }
        const selectedTypeName = this.typeOptions.find((type) => String(type.rule_id) === String(selectedType))?.rule_name;
        this.filteredProducts = this.products.filter((row) => {
            const matchRequest = selectedRequest ? row.status === selectedRequest : true;
            const matchType = selectedType ? row.request_type === (selectedTypeName || selectedType) : true;
            return matchRequest && matchType;
        });
    }

    reset() {
        this.approvalForm.reset({
            p_type: null,
            p_request: 'PENDING'
        });
        this.products = [];
        this.filteredProducts = [];
        this.selectedRow = null;
        this.logDetailsVisible = false;
    }

    createDropdownPayload(returnType: string) {
        return {
            p_username: this.industryTypeId,
            p_returntype: returnType
        };
    }

    OnGetType() {
        const payload = this.createDropdownPayload('RULENAME');
        this.inventoryService.getdropdowndetailsPublic(payload).subscribe({
            next: (res) => {
                this.typeOptions = (res.data || []).map((type: any) => ({
                    ...type,
                    rule_id: String(type.rule_id)
                }));
                if (this.products.length) this.applyFilter();
            },
            error: (err) => console.log(err)
        });
    }

    loadAllDropdowns() {
        this.OnGetType();
    }

    onGetApprovalList() {
        if (!this.approvalForm.get('p_type')?.value) {
            this.products = [];
            this.filteredProducts = [];
            return;
        }
        const payload = {
            p_username: this.authService.isLogIntType()?.companyid.toString(),
            p_returntype:  this.industryTypeId === '3' ? 'MYAPPROVALENTRY' : 'MYAPPROVALENTRYCONST_MR',
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
            Project : item.project_name,
            'MF No': item.mf_no,
            'Request Date': this.datePipe.transform(item.request_date, 'dd/MM/yyyy') || '',
            'Requested By': item.fullname,
            Level :  item.level_no,
            Status: item.status,
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

onViewMF(row: any): void {
    const mfNo = row?.mf_no ;
    if (!mfNo) return;

    this.router.navigate(['/layout/purchase/material-requisition'], {
        queryParams: {
            mfNo,
            fromApprovalView: true,
            p_type: this.approvalForm.get('p_type')?.value,
            p_request: this.approvalForm.get('p_request')?.value
        }
    });
}

    log(row: any): void {
        this.logForm.patchValue({
            mfNo: row?.mf_no,
            requestedBy: row?.fullname
        });

        const history = row?.approval_history ?? row?.history;
        this.approvalHistory = Array.isArray(history) && history.length
            ? history
            : [{
                  level: row?.level_no ?? '',
                  approvedBy: row?.approved_by ?? row?.approver ?? row?.fullname ?? '',
                  approvedOn: row?.approved_on ?? row?.approvedOn ?? row?.request_date ?? null,
                  status: row?.status ?? ''
              }];
        this.logDetailsVisible = true;
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
