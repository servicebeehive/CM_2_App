import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';


@Component({
    selector: 'app-material-transfer',
    standalone: true,
    imports: [CommonModule, ButtonModule, InputTextModule, TableModule, ConfirmDialogModule, TooltipModule],
    templateUrl: './material-transfer.component.html',
    styleUrl: './material-transfer.component.scss',
    providers: [DatePipe, ConfirmationService, MessageService]
})
export class MaterialTransferComponent implements OnInit {

    @ViewChildren('filterInput') filterInputs!: QueryList<ElementRef<HTMLInputElement>>;

    transferList: any[] = [];
    transactionType: 'transfer' | 'indent' | 'issue' | 'return' | 'requisition' | 'grn' | 'miscPurchase' | 'purchaseOrder' = 'transfer';
    pageTitle = 'Material Transfer';
    newButtonLabel = 'New Transfer';
    columns: { field: string; header: string; fields?: readonly string[] }[] = [];
    private readonly configurations = {
        transfer: {
            listType: 'TRANSFERLIST',
            idFields: ['transfer_id', 'transferid', 'id'],
            numberFields: ['transfer_no', 'transferno'],
            formRoute: '/layout/issue-item/create-material-transfer',
            idQuery: 'transferId',
            title: 'Material Transfer',
            newLabel: 'New Transfer',
            columns: [
                { field: 'transfer_no', header: 'Transfer No' },
                { field: 'transfer_date', header: 'Transfer Date' },
                { field: 'from_project_name', header: 'From Site' },
                { field: 'to_project_name', header: 'To Site' },
                { field: 'status', header: 'Status' }
            ]
        },
        indent: {
            listType: 'INDENTLIST', 
            idFields: ['indent_id', 'id'],
            numberFields: ['indent_no'],
            formRoute: '/layout/issue-item/create-material-indent',
            idQuery: 'indentId',
            title: 'Material Indent',
            newLabel: 'New Indent',
            columns: [
                { field: 'indent_no', header: 'Indent No' },
                { field: 'indent_date', header: 'Indent Date'},
                { field: 'project_name', header: 'Site' },
                { field: 'requested_by_name', header: 'Requested By' },
                { field: 'status', header: 'Status' }
            ]
        },
        issue: {
            listType: 'MINTABLELIST',
            idFields: ['min_id', 'id'],
            numberFields: ['min_id'],
            formRoute: '/layout/issue-item/create-material-issue',
            idQuery: 'minId',
            title: 'Material Issue',
            newLabel: 'New Issue',
            columns: [
                { field: 'min_no', header: 'MIN No'},
                { field: 'issue_date', header: 'Issue Date'},
                { field: 'project_name', header: 'Site' },
                { field: 'issued_by_name', header: 'Requested By'},
                { field: 'status', header: 'Status' }
            ]
        },
        return: {
            listType: 'MRNTABLELIST',
            idFields: ['mrn_id', 'return_id', 'id'],
            numberFields: ['mrn_no', 'return_no'],
            formRoute: '/layout/issue-item/create-material-return',
            idQuery: 'mrnId',
            title: 'Material Return',
            newLabel: 'New Return',
            columns: [
                { field: 'mrn_no', header: 'MRN No' },
                { field: 'return_date', header: 'Return Date' },
                { field: 'project_name', header: 'Site' },
                { field: 'returned_by_name', header: 'Return By', fields: ['returned_by_name', 'return_by_name'] },
                { field: 'status', header: 'Status' }
            ]
        },
        requisition: {
            listType: 'MRTABLELIST',
            idFields: ['mf_id', 'id'], formRoute: '/layout/purchase/material-requisition', idQuery: 'mfNo',
            title: 'Material Requisition', newLabel: 'New Requisition',
            columns: [
                { field: 'mf_no', header: 'MR No' }, { field: 'mr_date', header: 'MR Date' },
                { field: 'project_name', header: 'Site' }, { field: 'tower_name', header: 'Tower' },
                { field: 'requested_by_name', header: 'Requested By' }, { field: 'status', header: 'Status' }
            ]
        },
        grn: {
            listType: 'GRNLIST',
            idFields: ['grn_id', 'id'], formRoute: '/layout/inventory/grn', idQuery: 'grnId',
            title: 'GRN', newLabel: 'New GRN',
            columns: [
                { field: 'grn_no', header: 'GRN No' }, { field: 'grn_date', header: 'GRN Date' },
                { field: 'po_no', header: 'PO No' }, { field: 'project_name', header: 'Site' },
                { field: 'suppliername', header: 'Vendor' }, { field: 'status', header: 'Status' }
            ]
        },
        miscPurchase: {
            listType: 'MISCPURLIST',
            idFields: ['misc_purchase_id', 'id'], formRoute: '/layout/purchase/mics-purchase', idQuery: 'miscPurchaseId',
            title: 'Misc Purchase', newLabel: 'New Misc Purchase',
            columns: [
                { field: 'misc_purchase_no', header: 'Purchase No' }, { field: 'purchase_date', header: 'Purchase Date' },
                { field: 'project_name', header: 'Site' }, { field: 'vendor_name', header: 'Vendor' },
                { field: 'total_amount', header: 'Total Amount' }, { field: 'status', header: 'Status' }
            ]
        },
        purchaseOrder: {
            listType: 'POLIST',
            idFields: ['po_id', 'id'], formRoute: '/layout/purchase/purchase-order', idQuery: 'poId',
            title: 'Purchase Order', newLabel: 'New Purchase Order',
            columns: [
                { field: 'po_no', header: 'PO No' }, { field: 'po_date', header: 'PO Date' },
                { field: 'project_name', header: 'Site' }, { field: 'suppliername', header: 'Vendor' },
                { field: 'delivery_date', header: 'Delivery Date' }, { field: 'status', header: 'Status' }
            ]
        }
    } as const;

