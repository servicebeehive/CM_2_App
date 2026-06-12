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
@Component({
    selector: 'app-misc-charges',
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
    templateUrl: './misc-charges.component.html',
    styleUrl: './misc-charges.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class MiscChargesComponent {
    miscChargeForm!: FormGroup;
    visibleDialog = false;
    selectedRow: any = null;
    selection: boolean = true;
    first: number = 0;
    rowsPerPage: number = 5;
    globalFilter: string = '';
    showData: boolean = false;
    submitDisable: boolean = true;
    editmode: boolean = false;
    allProducts: any[] = [];
    headOptions:any[]=[
         { fieldid: 'Bank Charge', fieldname: 'Bank Charge' },
        { fieldid: 'Paytm Charge', fieldname: 'Paytm Charge' }
    ];
    requestOptions: any[] = [
        { fieldid: 'APPROVED', fieldname: 'APPROVED' },
        { fieldid: 'PENDING', fieldname: 'PENDING' },
        { fieldid: 'REJECTED', fieldname: 'REJECTED' }
    ];

    selectedCharge: any;
    filteredProducts: any[] = [];
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
        this.miscChargeForm = this.fb.group({
            curdate: [new Date()],
            p_head: [],
            p_amount: [null, [Validators.required, Validators.min(1)]],
            p_request: ['PENDING']
        });
       
        this.miscChargeForm.get('p_request')?.valueChanges.subscribe(status => {
        this.filteredProducts = status
            ? this.allProducts.filter(item => item.status === status)
            : [...this.allProducts];
    });

        console.log('request',this.miscChargeForm.get('p_request')?.value)
        this.onGetTransMics();
    }

    blockMinus(event: KeyboardEvent) {
        if (event.key === '-' || event.key === 'Minus' || event.key === 'e' || event.key === 'E') {
            event.preventDefault();
        }
    }

    private formatLocalDate(date: Date): string {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    createDropdownPayload(returnType: string) {
        return {
            p_username: 'admin',
            p_returntype: returnType
        };
    }

    onGetTransMics() {
        this.editmode = false;
        this.selectedCharge = null;
        const payload = this.createDropdownPayload('TRANMISC');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                this.allProducts = res.data;
                const status = this.miscChargeForm?.get('p_request')?.value;
                this.filteredProducts = status? this.allProducts.filter(item=> item.status === status) : [...this.allProducts];
            },
            error: (err) => console.log(err)
        });
    }

    onMiscEdit(data: any) {
        const username = this.authService.isLogIntType().userid.toString();
        const payload: any = {
            p_transaction_id: this.selectedCharge.transaction_id,
            p_transaction_date: data.curdate instanceof Date ? this.formatLocalDate(data.curdate) : data.curdate,
            p_head: data.p_head,
            p_amount: data.p_amount,
            p_username: username
        };
        this.inventoryService.upserttransactionmisc(payload).subscribe({
            next: (res) => {
                this.showSuccess(res.data.message);
                this.onGetTransMics();
                this.miscChargeForm.reset({
                    curdate: new Date(),
                    p_request: 'PENDING'
                });
            }
        });
    }

    onMiscChargeCreation(data: any) {
        const username = this.authService.isLogIntType().userid.toString();
        console.log('user', data);
        const payload: any = {
            p_transaction_id: 0,
            p_transaction_date: this.formatLocalDate(data.curdate),
            p_head: data.p_head,
            p_amount: data.p_amount,
            p_username: username
        };
        this.inventoryService.upserttransactionmisc(payload).subscribe({
            next: (res) => {
                this.showSuccess(res.data.message);
                this.onGetTransMics();
                this.miscChargeForm.reset({
                    curdate: new Date(),
                    p_request: 'PENDING'
                });
            }
        });
    }

    submit() {
        if (this.miscChargeForm.invalid) {
            this.miscChargeForm.markAllAsTouched();
            return;
        }
        const formData = this.miscChargeForm.getRawValue();
        if (this.editmode && this.selectedCharge) {
            this.confirmationService.confirm({
                message: 'Are you sure you want to update this?',
                header: 'Confirm',
                acceptLabel: 'Yes',
                rejectLabel: 'Cancel',
                accept: () => {
                    this.onMiscEdit(formData);
                },
                reject: () => {}
            });
        } else {
            this.confirmationService.confirm({
                message: 'Are you sure you want to create this?',
                header: 'Confirm',
                acceptLabel: 'Yes',
                rejectLabel: 'Cancel',
                accept: () => {
                    this.onMiscChargeCreation(formData);
                },
                reject: () => {}
            });
        }
    }

    onEdit(data: any) {
        this.selectedCharge = data;
        this.editmode = true;
        const head = this.headOptions.find((h) => h.fieldname === data.head);
        console.log(head)
        const [year, month, day] = data.transaction_date.split('-').map(Number);
        this.miscChargeForm.patchValue({
            curdate: new Date(year, month - 1, day),
            p_head: head?.fieldname,
            p_amount: data.amount,
            p_request: ''
        });
    }

    removeItem(row: any) {
        console.log('row', row);
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            accept: () => {
                const username = this.authService.isLogIntType().username;
                const payload = {
                    p_type: 'TRANMISC',
                    p_transaction_id: row.transaction_id,
                    p_username: username
                };
                this.inventoryService.deletetransaction(payload).subscribe({
                    next: (res) => {
                        this.showSuccess(res.data.message);
                        this.onGetTransMics();
                    }
                });
            },
            reject: () => {}
        });
    }

    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
    }

    reset() {
        this.showData = false;
        this.editmode = false;
        this.selectedCharge = null;
        this.miscChargeForm.reset({
            curdate: new Date(),
            p_request: 'PENDING'
        });
    }

    onDownloadClick() {
        if (!this.filteredProducts?.length) {
            return this.errorSuccess('No data available to download.');
        }
        this.downloadExcel();
    }

    private downloadExcel() {
        const exportData = this.filteredProducts.map((item) => ({
            Date: item.transaction_date ? this.datePipe.transform(new Date(item.transaction_date), 'dd/MM/yyyy') : '',
            Head: item.head || '',
            Amount: item.amount || '',
            Status: item.status || '',
            Remark: item.reason || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Column widths
        worksheet['!cols'] = [
            { wch: 15 }, // Date
            { wch: 20 }, // Head
            { wch: 15 }, // Amount
            { wch: 15 }, // Status
            { wch: 25 } // Remark
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Misc Charges');

        const date = this.datePipe.transform(new Date(), 'yyyy-MM-dd_HH-mm');
        XLSX.writeFile(workbook, `MiscCharges_Report_${date}.xlsx`);

        this.showSuccess('Excel downloaded successfully!');
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
