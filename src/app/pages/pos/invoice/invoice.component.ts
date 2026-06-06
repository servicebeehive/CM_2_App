import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';

import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { ShareService } from '@/core/services/shared.service';

// ---------------------------------------------------------------------------
// Column definition type — avoids `any[]` for column arrays
// ---------------------------------------------------------------------------
interface TableColumn {
    fields: string;
    header: string;
    formatter?: (value: any) => any;
}

interface Customer {
    fieldid: number;
    fieldname: string;
    fieldvalue: string;
    customergstno: string;
}

@Component({
    selector: 'app-invoice',
    standalone: true,
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
        Tooltip
    ],
    templateUrl: './invoice.component.html',
    styleUrl: './invoice.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class InvoiceComponent implements OnInit {
    // -------------------------------------------------------------------------
    //  DI
    // -------------------------------------------------------------------------
    private readonly fb = inject(FormBuilder);
    private readonly inventoryService = inject(InventoryService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);
    private readonly sharedService = inject(ShareService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);
    public readonly datepipe = inject(DatePipe);

    // -------------------------------------------------------------------------
    //  State
    // -------------------------------------------------------------------------
    invoiceForm!: FormGroup;

    today: Date = new Date();
    submitDisable = true;
    showData = false;
    ledgerData = false;
    hsncode = '';

    // Company / profile
    companyName = '';
    companyAddress = '';
    companycity = '';
    companystate = '';
    statecode = '';
    companyemail = '';
    companygstno = '';
    bankname = '';
    accountno = '';
    branchname = '';
    ifsc = '';
    pan = '';

    // Dropdown options
    cusMobileOptions: any[] = [];
    cusMobNameOptions: Customer[] = [];
    statusOptions: any[] = [];

    // Table data
    products: any[] = [];
    filteredProducts: any[] = [];
    invoiceData: any[] = [];
    customerLedgerData: any[] = [];

    // Column definitions — typed
    columns: TableColumn[] = [];
    displayColumns: TableColumn[] = [];

    selectedStatus: string | null = null;

    readonly transactionMode = [
        { label: 'Cash', value: 'Cash' },
        { label: 'UPI', value: 'UPI' },
        { label: 'Card', value: 'Card' }
    ];

    // -------------------------------------------------------------------------
    //  Lifecycle
    // -------------------------------------------------------------------------
    ngOnInit(): void {
        this.buildForm();
        this.setTableColumns();
        this.loadAllDropdowns();
        this.onGetStockIn();
        this.restoreSavedState();
    }

    private buildForm(): void {
        this.invoiceForm = this.fb.group(
            {
                p_cusname: [''],
                fromDate: [this.today, Validators.required],
                toDate: [this.today, Validators.required],
                status: [''],
                due_amount: [''],
                // Print fields
                p_billno: [''],
                p_transactiondate: [''],
                p_transactionid: [''],
                p_customername: [''],
                p_customeraddress: [''],
                p_mobileno: [''],
                p_customergstno: [''],
                p_customerstate: [''],
                chalanno: [''],
                deliveryboy: [''],
                p_totalsale: [''],
                p_totalpayable: [''],
                p_disctype: [''],
                p_overalldiscount: [''],
                discountvalueper: [''],
                p_roundoff: [''],
                amount_before_tax: [''],
                cgst_9: [''],
                sgst_9: [''],
                tax_18: [''],
                p_totalqty: [''],
                totalDueAmount: [''],
                p_checked: [false],
                p_stock: this.fb.array([])
            },
            { validators: this.dateRangeValidator }
        );
    }

    private restoreSavedState(): void {
        const saved = this.sharedService.getInvoiceState();
        if (saved) {
            this.invoiceForm.patchValue(saved.filters);
            this.products = saved.data;
            this.filteredProducts = [...saved.data];
        }
    }

    // -------------------------------------------------------------------------
    //  Validators
    // -------------------------------------------------------------------------
    dateRangeValidator(form: FormGroup): { dateRangeInvalid: true } | null {
        const from = form.get('fromDate')?.value;
        const to = form.get('toDate')?.value;
        if (!from || !to) return null;
        return new Date(to) >= new Date(from) ? null : { dateRangeInvalid: true };
    }

    // -------------------------------------------------------------------------
    //  FormArray helpers
    // -------------------------------------------------------------------------
    getStockArray(): FormArray {
        return this.invoiceForm.get('p_stock') as FormArray;
    }

    private initialiseFormArray(): void {
        const arr = this.getStockArray();
        arr.clear();
        this.products.forEach((p) => arr.push(this.fb.control(p.received_amount ?? 0)));
    }

    // -------------------------------------------------------------------------
    //  Dropdown loading
    // -------------------------------------------------------------------------
    private loadAllDropdowns(): void {
        this.loadDropdown('STATUS', (res) => (this.statusOptions = res));
        this.loadDropdown('CUSTOMER', (res) => (this.cusMobNameOptions = res));
        this.loadDropdown('MOBILE', (res) => (this.cusMobileOptions = res));
        this.loadProfile();
    }

    private loadDropdown(returnType: string, onSuccess: (data: any[]) => void): void {
        this.inventoryService
            .getdropdowndetails({ p_username: 'admin', p_returntype: returnType })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: (res) => onSuccess(res.data), error: console.error });
    }

    private loadProfile(): void {
        this.inventoryService
            .getdropdowndetails({ p_username: 'admin', p_returntype: 'PROFILE' })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    if (!res.data?.length) return;
                    const p = res.data[0];
                    this.companyName = p.companyname;
                    this.companyAddress = p.companyaddress;
                    this.companystate = p.state_name;
                    this.companycity = p.city_name;
                    this.companyemail = p.companyemail;
                    this.companygstno = p.companygstno;
                    this.statecode = p.statecode;
                    this.bankname = p.bankname;
                    this.accountno = p.accountno;
                    this.branchname = p.branch;
                    this.ifsc = p.ifsc;
                    this.pan = p.pan;
                },
                error: console.error
            });
    }

    // -------------------------------------------------------------------------
    //  Table columns
    // -------------------------------------------------------------------------
    private setTableColumns(): void {
        this.columns = [
            { fields: 'customername', header: 'Customer Name' },
            { fields: 'customerphone', header: 'Mobile No' },
            { fields: 'billno', header: 'Invoice No' },
            { fields: 'payment_date', header: 'Payment Date' },
            { fields: 'payment_mode', header: 'Payment Mode' },
            { fields: 'totalpayable', header: 'Invoice Amount' },
            { fields: 'paid_amount', header: 'Paid Amount' },
            { fields: 'remarks', header: 'Remarks' }
        ];

        this.displayColumns = [
            { fields: 'transactiontype', header: 'Transaction Type' },
            { fields: 'invoice_no', header: 'Invoice No' },
            { fields: 'invoice_date', header: 'Invoice Date' },
            { fields: 'return_invoice_no', header: 'Return Invoice No' },
            { fields: 'customer', header: 'Customer Name' },
            { fields: 'mobile', header: 'Mobile No' },
            { fields: 'total_amount', header: 'Total Amount' },
            { fields: 'paid_amount', header: 'Paid Amount' },
            { fields: 'due_amount', header: 'Due Amount' },
            { fields: 'status', header: 'Status' }
        ];
    }

    // -------------------------------------------------------------------------
    //  Data loading
    // -------------------------------------------------------------------------
    onGetStockIn(): void {
        this.products = this.inventoryService.productItem ?? [];
    }

    display(): void {
        const { p_cusname, fromDate, toDate, status } = this.invoiceForm.value;

        if (!fromDate || !toDate) {
            this.errorSuccess('Please select a date range.');
            return;
        }

        const payload = {
            p_startdate: this.datepipe.transform(fromDate, 'yyyy/MM/dd'),
            p_enddate: this.datepipe.transform(toDate, 'yyyy/MM/dd'),
            p_customer: p_cusname || null,
            p_status: status || null,
            p_username: 'admin'
        };

        this.showData = false;

        this.inventoryService
            .getinvoicedetail(payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res: any) => {
                    this.products = res?.data ?? [];
                    this.filteredProducts = this.products.map((row) => ({
                        ...row,
                        p_paymode: row.p_paymode ?? 'Cash'
                    }));

                    this.showData = true;
                    this.totalDueAmount();
                    this.initialiseFormArray();
                    this.saveCurrentState();

                    if (this.products.length === 0) {
                        this.showSuccess('No Data Available for the selected filters.');
                    }
                },
                error: (err) => {
                    console.error(err);
                    this.showData = false;
                }
            });
    }

    customerLedger(): void {
        const selectedId = this.invoiceForm.get('p_cusname')?.value;
        const selectedValue = this.cusMobNameOptions.find((c) => c.fieldid === selectedId);
        const mobile = selectedValue?.fieldvalue?.match(/\d{10}/)?.[0];

        if (!mobile) {
            this.filteredProducts = [];
            this.products = [];
            this.errorSuccess('Please select a valid customer with a mobile number.');
            return;
        }

        this.inventoryService
            .Getreturndropdowndetails({ p_returnvalue: mobile, p_returntype: 'CUSTOMERLEDGER', p_username: 'admin' })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res: any) => {
                    this.ledgerData = true;
                    this.customerLedgerData = res.data;
                },
                error: console.error
            });
    }

    // -------------------------------------------------------------------------
    //  Computed totals
    // -------------------------------------------------------------------------
    get dueAmount(): number {
        return this.customerLedgerData.reduce((sum, item: any) => sum + ((item.totalpayable ?? 0) - (item.paid_amount ?? 0)), 0);
    }

    get grandTotal(): number {
        return this.products.reduce((sum, p) => sum + (p.total ?? 0), 0);
    }

    totalDueAmount(): void {
        const total = this.products.reduce((sum, p) => {
            if (p.transactiontype?.toUpperCase() === 'SALE') {
                return sum + (Number(p.due_amount) || 0);
            }
            return sum;
        }, 0);

        this.invoiceForm.get('totalDueAmount')?.setValue(+total.toFixed(2));
    }

    // -------------------------------------------------------------------------
    //  Filters
    // -------------------------------------------------------------------------
    onDueAmountFilter(): void {
        const checked = this.invoiceForm.get('p_checked')?.value;
        this.filteredProducts = checked ? this.products.filter((item) => Number(item.due_amount) > 0) : [...this.products];
    }

    onPageChange(event: any): void {
        // handled by p-table internally; keep if paginator emits custom events
    }

    // -------------------------------------------------------------------------
    //  Validation helpers
    // -------------------------------------------------------------------------
    validateReceivedAmount(row: any): void {
        const due = parseFloat(row.due_amount) || 0;
        const received = parseFloat(row.received_amount) || 0;
        row.amountError = received > due;
        this.submitDisable = row.amountError;
    }

    blockMinus(event: KeyboardEvent): void {
        if (['-', 'Minus', 'e', 'E'].includes(event.key)) {
            event.preventDefault();
        }
    }

    canPrint(row: any): boolean {
        return row?.transactiontype?.toUpperCase() === 'SALE';
    }

    // -------------------------------------------------------------------------
    //  State persistence
    // -------------------------------------------------------------------------
    saveCurrentState(): void {
        this.sharedService.setInvoiceState(this.invoiceForm.value, this.products);
    }

    // -------------------------------------------------------------------------
    //  Navigation
    // -------------------------------------------------------------------------
    openInvoice(row: any): void {
        if (!row?.invoice_no) return;
        const username = this.authService.isLogIntType()?.username;

        this.saveCurrentState();

        this.inventoryService
            .Getreturndropdowndetails({ p_username: username, p_returntype: 'SALEPRINT', p_returnvalue: row.invoice_no })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res: any) => {
                    if (!res.data?.length) {
                        this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'Invoice data not found' });
                        return;
                    }
                    this.router.navigate(['/layout/pos/sales'], {
                        state: { mode: 'edit', saleData: res.data[0], itemsData: res.data, from: 'invoice' }
                    });
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load invoice' })
            });
    }

    // -------------------------------------------------------------------------
    //  Payment submission
    // -------------------------------------------------------------------------
    submit(): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to make this change?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            accept: () => this.processPayments()
        });
    }

    private processPayments(): void {
        const payloadItems = this.products
            .filter((row) => (parseFloat(row.received_amount) || 0) > 0)
            .map((row) => {
                const received = parseFloat(row.received_amount);
                const due = parseFloat(row.due_amount);

                if (received > due) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: `Received amount for invoice ${row.invoice_no} exceeds due amount`
                    });
                    throw new Error('validation'); // stops map + caught below
                }

                return {
                    adjtype: row.invoice_no,
                    ItemId: 0,
                    batchId: 0,
                    Quantity: 0,
                    mrpvalue: received,
                    transmode: row.p_paymode
                };
            });

        if (payloadItems.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please enter a received amount for at least one invoice.'
            });
            return;
        }

        this.inventoryService
            .updatestockadjustment({ p_stock: payloadItems, p_updatetype: 'DUE', p_username: 'admin' })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.showSuccess('Transaction saved successfully.');
                    this.display();
                },
                error: (err) => {
                    console.error(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save received amounts.' });
                }
            });
    }

    // -------------------------------------------------------------------------
    //  Print
    // -------------------------------------------------------------------------
    printInvoice(row: any): void {
        this.inventoryService
            .Getreturndropdowndetails({ p_username: 'admin', p_returntype: 'SALEPRINT', p_returnvalue: row.invoice_no })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    if (!Array.isArray(res.data) || !res.data.length) return;
                    this.invoiceData = res.data;
                    this.hsncode = res.data[0].hsncode;
                    this.populateInvoiceForm(res.data[0]);
                    setTimeout(() => this.openPrintWindow(), 100);
                },
                error: (err) => {
                    console.error(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load invoice data.' });
                }
            });
    }

    private populateInvoiceForm(data: any): void {
        if (!data) return;
        this.invoiceForm.patchValue({
            p_billno: data.billno ?? '',
            p_transactiondate: data.transactiondate ?? '',
            p_transactionid: data.transactionid ?? '',
            p_customername: data.customername ?? '',
            p_mobileno: data.mobileno ?? '',
            p_customergstno: data.customergstno,
            p_customerstate: data.customerstate,
            chalanno: data.customergstno,
            deliveryboy: data.deliveryboy,
            p_totalsale: data.totalsale ?? 0,
            p_totalpayable: data.totalpayable ?? 0,
            p_disctype: data.discounttype ?? 'N',
            p_overalldiscount: data.discount ?? 0,
            discountvalueper: data.discount ?? 0,
            p_roundoff: data.roundoff ?? 0,
            amount_before_tax: data.amount_before_tax ?? 0,
            cgst_9: data.cgst_9 ?? 0,
            sgst_9: data.sgst_9 ?? 0,
            tax_18: data.tax_18 ?? 0,
            p_totalqty: data.quantity ?? 0
        });
    }

    private openPrintWindow(): void {
        const contents = document.getElementById('invoicePrintSection')?.innerHTML;
        if (!contents) {
            console.error('Invoice print section not found');
            return;
        }

        const win = window.open('', '_blank', 'width=900,height=1500');
        if (!win) return;

        win.document.write(`
            <!DOCTYPE html><html><head>
            <style>
                @page { margin: 0; size: auto; }
                body  { font-family: Arial, sans-serif; }
            </style>
            </head><body>
                ${contents}
                <script>
                    window.onload = function () {
                        window.print();
                        window.onafterprint = function () { window.close(); };
                    };
                <\/script>
            </body></html>
        `);
        win.document.close();
    }

    // -------------------------------------------------------------------------
    //  Reset
    // -------------------------------------------------------------------------
    reset(): void {
        this.invoiceForm.reset({ fromDate: new Date(), toDate: new Date() });
        this.products = [];
        this.filteredProducts = [];
        this.invoiceData = [];
        this.showData = false;
    }

    // -------------------------------------------------------------------------
    //  Toast helpers
    // -------------------------------------------------------------------------
    showSuccess(message: string): void {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    errorSuccess(message: string): void {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }

    // =========================================================================
    //  EXCEL / CSV DOWNLOAD  — fully rewritten
    // =========================================================================

    /**
     * Build a CSV string from any dataset + column definition.
     * Single method replaces generateCSV() + generateDisplayCSV().
     */
    private buildCSV(data: any[], columns: TableColumn[]): string {
        const escape = (v: any): string => {
            if (v === null || v === undefined) return '';
            const s = String(v).replace(/"/g, '""');
            return /[,"\n\r]/.test(s) ? `"${s}"` : s;
        };

        const header = columns.map((c) => escape(c.header)).join(',');

        const rows = data.map((item) =>
            columns
                .map((col) => {
                    const raw = item[col.fields];
                    return escape(col.formatter ? col.formatter(raw) : raw);
                })
                .join(',')
        );

        return [header, ...rows].join('\n');
    }

    /**
     * Trigger a browser file download.
     * FIX: original code called appendChild(link) twice — link was never removed.
     */
    private triggerDownload(content: string, mimeType: string, filename: string): void {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // ← removed exactly once
        URL.revokeObjectURL(url);
    }

    /** Derive a meaningful filename from form values. */
    private buildFilename(type: 'ledger' | 'display'): string {
        if (type === 'display') {
            const from = this.datepipe.transform(this.invoiceForm.get('fromDate')?.value, 'dMMMyy');
            const to = this.datepipe.transform(this.invoiceForm.get('toDate')?.value, 'dMMMyy');
            return `Invoice_${from}-${to}.csv`;
        }

        const customerId = this.invoiceForm.get('p_cusname')?.value;
        const customerName = this.cusMobNameOptions.find((c) => c.fieldid === customerId)?.fieldname ?? 'Customer';
        return `${customerName}_Ledger.csv`;
    }

    /** Download the customer ledger CSV. */
    downloadExcel(): void {
        if (!this.customerLedgerData.length) {
            this.errorSuccess('No ledger data available to download.');
            return;
        }

        const csv = this.buildCSV(this.customerLedgerData, this.columns);
        this.triggerDownload(csv, 'text/csv;charset=utf-8;', this.buildFilename('ledger'));
        this.showSuccess('Ledger downloaded successfully.');
    }

    /** Download the display / invoice list CSV. */
    downloadDisplayExcel(): void {
        if (!this.filteredProducts.length) {
            this.errorSuccess(this.showData ? 'No data available to download.' : 'Please click "Display" first to load data.');
            return;
        }

        const csv = this.buildCSV(this.filteredProducts, this.displayColumns);
        this.triggerDownload(csv, 'text/csv;charset=utf-8;', this.buildFilename('display'));
        this.showSuccess('Invoice list downloaded successfully.');
    }

    /** Entry point from the Download button — decides which export to run. */
    onDownloadClick(): void {
        if (this.invoiceForm.invalid) {
            this.errorSuccess('Please fill all required fields before downloading.');
            return;
        }

        // If ledger data is loaded, prefer that; otherwise export the display list.
        if (this.customerLedgerData.length) {
            this.downloadExcel();
        } else {
            this.downloadDisplayExcel();
        }
    }

    // Kept for template backward-compat (button that downloads display list directly)
    download(): void {
        this.customerLedgerData.length ? this.downloadExcel() : this.errorSuccess('No data available to download.');
    }

    getReceivedAmountControl(index: number): AbstractControl | null {
        return this.getStockArray().at(index) ?? null;
    }

    updateReceivedAmount(index: number, value: number): void {
        if (this.products[index]) this.products[index].received_amount = value;
    }
}