    constructor(
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.transactionType = this.route.snapshot.data['transactionType'] ?? 'transfer';
        const config = this.configurations[this.transactionType];
        this.pageTitle = config.title;
        this.newButtonLabel = config.newLabel;
        this.columns = [...config.columns];
        this.onGetTransferList();
    }

    onGetTransferList(): void {
        const config = this.configurations[this.transactionType];
        const payload = { p_returntype: config.listType, p_returnvalue: this.authService.isLogIntType().companyid.toString(), p_username: this.authService.isLogIntType().userid.toString() };
        const request = this.inventoryService.Getreturndropdowndetails(payload);
        request.subscribe({
            next: (res: any) => {
                this.transferList = res.data ?? [];
            },
            error: (err) => console.error(err)
        });
    }

    newTransfer(): void {
         this.router.navigate([this.configurations[this.transactionType].formRoute], { queryParams: { fromTransactionList: true } });
    }

    onViewTransfer(row: any): void {
        const config = this.configurations[this.transactionType];
        const id = config.idFields.map((field) => row[field]).find((value) => value != null);
        const queryParams: Record<string, any> = { [config.idQuery]: id, fromTransactionList: true };
        if (this.transactionType === 'requisition') {
            queryParams['mfId'] = row.mf_id ?? id;
            queryParams['mfNo'] = row.mf_no ?? null;
        }
        this.router.navigate([config.formRoute], {
            queryParams
        });
    }

    value(row: any, column: { field: string; fields?: readonly string[] }): any {
        const fields = column.fields ?? [column.field];
        return fields.map((field) => row[field]).find((value) => value != null && value !== '') ?? '-';
    }

    isDateField(field: string): boolean {
        return field.endsWith('_date');
    }

    statusClass(status: any): string {
        const normalized = String(status ?? '').toUpperCase().replace(/\s+/g, '_');
        if (['APPROVED', 'SUBMITTED', 'SUBMIT', 'RECEIVED', 'TRANSFER_RECEIVED', 'DEPOSIT', 'FULLY_RECEIVED'].includes(normalized)) return 'status-success';
        if (['REJECTED', 'CANCELLED'].includes(normalized)) return 'status-danger';
        if (['DRAFT', 'TRANSFER_REQUESTED', 'PENDING', 'APPROVAL_PENDING'].includes(normalized)) return 'status-warning';
        return 'status-neutral';
    }

    resetTable(table: any): void {
        table.reset();
        this.filterInputs.forEach((input) => (input.nativeElement.value = ''));
    }

    trackByField(_index: number, column: { field: string }): string {
        return column.field;
    }
    onDeleteTransfer(row: any): void {
        this.confirmationService.confirm({
            message: `Do you want to delete Draft ${row.transfer_no}? This cannot be undone.`,
            header: 'Confirm Delete',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.inventoryService.Getreturndropdowndetails({ p_returntype: 'DELETETRANSFER', p_returnvalue: row.transfer_no }).subscribe({
                    next: () => {
                        this.transferList = this.transferList.filter(t => t.transfer_no !== row.transfer_no);
                        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${row.transfer_no} removed.`, life: 3000 });
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to delete transfer.', life: 3000 });
                    }
                });
            }
        });
    }
}