import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, inject} from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
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
import { AddinventoryComponent } from '@/pages/inventory/addinventory/addinventory.component';
import { AuthService } from '@/core/services/auth.service';
import { OrderService } from '@/core/services/order.service';
import { ShareService } from '@/core/services/shared.service';

@Component({
    selector: 'app-indent',
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
    templateUrl: './indent.component.html',
    styleUrl: './indent.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class IndentComponent {
    isBarcodeScan = false;
    isAutoSelect = false; // works for barcode + click

    // -----------------------------
    //  Component state / Variables
    // -----------------------------
    @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;
    @ViewChildren('uomDropdown') uomDropdown!: QueryList<Dropdown>;
    @ViewChild('deliveryperson') deliveryperson!: Dropdown;
    ngAfterViewInit() {
        setTimeout(() => {
            this.focusBarcode();
        });
    }
    focusBarcode() {
        if (this.barcodeInput?.nativeElement) {
            this.barcodeInput.nativeElement.focus();
        }
    }
    onBarcodeScan(event: Event) {
        this.isBarcodeScan = true;
        const input = event.target as HTMLInputElement;
        const barcode = input?.value?.trim();
        if (!barcode) return;

        const matchedItem = this.itemOptions.find((item) => item.itembarcode === barcode || item.itemsku === barcode || item.itemid == barcode);

        if (!matchedItem) {
            this.messageService.add({
                severity: 'error',
                summary: 'Item Not Found',
                detail: `No item found for ${barcode}`,
                life: 2000
            });
            this.clearBarcodeInput();
            return;
        }

        // 🔹 mark barcode flow
        this.isAutoSelect = true;
        this.indentForm.get('p_itemdata')?.setValue(matchedItem.itemid);
        this.OnItemChange({ value: matchedItem.itemid });
        this.clearBarcodeInput();
        this.isBarcodeScan = false; // 🔑 reset after scan
    }

    focusLastRowUOM() {
        setTimeout(() => {
            const dropdowns = this.uomDropdown.toArray();
            const lastDropdown = dropdowns[dropdowns.length - 1];
            if (lastDropdown) {
                lastDropdown.focus();
            }
        });
    }
    simulateScan(barcode: string) {
        this.onBarcodeScan({
            target: { value: barcode }
        } as unknown as Event);
    }

    clearBarcodeInput() {
        if (this.barcodeInput?.nativeElement) {
            this.barcodeInput.nativeElement.value = '';
            this.barcodeInput.nativeElement.focus();
        }
    }

    keepBarcodeFocus(event: MouseEvent) {
        const target = event.target as HTMLElement;

        // If user clicked on an input or textarea → DO NOTHING
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        // Otherwise keep barcode focused
        this.barcodeInput?.nativeElement?.focus();
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardSubmit(event: KeyboardEvent) {
        // Ctrl + Enter
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            this.onSubmit();
        }
    }

    @ViewChild('itemSel') itemSel!: any;
    public transactionid: any;
    indentForm!: FormGroup;
    visibleDialog = false;
    selectedRow: any = null;
    mode: 'add' | 'edit' = 'add';
    pagedProducts: StockIn[] = [];
    first: number = 0;
    rowsPerPage: number = 10;
    products: StockIn[] = [];
    today: Date = new Date();
    submitDisabledByBill: boolean = false;
    public authService = inject(AuthService);
    public getUserDetails = {};
    itemOptions: any[] = [];
    profileOptions: any = {};
    public itemOptionslist: [] = [];
    public uomlist: any[] = [];
      requestedByOptions :any[]= [];
    filteredDeliveryText = '';
    Uomid: string = '';
    mobilePlaceholder: string = 'Mobile No';
    isLoadingBills: boolean = false;
    billValue: any = null;
    customerstate:string='';
    companyName: string = '';
    companyAddress: string = '';
    companycity: string = '';
    companystate: string = '';
    statecode: string = '';
    companyemail: string = '';
    companygstno: string = '';
    bankname: string = '';
    accountno: string = '';
    branchname: string = '';
    ifsc: string = '';
    pan: string = '';
    @ViewChild(AddinventoryComponent) addInventoryComp!: AddinventoryComponent;

    // Dropdowns / lists
    indentNoOptions: any[] = [];
  
    // -----------------------------
    //  Constructor + Lifecycle
    // -----------------------------
    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService,
        private salesService: InventoryService,
        private messageService: MessageService,
        private orderService: OrderService,
        public datepipe: DatePipe,
        private sharedService: ShareService,
    ) {}

    ngOnInit(): void {
        this.OnGetDropdown();
        this.loadAllDropdowns();

        // Initialize form
        this.indentForm = this.fb.group(
            {
                p_itemdata: [null],
                p_transactiontype: [''],
                p_itemid: [null],
                p_indentno: [null],
                p_transactionid: [0],
                p_transactiondate: [this.today, [Validators.required]],
                searchMobileNo: [''],
                p_requestedby: ['', Validators.maxLength(100)],
                p_currencyid: [0],
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
                discountvalueper: [],
                amount_before_tax: [''],
                // FormArray for sale rows
                p_sale: this.fb.array([])
            }
        );
        this.indentForm.get('p_indentno')?.valueChanges.subscribe((value) => {
            if (value) {
                this.disableItemSearchSubmit();
            } else {
                this.enableItemSearchAndSubmit();
            }
        });
    }
    // -----------------------------
    //  FormArray Getters / Helpers
    // -----------------------------

    get saleArray(): FormArray {
        return this.indentForm.get('p_sale') as FormArray;
    }

    // Return FormArray rows as FormGroup[] for template binding (fixes typing issue)
    get saleRows(): FormGroup[] {
        return this.saleArray.controls as FormGroup[];
    }
    disableItemSearchSubmit() {
        this.indentForm.get('itemSearch')?.disable();
        this.submitDisabledByBill = true;
    }
    enableItemSearchAndSubmit() {
        this.indentForm.get('itemSearch')?.enable();
        this.submitDisabledByBill = false;
    }
    get isPrintDisabled(): boolean {
        const billNo = this.indentForm.get('p_indentno')?.value;
        const hasItem = this.saleArray.length > 0;

        // Disable print if BOTH are empty
        return !(billNo || hasItem);
    }

    // Sales Array => Create a FormGroup for a sale item
    createSaleItem(data?: any): FormGroup {
        return this.fb.group({
            TransactiondetailId: this.indentForm.controls['p_transactionid'].value || 0,
            ItemId: [data?.itemid || 0],
            ItemName: [data?.itemname || ''],
            UOMId: [data?.uomid || 0],
            UomName: [data?.uomname || ''],
            Quantity: [1],
            itemcost: [data?.pruchaseprice || 0],
            MRP: [data?.saleprice || 0],
            totalPayable: [data ? data.saleprice : 0],
            curStock: [data?.currentstock || 0],
            warPeriod: [data?.warrentyperiod || 0],
            location: [data?.location || ''],
            itemsku: [data?.itemsku || ''],
            hsncode: [data?.hsncode],
            apiCost: [0] // ⭐ IMPORTANT ⭐
        });
    }

    // Map API sale items (array) into the FormArray
    mapSaleItems(apiItems: any[]) {
        this.saleArray.clear(); // Remove old rows if any
        this.uomlist = [];
        apiItems.forEach((item, index) => {
            this.saleArray.push(
                this.fb.group({
                    TransactiondetailId: item.transactiondetailid || 0,
                    ItemId: item.itemid || 0, // use itemsku when itemid not present
                    ItemName: item.itemname || '',
                    UOMId: item.uomname || 0,
                    UomName: [item.uomname || ''],
                    Quantity: item.quantity || 1,
                    itemcost: item.itemcost || 0,
                    MRP: (item.mrp || 0).toFixed(2),
                    totalPayable: ((item.quantity || 1) * (item.mrp || 0)).toFixed(2),
                    curStock: item.current_stock || 0,
                    warPeriod: item.warrenty || 0,
                    location: '',
                    hsncode: item.hsncode,
                    itemsku: item.itemsku || ''
                })
            );
            console.log('uomvalue', this.saleArray.at(index).get('UOMId')?.value);
            const uomValue = this.saleArray.at(index).get('UOMId')?.value;
            this.OnUMO(item.itemid || item.itemsku, index, uomValue);
        });

        // If items were added, update totals for the last row and overall summary
        const index = this.saleArray.length - 1;

        this.updateTotal(index);
        this.calculateSummary();
    }
    allowOnlyNumbers(event: any) {
        const input = event.target as HTMLInputElement;

        // Block if length is already 10
        if (input.value.length >= 10) {
            event.preventDefault();
            return;
        }

        const char = String.fromCharCode(event.which);

        // Block if not a number (0-9)
        if (!/^[0-9]$/.test(char)) {
            event.preventDefault();
        }
    }

    // Generic payload creator
    createDropdownPayload(returnType: string) {
        return {
            p_returntype: returnType
        };
    }

    // Load items used in dropdowns
    OnGetItem() {
        const payload = this.createDropdownPayload('ITEM');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.log(err)
        });
    }

    OnGetRequested() {
        const payload = this.createDropdownPayload('DELIVERY');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.requestedByOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    OnGetProfile() {
        const payload = this.createDropdownPayload('PROFILE');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    this.profileOptions = res.data;
                    const profile = res.data[0];
                    ((this.companyName = profile.companyname),
                        (this.companyAddress = profile.companyaddress),
                        (this.companystate = profile.state_name),
                        (this.companycity = profile.city_name),
                        (this.companyemail = profile.companyemail),
                        (this.companygstno = profile.companygstno),
                        (this.statecode = profile.statecode),
                        (this.bankname = profile.bankname),
                        (this.accountno = profile.accountno),
                        (this.branchname = profile.branch),
                        (this.ifsc = profile.ifsc),
                        (this.pan = profile.pan));
                }
            },
            error: (err) => console.log(err)
        });
    }

    // Load initial dropdowns (items, bill no)this.OngetcalculatedMRP
    loadAllDropdowns() {
        this.OnGetItem();
        this.OnGetBillNo();
        this.OnGetRequested();
        this.OnGetProfile();
    }

    onRequestedFilter(event: any) {
        this.filteredDeliveryText = event.filter.trim();
    }
    OnaddRequestedPerson() {
        if (!this.filteredDeliveryText) return;
        const exists = this.requestedByOptions.some((x) => x.fieldname.toLowerCase() === this.filteredDeliveryText.toLowerCase());
        if (exists) return;
        const newItem = {
            fieldid: Date.now(),
            fieldname: this.filteredDeliveryText
        };
        this.requestedByOptions = [...this.requestedByOptions, newItem];
        this.indentForm.get('p_requestedby')?.setValue(newItem.fieldname);
        this.deliveryperson.hide();
        this.filteredDeliveryText = '';
    }
    // Load dropdown via older endpoint (Getreturndropdowndetails)
    OnGetDropdown() {
        const payload = {
            ...this.getUserDetails,
            p_returntype: 'ITEM'
        };
        this.salesService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                console.log('result:', res);
                this.itemOptionslist = res.data;
            },
            error: (err) => console.log(err)
        });
    }

    // Load Bill No dropdown
    OnGetBillNo() {
        const loginusername = this.authService.isLogIntType().username;
        const payload = {
            p_returntype: 'NEWTRANSACTIONID',
            p_username: loginusername
        };
        this.salesService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                const billdata: any = res.data;
                this.indentNoOptions = billdata.filter((item: { billno: null }) => item.billno != null);
                this.billValue = this.indentNoOptions;
            },
            error: (err) => console.log(err)
        });
    }

    // Called when an item is selected from the item dropdown
    OnItemChange(event: any) {
        const latetData = this.itemOptions.find((item) => item.itemid == event.value);
        if (!latetData) return;

        // Prevent duplicate item
        const alreadyExists = this.saleArray.controls.some((row) => row.get('ItemId')?.value === latetData.itemid);

        if (alreadyExists) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Item',
                detail: `${latetData.itemname} is already added.`,
                life: 2000
            });

            // Clear dropdown on duplicate
            this.indentForm.get('p_itemdata')?.setValue(null, { emitEvent: false });
            this.isAutoSelect = false;
            return;
        }

        // Add new row
        this.saleArray.push(this.createSaleItem(latetData));
        this.focusLastRowUOM();
        const index = this.saleArray.length - 1;

        // Load UOM list
        this.OnUMO(event.value, index);

        // Calculate MRP
        this.calculateMRP(index);

        // 🔑 KEY CHANGE HERE
        // Clear only when NOT auto-select (barcode / programmatic)
        if (!this.isAutoSelect) {
            this.indentForm.get('p_itemdata')?.setValue(null, { emitEvent: false });
        }

        this.isAutoSelect = false; // reset after use
        this.calculateSummary();
    }

    // Called when bill dropdown value changes
    onBillDetails(event: any) {
        const billDetails = this.indentNoOptions.find((billitem) => billitem.billno === event.value);
        if (billDetails) {
            this.SaleDetails(billDetails);
            this.customerstate = billDetails.customerstate
            this.indentForm.patchValue({
                p_transactionid: billDetails.transactionid,
                p_transactiondate: billDetails.transactiondate ? new Date(billDetails.transactiondate) : null,
                status: billDetails.status,
                p_requestedby: billDetails.deliveryboy,
                discountvalueper: billDetails.discountvalueper,
                sgst_9: billDetails.sgst_9,
                tax_18: billDetails.tax_18,
                cgst_9: billDetails.cgst_9,
                amount_before_tax: billDetails.amount_before_tax
            });
        }
    }

    // SaleDetails → fetch sale detail and map items
    SaleDetails(data: any) {
        const apibody = {
            ...this.getUserDetails,
            p_returntype: 'SALEDETAIL',
            p_returnvalue: data.transactionid
        };

        this.stockInService.Getreturndropdowndetails(apibody).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    this.indentForm.patchValue({
                        status: res.data[0].status || ''
                    });
                }
                this.mapSaleItems(res.data);
            }
        });
    }

    // -----------------------------
    //  Row operations (remove / block decimals)
    // -----------------------------

    // Remove a row from FormArray and update totals
    removeItem(i: number) {
        // Remove row from FormArray
        this.saleArray.removeAt(i);

        // 🔥 FIX: Remove its UOM list to keep index sync
        if (this.uomlist && Array.isArray(this.uomlist)) {
            this.uomlist.splice(i, 1);
        }
        this.updateTotalCostSummary();
        // If no items left → reset summary
        if (this.saleArray.length === 0) {
            // this.updateTotalCostSummary()
            this.calculateSummary();
            return;
        }

        // Otherwise update totals based on last valid row
        const index = this.saleArray.length - 1;
        this.updateTotal(index);
    }

    // Prevent decimal input in quantity field (keyboard)
    blockDecimal(event: KeyboardEvent) {
        if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E' || event.key === '-') {
            event.preventDefault(); // block decimal
        }
    }

    // Returns true when submit should be disabled
    isSubmitDisabled(): boolean {
        if (this.saleArray.length === 0) return true;
        for (let row of this.saleArray.controls) {
            if (row.get('Quantity')?.errors?.['maxStock']) return true;
        }
        if (!this.indentForm.get('p_transactiondate')?.value) return true;
        for (let row of this.saleArray.controls) {
            const qty = Number(row.get('Quantity')?.value || 0);
            const stock = Number(row.get('curStock')?.value || 0);
            if (qty === 0) return true;
            if (qty > stock) return true;
        }
        return false;
    }

    // Submit handler with confirmation and validation
    onSubmit() {
        if (this.isBarcodeScan) {
            return;
        }
        if (this.isSubmitDisabled()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Failed',
                detail: 'Please correct all errors before submitting.',
                life: 2500
            });
            return;
        }

        this.confirmationService.confirm({
            message: 'Are you sure you want to submit?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.OnSalesHeaderCreate(this.indentForm.value);
            }
        });
    }

    // Reset form and clear sale array
    onReset() {
        this.indentForm.reset();
        this.saleArray.clear();
        this.indentForm.get('p_transactiondate')?.setValue(this.today);
    }

    calculateSummary() {
        let totalMRP = 0;

        this.saleArray.controls.forEach((row: AbstractControl) => {
            const qty = Number(row.get('Quantity')?.value || 0);
            const mrp = Number(row.get('MRP')?.value || 0);

            totalMRP += qty * mrp;
        });

    }

    // Update a specific row total, ensure stock constraints
    updateTotal(i: number) {
        const row = this.saleArray.at(i);

        const qty = Number(row.get('Quantity')?.value || 0);
        const stock = Number(row.get('curStock')?.value || 0);
        const mrp = Number(row.get('MRP')?.value || 0);

        if (qty > stock) {
            row.get('Quantity')?.setErrors({ maxStock: true });
            this.messageService.add({
                severity: 'warn',
                summary: 'Stock Limit Exceeded',
                detail: `Only ${stock} units available.`,
                life: 2000
            });
            return;
        } else {
            row.get('Quantity')?.setErrors(null);
        }

        row.patchValue({
            totalPayable: qty * mrp // ⭐ FINAL FIX REMAINS
        });

        this.calculateSummary();
        this.indentForm.updateValueAndValidity();
    }

    // -----------------------------
    //  API Body Cleaning & Submit
    // -----------------------------

    // Prepare a clean request body matching the API expectations
    cleanRequestBody(body: any) {
        const formattedDate = this.datepipe.transform(body.p_transactiondate, 'dd/MM/yyyy');
        return {
            ...this.getUserDetails,
            p_transactiontype: 'SALE',
            p_transactionid: body.p_transactionid ?? 0,
            p_transactiondate: formattedDate || '',
            p_customername: '',
            p_mobileno:  '',
            p_totalcost: 0,
            p_totalsale: 0,
            p_overalldiscount: 0,
            p_roundoff:'0.00',
            p_totalpayable: 0,
            p_currFencyid: Number(body.p_currencyid) || 0,
            p_custgstno:0,
            p_gsttran:'',
            p_status: body.p_status || 'Done',
            p_isactive: 'Y',
            p_linktransactionid: 0,
            p_creditnoteno: body.p_requestedby || '',
            p_replacesimilir:'',
            p_discounttype: '',
            p_paymentmode: '',
            p_paymentdue:  0,
            p_sale: (body.p_sale || []).map((x: any) => ({
                TransactiondetailId: x.TransactiondetailId || 0,
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

    // Send header (and sale) to API, show toast notifications on result
    OnSalesHeaderCreate(data: any) {
        const apibody = this.cleanRequestBody(this.indentForm.value);

        this.stockInService.OninsertSalesDetails(apibody).subscribe({
            next: (res) => {
                const billno = res.data[0]?.billno;
                this.OnGetBillNo();
                this.OnGetItem();
                this.indentForm.controls['p_indentno'].setValue(billno);
                if (res.data && res.data.length > 0) {
                    this.indentForm.patchValue({
                        status: 'Done'
                    });
                }
                console.log('uom', this.indentForm.get('p_sale')?.value);
                setTimeout(() => {
                    if (this.billValue) {
                        const currentBill = this.billValue.find((bill: any) => bill.billno === billno);
                        if (currentBill) {
                            this.patchPrintValues(currentBill);
                        }
                    }
                }, 500);
                console.log('res', res);
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
                    accept: () => {
                        this.printInvoice();
                    }
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
    patchPrintValues(apiData: any) {
        const patchData: any = {};
        patchData.p_transactionid = apiData.transactionid;
        patchData.discountvalueper = apiData.discountvalueper;
        patchData.sgst_9 = apiData.sgst_9;
        patchData.cgst_9 = apiData.cgst_9;
        patchData.tax_18 = apiData.tax_18;
        patchData.amount_before_tax = apiData.amount_before_tax;
        this.indentForm.patchValue(patchData);
        this.indentForm.updateValueAndValidity();
    }
    // -----------------------------
    //  Utility / Misc
    // -----------------------------

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    OnUMO(value: any, index: number, uomValue?: string) {
        const apibody = {
            ...this.getUserDetails,
            p_returntype: 'SALEUOM',
            p_returnvalue: value
        };

        this.salesService.Getreturndropdowndetails(apibody).subscribe({
            next: (res) => {
                if (!res?.data || res.data.length === 0) {
                    return;
                }

                this.uomlist[index] = [...res.data];

                const row = this.saleArray.at(index);

                let selectedUom = null;

                if (uomValue) {
                    selectedUom = this.uomlist[index].find((u: any) => u.fieldid == uomValue || u.fieldname == uomValue);
                }

                if (!selectedUom && !row.get('UOMId')?.value) {
                    selectedUom = this.uomlist[index][0];
                }

                if (!selectedUom) return;

                row.patchValue({
                    UOMId: selectedUom.fieldid,
                    UomName: selectedUom.fieldname
                });

                this.calculateMRP(index);
            }
        });
    }

    OngetcalculatedMRP(data: any, index: number) {
        const row = this.saleArray.at(index);

        const qty = Number(row.get('Quantity')?.value || 1);

        let apibody = {
            ...this.getUserDetails,
            p_itemid: data.ItemId,
            p_qty: qty,
            p_uomid: data.UOMId
        };

        delete (apibody as any).p_loginuser;

        this.orderService.getcalculatedMRP(apibody).subscribe({
            next: (res: any) => {
                const mrp = Number(res.data.totalmrp || 0);
                const cost = Number(res.data.totalcost || 0);
                const conversion = Number(res.data.conversion || 1);

                // 🔹 Base stock (store once)
                const row = this.saleArray.at(index) as FormGroup;

                if (!row.contains('baseStock')) {
                    row.addControl('baseStock', new FormControl(Number(row.get('curStock')?.value || 0)));
                }

                const baseStock = Number(row.get('baseStock')?.value || 0);

                // 🔹 Converted stock based on UOM
                const convertedStock = baseStock * conversion;

                // 🔹 Patch values
                row.patchValue({
                    MRP: mrp,
                    itemcost: cost,
                    apiCost: qty * cost,
                    curStock: convertedStock
                });

                this.updateTotalCostSummary();
                this.calculateSummary();
            }
        });
    }

    UOMId(event: any, index: number) {
        const row = this.saleArray.at(index);

        const selectedUom = this.uomlist[index]?.find((u: any) => u.fieldid === event.value);

        if (!selectedUom) return;

        row.patchValue({
            UOMId: selectedUom.fieldid,
            UomName: selectedUom.fieldname
        });

        this.OngetcalculatedMRP(
            {
                ItemId: row.get('ItemId')?.value,
                UOMId: selectedUom.fieldid
            },
            index
        );
    }
    calculateMRP(index: number) {
        const row = this.saleArray.at(index);

        const qty = Number(row.get('Quantity')?.value || 1);
        const uomid = row.get('UOMId')?.value;
        const itemId = row.get('ItemId')?.value;

        if (!uomid || qty <= 0) return;

        let apibody = {
            ...this.getUserDetails,
            p_itemid: itemId,
            p_qty: qty,
            p_uomid: uomid
        };

        delete (apibody as any).p_loginuser;

        this.orderService.getcalculatedMRP(apibody).subscribe({
            next: (res: any) => {
                if (res.success) {
                    const cost = Number(res?.data.totalcost || 0);

                    // ⭐ IMPORTANT — Update purchase price also
                    row.patchValue({
                        itemcost: cost, // <-- FIXED
                        apiCost: qty * cost // <-- used for cost summary
                    });
                }

                this.updateTotalCostSummary();
                this.calculateSummary();
            }
        });
    }

    OnQtyChange(index: number) {
        this.calculateMRP(index);
    }
    calculateItemCost(row: AbstractControl, apiCost: number | null | undefined): number {
        const qty = Number(row.get('Quantity')?.value || 0);
        const itemcost = Number(row.get('itemcost')?.value || 0);

        // If API sent cost AND it is a valid number → use it
        if (apiCost !== null && apiCost !== undefined && !isNaN(apiCost)) {
            return Number(apiCost);
        }

        // Otherwise fallback → qty × itemcost
        return qty * itemcost;
    }
    updateTotalCostSummary() {
        let finalCost = 0;

        this.saleArray.controls.forEach((row: AbstractControl) => {
            const qty = Number(row.get('Quantity')?.value || 0);
            const cost = Number(row.get('itemcost')?.value || 0);

            finalCost += qty * cost; // ⭐ UOM adjusted cost
        });

    }

    printInvoice() {
        const printContents = document.getElementById('invoicePrintSection')?.innerHTML;
        if (!printContents) return;
        const popupWindow = window.open('', '_blank', 'width=900,height=1500');
        popupWindow!.document.open();
        popupWindow!.document.write(`
     <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                           @page {
                        margin: 0;
                        size: auto;
                    }
                            /* Your print styles here */
                            body { font-family: Arial, sans-serif; }
                            /* Add more styles as needed */
                        </style>
                    </head>
                    <body>
                        ${printContents}
                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            };
                        </script>
                    </body>
                    </html>
  `);

        popupWindow!.document.close();
    }
}
