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
import { ShareService } from '@/core/services/shared.service';
import { WorkService } from '@/core/services/work.service';

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
    approvalHistory: any[] = [];
    products: any[] = [];
    filteredProducts: any[] = [];
    logDetailsVisible = false;
    actionType: 'APPROVE' | 'REJECT' | 'SENDBACK' = 'REJECT';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        private datePipe: DatePipe,
        private confirmationService: ConfirmationService,
        private router: Router,
        private route: ActivatedRoute,
        private sharedService: ShareService,
        private workService: WorkService
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
        this.restoreViewState();
        this.loadAllDropdowns();
        if (this.approvalForm.get('p_type')?.value && !this.products.length) {
            this.onGetApprovalList();
        }
    }

    private restoreViewState(): void {
        const state = history.state?.returnViewState;
        if (!state) return;

        this.approvalForm.patchValue(state.formValue ?? {}, { emitEvent: false });
        this.products = state.products ?? [];
        this.filteredProducts = state.filteredProducts ?? [];
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

    get selectedTypeName(): string {
    const selectedType = this.approvalForm.get('p_type')?.value;
    return (this.typeOptions.find((type) => String(type.rule_id) === String(selectedType))?.rule_name || '').trim().toUpperCase();
}

get isVendorApproval(): boolean {
    return this.selectedTypeName === 'VENDOR APPROVAL';
}

get isPurchaseOrder(): boolean {
    return this.selectedTypeName === 'PURCHASE ORDER';
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
        let type = this.typeOptions.find(i=> i.rule_id === this.approvalForm.get('p_type')?.value);
        const payload = {
            p_username: this.authService.isLogIntType()?.companyid.toString(),
            p_returntype:  this.industryTypeId !== '3' ? (type.rule_name === 'Material Requisition' ? 'MYAPPROVALENTRYCONST_MR' : ( type.rule_name === 'Purchase Order' ? 'MYAPPROVALENTRYCONST_PO' : 'MYAPPROVALENTRYCONST_VC')) : 'MYAPPROVALENTRY',
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

    onViewMF(row: any): void {
    if (this.selectedTypeName === 'PURCHASE ORDER') {
        const poId = row?.po_id;
        if (!poId) return;

        this.sharedService.setReturnView({
            route: ['/layout/action/my-approval'],
            queryParams: {
                p_type: this.approvalForm.get('p_type')?.value ?? '',
                p_request: this.approvalForm.get('p_request')?.value ?? 'PENDING'
            },
            state: {
                returnViewState: {
                    formValue: this.approvalForm.getRawValue(),
                    products: this.products,
                    filteredProducts: this.filteredProducts
                }
            }
        });
        this.router.navigate(['/layout/purchase/purchase-order'], {
            queryParams: { poId, fromApprovalView: true }
        });
        return;
    }

    if (this.isVendorApproval) {
        const comparisonId = row?.comparison_id ?? row?.comparisondraft_id ?? row?.comparison_no;
        if (!comparisonId) return;

        this.sharedService.setReturnView({
            route: ['/layout/action/my-approval'],
            queryParams: {
                p_type: this.approvalForm.get('p_type')?.value ?? '',
                p_request: this.approvalForm.get('p_request')?.value ?? 'PENDING'
            },
            state: {
                returnViewState: {
                    formValue: this.approvalForm.getRawValue(),
                    products: this.products,
                    filteredProducts: this.filteredProducts
                }
            }
        });
        this.router.navigate(['/layout/purchase/vendor-comparison'], {
            queryParams: {
                comparisonId,
                fromApprovalView: true,
                p_type: this.approvalForm.get('p_type')?.value,
                p_request: this.approvalForm.get('p_request')?.value
            }
        });
        return;
    }

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

    isApprovalActionDisabled(row: any): boolean {
        const status = String(row?.status ?? '').trim().toUpperCase();
        return status !== 'PENDING' || ['APPROVED', 'REJECTED', 'SENDBACK'].includes(status);
    }

    log(row: any): void {
        this.logForm.patchValue({
            mfNo: this.isVendorApproval ? row?.comparison_no : ( this.isPurchaseOrder ? row?.po_no : row?.mf_no ),
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
    this.selectedRow = row;
    this.actionType = 'APPROVE';
    this.rejectComment = '';
    this.submitted = false;
    this.rejectiondetails = true;    
}

reject(row: any) {
    this.selectedRow = row;
    this.actionType = 'REJECT';
    this.rejectComment = '';
    this.submitted = false;
    this.rejectiondetails = true;
}

sendBack(row: any) {
    this.selectedRow = row;
    this.actionType = 'SENDBACK';
    this.rejectComment = '';
    this.submitted = false;
    this.rejectiondetails = true;
}

get isCommentMandatory(): boolean {
    return this.actionType !== 'APPROVE';
}

get rejectDialogHeader(): string {
    switch (this.actionType) {
        case 'APPROVE': return 'Approve';
        case 'SENDBACK': return 'Send Back';
        default: return 'Reject';
    }
}

get actionCommentLabel(): string {
    return this.isCommentMandatory ? 'Comment *' : 'Comment (optional)';
}

get actionPromptText(): string {
    switch (this.actionType) {
        case 'APPROVE': return 'Add a comment:';
        case 'SENDBACK': return 'Please provide a reason for sending back:';
        default: return 'Please provide a reason for rejection:';
    }
}

get submitButtonLabel(): string {
    switch (this.actionType) {
        case 'APPROVE': return 'Approve';
        case 'SENDBACK': return 'Send Back';
        default: return 'Reject';
    }
}

get submitButtonClass(): string {
    switch (this.actionType) {
        case 'APPROVE': return 'p-button-success';
        case 'SENDBACK': return 'p-button-warning';
        default: return 'p-button-danger';
    }
}

get isSubmitDisabled(): boolean {
    return this.isCommentMandatory && (!this.rejectComment || this.rejectComment.trim().length === 0);
}

 submitReject() {
    if (this.isCommentMandatory && (!this.rejectComment || this.rejectComment.trim().length === 0)) {
        this.submitted = true;
        return;
    }
    if (!this.selectedRow) {
        console.error('No row selected');
        return;
    }

    const actionMap = { APPROVE: 'APPROVE', REJECT: 'REJECT', SENDBACK: 'SENDBACK' };
    const selectedRowCopy = { ...this.selectedRow };
    const currentAction = this.actionType;
    const isPo = this.isPurchaseOrder;

    const payload = {
        p_request_id: this.selectedRow.request_id,
        p_user_id: this.authService.isLogIntType()?.userid,
        p_usertype_id: this.authService.isLogIntType()?.usertypeid,
        p_action: actionMap[this.actionType],
        p_remarks: this.rejectComment || ''
    };

    this.inventoryService.approverequest(payload).subscribe({
        next: (res) => {
            this.showSuccess(res.data.msg);
            if (currentAction === 'APPROVE' && isPo) {
                this.sendPOMailAfterApproval(selectedRowCopy?.po_id);
            }
            this.onGetApprovalList();
        }
    });

    this.rejectiondetails = false;
    this.rejectComment = '';
    this.submitted = false;
}

    private sendPOMailAfterApproval(poId: number | string | null | undefined): void {
        if (!poId) return;

        const payload = {
            p_returntype: 'GETPOMAIL',
            p_returnvalue: poId.toString(),
            p_username: this.authService.isLogIntType()?.companyid?.toString() ?? ''
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                const rows: any[] = Array.isArray(res?.data) ? res.data : [];
                const readyRows = rows.filter((row) => row.vendor_email ?? row.supplieremail);
                const missingEmail = rows.filter((row) => !(row.vendor_email ?? row.supplieremail));

                if (!readyRows.length) {
                    this.messageService.add({ severity: 'warn', summary: 'No vendor emails found', life: 2500 });
                    return;
                }

                const mailPayload = {
                    p_rfqid: Number(poId),
                    p_username: this.authService.isLogIntType()?.userid?.toString(),
                    p_mails: readyRows.map((row) => ({
                        vendorId: row.vendorid ?? row.supplierid ?? null,
                        email: row.vendor_email ?? row.supplieremail,
                        ccEmail: row.cc_email ?? null,
                        bccEmail: row.bcc_email ?? null,
                        subject: row.mail_subject ?? '',
                        body: `${row.mail_body1 ?? ''}${row.mail_body2 ?? ''}${row.body_table ?? ''}`,
                        attachmentPath: row.attachment_path ?? null,
                        mailLogId: row.mail_log_id ?? null
                    }))
                };

                this.workService.sendVendorMail(mailPayload).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'PO emails sent',
                            detail: `Purchase order email sent to ${readyRows.length} vendor(s).`,
                            life: 2500
                        });
                        if (missingEmail.length) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Some vendors skipped',
                                detail: `${missingEmail.map((row) => row.suppliername).join(', ')} has no email on file.`,
                                life: 3000
                            });
                        }
                    },
                    error: (err: any) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Mail send failed',
                            detail: err?.error?.error ?? err?.message ?? 'Failed to send PO email',
                            life: 2500
                        });
                    }
                });
            },
            error: (err: any) => {
                console.error('Error fetching PO mail data:', err);
                this.messageService.add({ severity: 'error', summary: 'Vendor mail data load failed', life: 2500 });
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
