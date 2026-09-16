import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';

import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';

interface TransferItem {
    itemname: string;
    uom: string;
    qty: number;
    remarks?: string;
}

interface Transfer {
    transferno: string;
    transferdate: string;
    fromsite: string;
    tosite: string;
    status: 'WITHDRAW' | 'DEPOSIT';
    remarks?: string;
    items: TransferItem[];
}

@Component({
    selector: 'app-material-transfer',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule],
    templateUrl: './material-transfer.component.html',
    styleUrl: './material-transfer.component.scss',
    providers: [DatePipe]
})
export class MaterialTransferComponent implements OnInit {

    filterForm!: FormGroup;
    transferList: Transfer[] = [];
    selectedTransfer: Transfer | null = null;

    siteOptions: { site_id: number; site_name: string }[] = [];
    statusOptions = [
        { label: 'Transfer Initiated' },
        { label: 'Transfer InTransit' },
        { label: "Transfer Received" }
    ];

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadSites();
        this.onSearch();
    }

    private initForm(): void {
        this.filterForm = this.fb.group({
            p_transferno: [''],
            p_fromsite: [null],
            p_tosite: [null],
            p_status: [null]
        });
    }

    private loadSites(): void {
        const payload = { p_returntype: 'ACTIVEPROJECT', p_username: this.authService.isLogIntType().companyid.toString() };
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res: any) => (this.siteOptions = res.data ?? []),
            error: (err) => console.error(err)
        });
    }

    onSearch(): void {
        const v = this.filterForm.value;
        const payload = {
            p_transferno: v.p_transferno || null,
            p_fromsite: v.p_fromsite || null,
            p_tosite: v.p_tosite || null,
            p_status: v.p_status || null
        };

        // Replace with your real transfer-list API call
        this.inventoryService.getdropdowndetails({ p_returntype: 'TRANSFERLIST', ...payload }).subscribe({
            next: (res: any) => (this.transferList = res.data ?? []),
            error: (err) => console.error(err)
        });
    }

    newTransfer(): void {
       this.router.navigate(['/layout/issue-item/create-material-transfer']);
    }

    onViewTransfer(row: Transfer): void {
        // Replace with your real transfer-detail API call
        this.inventoryService.getdropdowndetails({ p_returntype: 'TRANSFERDETAIL', p_returnvalue: row.transferno }).subscribe({
            next: (res: any) => (this.selectedTransfer = res.data?.[0] ?? row),
            error: (err) => console.error(err)
        });
    }

    onMarkReceived(transfer: Transfer): void {
        this.inventoryService.getdropdowndetails({ p_returntype: 'MARKRECEIVED', p_returnvalue: transfer.transferno }).subscribe({
            next: () => {
                transfer.status = 'DEPOSIT';
                this.messageService.add({ severity: 'success', summary: 'Received', detail: `${transfer.transferno} marked as received.`, life: 3000 });
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Unable to update transfer status.', life: 3000 });
            }
        });
    }
}