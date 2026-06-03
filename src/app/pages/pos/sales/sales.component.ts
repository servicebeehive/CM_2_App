import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, inject, OnInit, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { Subject, debounceTime } from 'rxjs';

import { AddinventoryComponent } from '@/pages/inventory/addinventory/addinventory.component';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { OrderService } from '@/core/services/order.service';
import { ShareService } from '@/core/services/shared.service';
import { StockIn } from '@/types/stockin.model';

// ---------------------------------------------------------------------------
// Standalone validator — kept outside the class (pure function, no state)
// ---------------------------------------------------------------------------
export function gstNumberValidator(control: AbstractControl): ValidationErrors | null {
    const val = control.value;
    if (!val) return null;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(val.toUpperCase()) ? null : { invalidGst: true };
}

@Component({
    selector: 'app-sales',
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
        RippleModule,
        ChipModule,
        FluidModule,
        MessageModule,
        DatePickerModule,
        DialogModule,
        ConfirmDialogModule,
        CheckboxModule
    ],
    templateUrl: './sales.component.html',
    styleUrl: './sales.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class SalesComponent implements OnInit, AfterViewInit {
    // -------------------------------------------------------------------------
    //  DI — use inject() consistently; DestroyRef replaces manual ngOnDestroy
    // -------------------------------------------------------------------------
    private readonly fb = inject(FormBuilder);
    private readonly inventoryService = inject(InventoryService); // single instance, not two
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly orderService = inject(OrderService);
    private readonly datepipe = inject(DatePipe);
    private readonly sharedService = inject(ShareService);
    private readonly route = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    public readonly authService = inject(AuthService);

    // -------------------------------------------------------------------------
    //  View references
    // -------------------------------------------------------------------------
    @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;
    @ViewChild('deliveryperson') deliveryDropdown!: Dropdown;
    @ViewChild(AddinventoryComponent) addInventoryComp!: AddinventoryComponent;
    @ViewChildren('uomDropdown') uomDropdowns!: QueryList<Dropdown>;

    // -------------------------------------------------------------------------
    //  State
    // -------------------------------------------------------------------------
    salesForm!: FormGroup;

    isBarcodeScan = false;
    isAutoSelect = false;
    backshow = false;
    isLoadingBills = false;
    submitDisabledByBill = false;

    today: Date = new Date();

    // Dropdown data
    itemOptions: any[] = [];
    cusMobileOptions: any[] = [];
    deliveryBoyOptions: any[] = [];
    billNoOptions: any[] = [];
    uomlist: any[][] = [];

    // Company / profile info
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
    customerstate = '';

    mobilePlaceholder = 'Mobile No';
    discountplace = 'Enter Amount';
    filteredDeliveryText = '';
    fromPage = '';

    private billValue: any[] = [];

    // Debounce qty changes so the MRP API isn't hit on every keystroke
    private readonly qtyChange$ = new Subject<number>();

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
        this.loadAllDropdowns();
        this.subscribeFormChanges();
        this.restoreNavigationState();
        this.setupQtyDebounce();
    }

    ngAfterViewInit(): void {
        // Defer to avoid ExpressionChangedAfterItHasBeenChecked
        setTimeout(() => this.focusBarcode());
    }

    // -------------------------------------------------------------------------
    //  Form construction
    // -------------------------------------------------------------------------
    private buildForm(): void {
        this.salesForm = this.fb.group(
            {
                p_itemdata: [null],
                p_transactiontype: [''],
                p_itemid: [null],
                p_billno: [null],
                p_transactionid: [0],
                p_transactiondate: [this.today, Validators.required],
                p_customername: ['', [Validators.required, Validators.maxLength(100)]],
                p_mobileno: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
                searchMobileNo: [''],
                p_paymode: ['Cash'],
                p_totalcost: [0],
                p_totalsale: [0],
                p_deliveryboy: ['', Validators.maxLength(100)],
                p_disctype: [false],
                p_overalldiscount: [''],
                p_roundoff: [''],
                p_totalpayable: [0],
                p_currencyid: [0],
                p_paymentdue: [''],
                chalanno: [''],
                p_gsttran: [false],
                status: [''],
                p_status: [''],
                p_isactive: [''],
                p_loginuser: [''],
                p_linktransactionid: [0],
                p_replacesimilir: [''],
                p_creditnoteno: [''],
                p_paymentmode: [''],
                UomName: [''],
                sgst_9: [''],
                tax_18: [''],
                cgst_9: [''],
                discountvalueper: [null],
                amount_before_tax: [''],
                p_sale: this.fb.array([])
            },
            {
                validators: [this.costGreaterThanSaleValidator(), this.paidAmountLessThanFinalAmount()]
            }
        );
    }

    private subscribeFormChanges(): void {
        // Bill selection toggle
        this.salesForm
            .get('p_billno')!
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.submitDisabledByBill = !!value;
            });

        // Discount type toggle
        this.salesForm
            .get('p_disctype')!
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((isPercent) => {
                this.discountplace = isPercent ? 'Enter %' : 'Enter Amount';
                this.applyDiscount();
            });
    }

    /** Debounce quantity changes — fires MRP API 300 ms after last keystroke */
    private setupQtyDebounce(): void {
        this.qtyChange$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe((index) => this.calculateMRP(index));
    }

    // -------------------------------------------------------------------------
    //  FormArray helpers
    // -------------------------------------------------------------------------
    get saleArray(): FormArray {
        return this.salesForm.get('p_sale') as FormArray;
    }

    get saleRows(): FormGroup[] {
        return this.saleArray.controls as FormGroup[];
    }

    private createSaleItem(data?: any): FormGroup {
        return this.fb.group({
            TransactiondetailId: [this.salesForm.get('p_transactionid')?.value ?? 0],
            ItemId: [data?.itemid ?? 0],
            ItemName: [data?.itemname ?? ''],
            UOMId: [data?.uomid ?? 0],
            UomName: [data?.uomname ?? ''],
            Quantity: [1],
            itemcost: [data?.pruchaseprice ?? 0],
            MRP: [data?.saleprice ?? 0],
            totalPayable: [data?.saleprice ?? 0],
            curStock: [data?.currentstock ?? 0],
            warPeriod: [data?.warrentyperiod ?? 0],
            location: [data?.location ?? ''],
            itemsku: [data?.itemsku ?? ''],
            hsncode: [data?.hsncode ?? null],
            apiCost: [0]
        });
    }

    private mapSaleItems(apiItems: any[]): void {
        this.saleArray.clear();
        this.uomlist = [];

        apiItems.forEach((item, index) => {
            this.saleArray.push(
                this.fb.group({
                    TransactiondetailId: [item.transactiondetailid ?? 0],
                    ItemId: [item.itemid ?? 0],
                    ItemName: [item.itemname ?? ''],
                    UOMId: [item.uomname ?? 0],
                    UomName: [item.uomname ?? ''],
                    Quantity: [item.quantity ?? 1],
                    itemcost: [item.itemcost ?? 0],
                    MRP: [(item.mrp ?? 0).toFixed(2)],
                    totalPayable: [((item.quantity ?? 1) * (item.mrp ?? 0)).toFixed(2)],
                    curStock: [item.current_stock ?? 0],
                    warPeriod: [item.warrenty ?? 0],
                    location: [''],
                    hsncode: [item.hsncode],
                    itemsku: [item.itemsku ?? '']
                })
            );

            const uomValue = this.saleArray.at(index).get('UOMId')?.value;
            this.loadUOM(item.itemid ?? item.itemsku, index, uomValue);
        });

        const lastIndex = this.saleArray.length - 1;
        if (lastIndex >= 0) this.updateTotal(lastIndex);
        this.calculateSummary();
    }

    // -------------------------------------------------------------------------
    //  Dropdown loading
    // -------------------------------------------------------------------------
    private loadAllDropdowns(): void {
        this.loadItems();
        this.loadBillNumbers();
        this.loadCustomerMobiles();
        this.loadDeliveryOptions();
        this.loadProfile();
    }

    private loadItems(): void {
        this.inventoryService
            .getdropdowndetails({ p_returntype: 'ITEM' })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: (res) => (this.itemOptions = res.data), error: console.error });
    }

    private loadCustomerMobiles(): void {
        this.inventoryService
            .getdropdowndetails({ p_returntype: 'CUSTOMER' })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: (res) => (this.cusMobileOptions = res.data), error: console.error });
    }

    private loadDeliveryOptions(): void {
        this.inventoryService
            .getdropdowndetails({ p_returntype: 'DELIVERY' })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: (res) => (this.deliveryBoyOptions = res.data), error: console.error });
    }

    private loadProfile(): void {
        this.inventoryService
            .getdropdowndetails({ p_returntype: 'PROFILE' })
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

    private loadBillNumbers(): void {
        const username = this.authService.isLogIntType().username;
        this.inventoryService
            .getdropdowndetails({ p_returntype: 'NEWTRANSACTIONID', p_username: username })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.billNoOptions = (res.data as any[]).filter((i) => i.billno != null);
                    this.billValue = this.billNoOptions;
                },
                error: console.error
            });
    }

    // -------------------------------------------------------------------------
    //  Navigation state restoration
    // -------------------------------------------------------------------------
    private restoreNavigationState(): void {
        const nav = history.state;
        if (nav?.saleData && nav?.itemsData) {
            this.backshow = true;
            this.mode = nav.mode ?? 'edit';
            this.fromPage = nav.from ?? '';
            this.populateSaleForm(nav.saleData, nav.itemsData);
        }
    }

    mode: 'add' | 'edit' = 'add';

    // -------------------------------------------------------------------------
    //  Barcode scanning
    // -------------------------------------------------------------------------
    focusBarcode(): void {
        this.barcodeInput?.nativeElement?.focus();
    }

    clearBarcodeInput(): void {
        const el = this.barcodeInput?.nativeElement;
        if (el) {
            el.value = '';
            el.focus();
        }
    }

    onBarcodeScan(event: Event): void {
        this.isBarcodeScan = true;
        const barcode = (event.target as HTMLInputElement).value?.trim();
        if (!barcode) return;

        const matched = this.itemOptions.find((i) => i.itembarcode === barcode || i.itemsku === barcode || i.itemid == barcode);

        if (!matched) {
            this.messageService.add({
                severity: 'error',
                summary: 'Item Not Found',
                detail: `No item found for ${barcode}`,
                life: 2000
            });
            this.clearBarcodeInput();
            this.isBarcodeScan = false;
            return;
        }

        this.isAutoSelect = true;
        this.salesForm.get('p_itemdata')?.setValue(matched.itemid);
        this.onItemChange({ value: matched.itemid });
        this.clearBarcodeInput();
        this.isBarcodeScan = false;
    }

    /** Used in tests / debug only */
    simulateScan(barcode: string): void {
        this.onBarcodeScan({ target: { value: barcode } } as unknown as Event);
    }

    keepBarcodeFocus(event: MouseEvent): void {
        const tag = (event.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            this.focusBarcode();
        }
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardSubmit(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            this.onSubmit();
        }
    }

    // -------------------------------------------------------------------------
    //  Item selection
    // -------------------------------------------------------------------------
    onItemChange(event: { value: any }): void {
        const item = this.itemOptions.find((i) => i.itemid == event.value);
        if (!item) return;

        const duplicate = this.saleArray.controls.some((row) => row.get('ItemId')?.value === item.itemid);

        if (duplicate) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Item',
                detail: `${item.itemname} is already added.`,
                life: 2000
            });
            this.salesForm.get('p_itemdata')?.setValue(null, { emitEvent: false });
            this.isAutoSelect = false;
            return;
        }

        this.saleArray.push(this.createSaleItem(item));
        this.focusLastRowUOM();

        const index = this.saleArray.length - 1;
        this.loadUOM(event.value, index);
        this.calculateMRP(index);

        if (!this.isAutoSelect) {
            this.salesForm.get('p_itemdata')?.setValue(null, { emitEvent: false });
        }
        this.isAutoSelect = false;
        this.calculateSummary();
    }

    // Keep public alias for template backward-compat
    OnItemChange = this.onItemChange.bind(this);

    private focusLastRowUOM(): void {
        setTimeout(() => {
            const dropdowns = this.uomDropdowns.toArray();
            dropdowns[dropdowns.length - 1]?.focus();
        });
    }

    // -------------------------------------------------------------------------
    //  UOM loading & selection
    // -------------------------------------------------------------------------
    private loadUOM(itemIdOrSku: any, index: number, uomValue?: string): void {
        this.inventoryService
            .Getreturndropdowndetails({ p_returntype: 'SALEUOM', p_returnvalue: itemIdOrSku })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    if (!res?.data?.length) return;
                    this.uomlist[index] = [...res.data];

                    const row = this.saleArray.at(index);
                    let selected = uomValue ? this.uomlist[index].find((u: any) => u.fieldid == uomValue || u.fieldname == uomValue) : null;

                    if (!selected && !row.get('UOMId')?.value) {
                        selected = this.uomlist[index][0];
                    }
                    if (!selected) return;

                    row.patchValue({ UOMId: selected.fieldid, UomName: selected.fieldname });
                    this.calculateMRP(index);
                }
            });
    }

    // Keep old name for template backward-compat
    OnUMO = this.loadUOM.bind(this);

    onUOMChange(event: { value: any }, index: number): void {
        const row = this.saleArray.at(index);
        const selected = this.uomlist[index]?.find((u: any) => u.fieldid === event.value);
        if (!selected) return;

        row.patchValue({ UOMId: selected.fieldid, UomName: selected.fieldname });
        this.calculateMRP(index);
    }

    // Keep old name for template backward-compat
    UOMId = this.onUOMChange.bind(this);

    // -------------------------------------------------------------------------
    //  MRP calculation  (single unified method — removes the duplicate)
    // -------------------------------------------------------------------------
    calculateMRP(index: number): void {
        const row = this.saleArray.at(index);
        const qty = Number(row.get('Quantity')?.value ?? 1);
        const uomid = row.get('UOMId')?.value;
        const itemId = row.get('ItemId')?.value;

        if (!uomid || qty <= 0) return;

        this.orderService
            .getcalculatedMRP({ p_itemid: itemId, p_qty: qty, p_uomid: uomid })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res: any) => {
                    if (!res.success && !res.data) return;

                    const mrp = Number(res.data.totalmrp ?? 0);
                    const cost = Number(res.data.totalcost ?? 0);
                    const conversion = Number(res.data.conversion ?? 1);

                    // Add baseStock control once
                    if (!(row as FormGroup).contains('baseStock')) {
                        (row as FormGroup).addControl('baseStock', new FormControl(Number(row.get('curStock')?.value ?? 0)));
                    }
                    const baseStock = Number(row.get('baseStock')?.value ?? 0);

                    row.patchValue({
                        MRP: mrp,
                        itemcost: cost,
                        totalPayable: qty * mrp,
                        apiCost: qty * cost,
                        curStock: baseStock * conversion
                    });

                    this.updateTotalCostSummary();
                    this.calculateSummary();
                }
            });
    }

    /** Called from template — pushes to debounced stream */
    OnQtyChange(index: number): void {
        this.qtyChange$.next(index);
    }

    // -------------------------------------------------------------------------
    //  Row operations
    // -------------------------------------------------------------------------
    removeItem(index: number): void {
        this.saleArray.removeAt(index);
        this.uomlist.splice(index, 1);
        this.updateTotalCostSummary();

        if (this.saleArray.length === 0) {
            this.calculateSummary();
        } else {
            this.updateTotal(this.saleArray.length - 1);
        }
    }

    updateTotal(index: number): void {
        const row = this.saleArray.at(index);
        const qty = Number(row.get('Quantity')?.value ?? 0);
        const stock = Number(row.get('curStock')?.value ?? 0);
        const mrp = Number(row.get('MRP')?.value ?? 0);

        if (qty > stock) {
            row.get('Quantity')?.setErrors({ maxStock: true });
            this.messageService.add({
                severity: 'warn',
                summary: 'Stock Limit Exceeded',
                detail: `Only ${stock} units available.`,
                life: 2000
            });
            return;
        }

        row.get('Quantity')?.setErrors(null);
        row.patchValue({ totalPayable: qty * mrp });
        this.calculateSummary();
        this.salesForm.updateValueAndValidity();
    }

    // -------------------------------------------------------------------------
    //  Summary / discount calculations
    // -------------------------------------------------------------------------
    calculateSummary(): void {
        const totalMRP = this.saleArray.controls.reduce((sum, row) => {
            return sum + Number(row.get('Quantity')?.value ?? 0) * Number(row.get('MRP')?.value ?? 0);
        }, 0);

        this.salesForm.patchValue({
            p_totalsale: totalMRP.toFixed(2),
            p_roundoff: 0,
            p_totalpayable: totalMRP.toFixed(2)
        });

        this.applyDiscount();
    }

    updateTotalCostSummary(): void {
        const finalCost = this.saleArray.controls.reduce((sum, row) => {
            return sum + Number(row.get('Quantity')?.value ?? 0) * Number(row.get('itemcost')?.value ?? 0);
        }, 0);

        this.salesForm.patchValue({ p_totalcost: finalCost.toFixed(2) });
    }

    applyDiscount(): void {
        const totalSale = Number(this.salesForm.get('p_totalsale')?.value ?? 0);
        const discountValue = Number(this.salesForm.get('p_overalldiscount')?.value ?? 0);
        const isPercent = this.salesForm.get('p_disctype')?.value;

        const discountAmount = isPercent ? (totalSale * discountValue) / 100 : discountValue;
        const finalPayable = totalSale - discountAmount;
        const roundOff = +(finalPayable - Math.floor(finalPayable)).toFixed(2);

        this.salesForm.patchValue({
            p_roundoff: roundOff,
            p_totalpayable: Math.round(finalPayable)
        });
        this.salesForm.updateValueAndValidity();
    }

    // -------------------------------------------------------------------------
    //  Validators
    // -------------------------------------------------------------------------
    private costGreaterThanSaleValidator(): ValidatorFn {
        return (form: AbstractControl): ValidationErrors | null => {
            const cost = Number(form.get('p_totalcost')?.value ?? 0);
            const payable = Number(form.get('p_totalpayable')?.value ?? 0);
            return payable < cost ? { costNotGreater: true } : null;
        };
    }

    private paidAmountLessThanFinalAmount(): ValidatorFn {
        return (form: AbstractControl): ValidationErrors | null => {
            const paid = Number(form.get('p_paymentdue')?.value ?? 0);
            const payable = Number(form.get('p_totalpayable')?.value ?? 0);
            return payable < paid ? { amountNotGreater: true } : null;
        };
    }

    // -------------------------------------------------------------------------
    //  Submit / reset
    // -------------------------------------------------------------------------
    isSubmitDisabled(): boolean {
        if (this.saleArray.length === 0) return true;
        if (!this.salesForm.get('p_transactiondate')?.value) return true;

        return this.saleArray.controls.some((row) => {
            const qty = Number(row.get('Quantity')?.value ?? 0);
            const stock = Number(row.get('curStock')?.value ?? 0);
            return qty === 0 || qty > stock || !!row.get('Quantity')?.errors?.['maxStock'];
        });
    }

    get isPrintDisabled(): boolean {
        return !this.salesForm.get('p_billno')?.value && this.saleArray.length === 0;
    }

    onSubmit(): void {
        if (this.isBarcodeScan || this.isSubmitDisabled()) {
            if (!this.isBarcodeScan) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Validation Failed',
                    detail: 'Please correct all errors before submitting.',
                    life: 2500
                });
            }
            return;
        }

        this.confirmationService.confirm({
            message: 'Are you sure you want to submit?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => this.submitSale()
        });
    }

    onReset(): void {
        this.salesForm.reset({ p_gsttran: false });
        this.saleArray.clear();
        this.backshow = false;
        this.salesForm.patchValue({
            p_transactiondate: this.today,
            p_paymode: 'Cash'
        });
    }

    // -------------------------------------------------------------------------
    //  API submit
    // -------------------------------------------------------------------------
    private submitSale(): void {
        const apibody = this.buildRequestBody(this.salesForm.value);

        this.inventoryService
            .OninsertSalesDetails(apibody)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    const billno = res.data[0]?.billno;

                    // Refresh dropdowns
                    this.loadBillNumbers();
                    this.loadItems();
                    this.loadCustomerMobiles();

                    this.salesForm.patchValue({ p_billno: billno, status: 'Done' });

                    // Patch print values after data refreshes
                    setTimeout(() => {
                        const current = this.billValue.find((b) => b.billno === billno);
                        if (current) this.patchPrintValues(current);
                    }, 500);

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Sales saved successfully!',
                        life: 3000
                    });

                    this.confirmationService.confirm({
                        header: 'Print Invoice',
                        message: 'Are you sure you want to print this invoice?',
                        acceptLabel: 'Print Now',
                        rejectLabel: 'Cancel',
                        icon: 'pi pi-print',
                        acceptButtonStyleClass: 'p-button-primary',
                        rejectButtonStyleClass: 'p-button-secondary',
                        accept: () => this.printInvoice()
                    });
                },
                error: (err) => {
                    console.error(err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save sales. Please try again.',
                        life: 3000
                    });
                }
            });
    }

    private buildRequestBody(body: any): Record<string, any> {
        return {
            p_transactiontype: 'SALE',
            p_transactionid: body.p_transactionid ?? 0,
            p_transactiondate: this.datepipe.transform(body.p_transactiondate, 'dd/MM/yyyy') ?? '',
            p_customername: body.p_customername ?? '',
            p_mobileno: body.p_mobileno ?? '',
            p_totalcost: Number(body.p_totalcost) || 0,
            p_totalsale: Number(body.p_totalsale) || 0,
            p_overalldiscount: Number(body.p_overalldiscount) || 0,
            p_roundoff: body.p_roundoff ? String(body.p_roundoff) : '0.00',
            p_totalpayable: Number(body.p_totalpayable) || 0,
            p_currencyid: Number(body.p_currencyid) || 0,
            p_custgstno: body.chalanno ?? '',
            p_gsttran: body.p_gsttran ? 'Y' : 'N',
            p_status: body.p_status ?? 'Done',
            p_isactive: 'Y',
            p_linktransactionid: 0,
            p_creditnoteno: body.p_deliveryboy ?? '',
            p_replacesimilir: body.p_disctype ? 'Y' : 'N',
            p_discounttype: body.p_disctype ? 'Y' : 'N',
            p_paymentmode: body.p_paymode ?? '',
            p_paymentdue: Number(body.p_paymentdue) || 0,
            p_sale: (body.p_sale ?? []).map((x: any) => ({
                TransactiondetailId: x.TransactiondetailId ?? 0,
                ItemId: x.ItemId,
                ItemName: x.ItemName,
                UOMId: x.UOMId,
                Quantity: x.Quantity,
                itemcost: x.itemcost,
                warrenty: x.warPeriod,
                MRP: x.MRP,
                hsncode: x.hsncode,
                totalPayable: x.totalPayable,
                currentstock: x.curStock
            }))
        };
    }

    patchPrintValues(apiData: any): void {
        this.salesForm.patchValue({
            p_transactionid: apiData.transactionid,
            discountvalueper: apiData.discountvalueper,
            sgst_9: apiData.sgst_9,
            cgst_9: apiData.cgst_9,
            tax_18: apiData.tax_18,
            amount_before_tax: apiData.amount_before_tax
        });
        this.salesForm.updateValueAndValidity();
    }

    // -------------------------------------------------------------------------
    //  Bill / customer events
    // -------------------------------------------------------------------------
    onBillDetails(event: { value: any }): void {
        const bill = this.billNoOptions.find((b) => b.billno === event.value);
        if (!bill) return;

        this.customerstate = bill.customerstate;
        this.salesForm.patchValue({
            p_transactionid: bill.transactionid,
            p_customername: bill.customername,
            p_transactiondate: bill.transactiondate ? new Date(bill.transactiondate) : null,
            p_mobileno: bill.mobileno,
            status: bill.status,
            p_paymode: bill.paymode,
            p_totalcost: bill.totalcost.toFixed(2),
            p_totalsale: bill.totalsale.toFixed(2),
            p_disctype: bill.discounttype === 'Y',
            chalanno: bill.customergstno,
            p_deliveryboy: bill.deliveryboy,
            p_overalldiscount: bill.discount,
            discountvalueper: bill.discountvalueper,
            p_roundoff: bill.roundoff,
            p_totalpayable: bill.totalpayable.toFixed(2),
            p_paymentdue: bill.amountpaid,
            sgst_9: bill.sgst_9,
            tax_18: bill.tax_18,
            cgst_9: bill.cgst_9,
            amount_before_tax: bill.amount_before_tax
        });

        this.loadSaleDetails(bill);
    }

    private loadSaleDetails(data: { transactionid: any }): void {
        this.inventoryService
            .Getreturndropdowndetails({ p_returntype: 'SALEDETAIL', p_returnvalue: data.transactionid })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    if (res.data?.length) {
                        this.salesForm.patchValue({ status: res.data[0].status ?? '' });
                        if (res.data[0].discounttype) {
                            this.salesForm.patchValue({ p_disctype: res.data[0].discounttype === 'Y' });
                        }
                    }
                    this.mapSaleItems(res.data ?? []);
                }
            });
    }

    // Keep old name for template backward-compat
    SaleDetails = this.loadSaleDetails.bind(this);

    onMobileFilter(event: { filter: string }): void {
        const val = event.filter;
        if (val && /^[6-9]\d{9}$/.test(val)) {
            this.salesForm.patchValue({ p_mobileno: val, p_customername: '' });
        }
        this.mobilePlaceholder = 'Mobile No';
    }

    onMobileSelect(event: { value: any }): void {
        const match = this.cusMobileOptions.find((c) => c.fieldid === event.value);
        if (!match) return;

        const mobile = match.fieldvalue?.match(/\d{10}/)?.[0] ?? '';
        this.salesForm.patchValue({
            p_mobileno: mobile,
            p_customername: match.fieldname,
            p_gstno: match.customergstno ?? '',
            p_gsttran: !!match.customergstno
        });
    }

    populateSaleForm(data: any, itemsData: any[]): void {
        this.customerstate = data.customerstate;
        this.salesForm.patchValue({
            p_customername: data.customername ?? '',
            p_mobileno: data.mobileno ?? '',
            p_deliveryboy: data.deliveryboy,
            p_gsttran: data.gstin ?? '',
            chalanno: data.customergstno,
            p_billno: data.billno ?? '',
            p_transactionid: data.transactionid ?? 0,
            p_transactiondate: data.transactiondate ? new Date(data.transactiondate) : new Date(),
            status: data.status ?? '',
            p_totalcost: data.totalcost ?? 0,
            p_totalsale: data.totalsale ?? 0,
            p_disctype: data.discounttype === 'Y',
            p_overalldiscount: data.discount ?? 0,
            discountvalueper: data.discountvalueper ?? 0,
            p_roundoff: data.roundoff ?? 0,
            p_totalpayable: data.totalpayable ?? 0,
            p_paymentdue: data.amountpaid,
            sgst_9: data.sgst_9 ?? 0,
            tax_18: data.tax_18 ?? 0,
            cgst_9: data.cgst_9 ?? 0,
            amount_before_tax: data.amount_before_tax ?? 0
        });

        this.saleArray.clear();

        itemsData?.forEach((item) => {
            this.saleArray.push(
                this.fb.group({
                    TransactiondetailId: [item.transactiondetailid ?? 0],
                    ItemId: [item.itemsku ?? 0],
                    ItemName: [item.itemname ?? ''],
                    UOMId: [item.uomid ?? 0],
                    UOMName: [item.uomname ?? ''],
                    UomName: [item.uomname],
                    Quantity: [item.quantity ?? 1],
                    itemcost: [item.itemcost ?? 0],
                    MRP: [item.mrp ?? 0],
                    totalPayable: [(item.quantity ?? 1) * (item.mrp ?? 0)],
                    curStock: [item.current_stock ?? 0],
                    warPeriod: [item.warrenty ?? 0],
                    location: [''],
                    hsncode: [item.hsncode],
                    itemsku: [item.itemsku ?? ''],
                    apiCost: [(item.quantity ?? 1) * (item.itemcost ?? 0)]
                })
            );

            const index = this.saleArray.length - 1;
            this.loadUOM(item.itemid ?? item.itemsku, index);
        });

        this.calculateSummary();
        this.updateTotalCostSummary();
    }

    // -------------------------------------------------------------------------
    //  Delivery person
    // -------------------------------------------------------------------------
    onDeliveryFilter(event: { filter: string }): void {
        this.filteredDeliveryText = event.filter.trim();
    }

    addDeliveryPerson(): void {
        const name = this.filteredDeliveryText;
        if (!name) return;

        const exists = this.deliveryBoyOptions.some((x) => x.fieldname.toLowerCase() === name.toLowerCase());
        if (exists) return;

        const newEntry = { fieldid: Date.now(), fieldname: name };
        this.deliveryBoyOptions = [...this.deliveryBoyOptions, newEntry];
        this.salesForm.get('p_deliveryboy')?.setValue(newEntry.fieldname);
        this.deliveryDropdown.hide();
        this.filteredDeliveryText = '';
    }

    // -------------------------------------------------------------------------
    //  Navigation
    // -------------------------------------------------------------------------
    back(): void {
        const dest = this.fromPage === 'approval' ? '/layout/settings/my-approval' : '/layout/pos/invoice';
        this.route.navigate([dest]);
    }

    customerDetail(): void {
        this.route.navigate(['/layout/settings/category-formate', 'customermaster']);
    }

    // -------------------------------------------------------------------------
    //  Utility
    // -------------------------------------------------------------------------
    allowOnlyNumbers(event: KeyboardEvent): void {
        const input = event.target as HTMLInputElement;
        if (input.value.length >= 10 || !/^[0-9]$/.test(event.key)) {
            event.preventDefault();
        }
    }

    blockDecimal(event: KeyboardEvent): void {
        if (['.', ',', 'e', 'E', '-'].includes(event.key)) {
            event.preventDefault();
        }
    }

    // -------------------------------------------------------------------------
    //  Print
    // -------------------------------------------------------------------------
    printInvoice(): void {
        const contents = document.getElementById('invoicePrintSection')?.innerHTML;
        if (!contents) return;

        const win = window.open('', '_blank', 'width=900,height=1500');
        if (!win) return;

        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @page { margin: 0; size: auto; }
                    body  { font-family: Arial, sans-serif; }
                </style>
            </head>
            <body>
                ${contents}
                <script>
                    window.onload = function () {
                        window.print();
                        window.onafterprint = function () { window.close(); };
                    };
                <\/script>
            </body>
            </html>
        `);
        win.document.close();
    }
}
