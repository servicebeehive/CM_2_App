import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
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
import { AddinventoryComponent } from '@/pages/inventory/addinventory/addinventory.component';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
import { OrderService } from '@/core/services/order.service';
import { ShareService } from '@/core/services/shared.service';
import { Router } from '@angular/router';
// import { NgxPrintModule } from 'ngx-print';

@Component({
    selector: 'app-sales',
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
        // NgxPrintModule
        // AddinventoryComponent,
        // GlobalFilterComponent
    ],
    templateUrl: './sales.component.html',
    styleUrl: './sales.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class SalesComponent {
    isBarcodeScan = false;
    isAutoSelect = false; // works for barcode + click
    


    // -----------------------------
    //  Component state / Variables
    // -----------------------------
    @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;
    @ViewChildren('uomDropdown') uomDropdown!:QueryList<Dropdown>;
ngAfterViewInit() {
    setTimeout(()=>{
       this.focusBarcode(); 
    })
}
focusBarcode(){
 if (this.barcodeInput?.nativeElement) {
    this.barcodeInput.nativeElement.focus();
  }
}
onBarcodeScan(event: Event) {
this.isBarcodeScan=true
  const input = event.target as HTMLInputElement;
  const barcode = input?.value?.trim();
  if (!barcode) return;

  const matchedItem = this.itemOptions.find(
    (item) =>
      item.itembarcode === barcode ||
      item.itemsku === barcode ||
      item.itemid == barcode
  );

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
this.salesForm.get('p_itemdata')?.setValue(matchedItem.itemid);
this.OnItemChange({ value: matchedItem.itemid });
  this.clearBarcodeInput();
 this.isBarcodeScan = false; // 🔑 reset after scan
}

focusLastRowUOM(){
    setTimeout(()=>{
        const dropdowns= this.uomDropdown.toArray();
        const lastDropdown = dropdowns[dropdowns.length-1];
        if(lastDropdown){
            lastDropdown.focus();
        }
    })
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
// @HostListener('window:click')
// keepBarcodeFocus() {
//   this.barcodeInput?.nativeElement?.focus();
// }



keepBarcodeFocus(event: MouseEvent) {
  const target = event.target as HTMLElement;

  // If user clicked on an input or textarea → DO NOTHING
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) {
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

    @ViewChild('itemSel') itemSel!:any;
    public transactionid: any;
    salesForm!: FormGroup;
    visibleDialog = false;
    selectedRow: any = null;
    mode: 'add' | 'edit' = 'add';
    pagedProducts: StockIn[] = [];
    first: number = 0;
    rowsPerPage: number = 5;
    products: StockIn[] = [];
    today: Date = new Date();
    submitDisabledByBill: boolean = false;
    discountplace: string = 'Enter Amount';
    public authService = inject(AuthService);
    public getUserDetails = {};
    itemOptions: any[] = [];
    cusMobileOptions: any[] = [];
    profileOptions:any={};
    public itemOptionslist: [] = [];
    public uomlist: any[] = [];
    Uomid:string='';
    mobilePlaceholder: string = 'Mobile No';
    backshow: boolean = false;
    isLoadingBills: boolean = false;
    billValue:any=null;
    companyName:string='';
    companyAddress:string='';
    companycity:string='';
    companystate:string='';
    statecode:string='';
    companyemail:string='';
    companygstno:string='';
    bankname:string='';
    accountno:string='';
    branchname:string='';
    ifsc:string='';
    pan:string='';
    @ViewChild(AddinventoryComponent) addInventoryComp!: AddinventoryComponent;

    // Dropdowns / lists
    billNoOptions: any[] = [];
    transactionMode:any[]=[
        {label:'Cash',value:'Cash'},
        {label:'UPI',value:'UPI'},
        {label:'Card',value:'Card'}
    ];
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
        private route: Router
    ) {}

    ngOnInit(): void {
        this.OnGetDropdown();
        this.loadAllDropdowns();

        // Initialize form
        this.salesForm = this.fb.group(
            {
                p_itemdata: [null],
                p_transactiontype: [''],
                p_itemid: [null],
                p_billno: [null],
                p_transactionid: [0],
                p_transactiondate: [this.today, [Validators.required]],
                p_customername: ['', [Validators.required,Validators.maxLength(100)]],
                p_mobileno: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
                searchMobileNo: [''],
                p_paymode:['Cash'],
                p_totalcost: [0],
                p_totalsale: [0],
                p_deliveryboy:['',Validators.maxLength(100)],
                p_disctype: [false],
                p_overalldiscount: [''],
                p_roundoff: [''],
                p_totalpayable: [0],
                p_currencyid: [0],
                p_paymentdue: [''],
                p_gsttran: [true],
                status: [''],
                p_status: [''],
                p_isactive: [''],
                p_loginuser: [''],
                p_linktransactionid: [0],
                p_replacesimilir: [''],
                p_creditnoteno: [''],
                p_paymentmode: [''],
                UomName:[''],
                HsnCode:[''],
                sgst_9: [''],
                tax_18: [''],
                cgst_9: [''],
                discountvalueper: [],
                amount_before_tax: [''],
                // FormArray for sale rows
                p_sale: this.fb.array([])
            },
            {
                validators: [this.costGreaterThanSaleValidator(), this.paidAmountLessThanFinalAmount()]
            }
        );
        this.salesForm.get('p_billno')?.valueChanges.subscribe((value) => {
            if (value) {
                this.disableItemSearchSubmit();
            } else {
                this.enableItemSearchAndSubmit();
            }
        });
        this.salesForm.get('p_disctype')?.valueChanges.subscribe((value) => {
            if (!value) {
                this.discountplace = 'Enter Amount';
            } else {
                this.discountplace = 'Enter %';
            }
            //  this.salesForm.get('p_overalldiscount')?.setValue('', { emitEvent: false });
            this.applyDiscount();
        });
        const navigation = history.state;
        console.log('Navigation state:', navigation);

        if (navigation && navigation.saleData && navigation.itemsData) {
            this.backshow = true;
            this.mode = navigation.mode || 'edit';
            this.populateSaleForm(navigation.saleData, navigation.itemsData);
        }
        this.setupBackButtonListener();
    }

    // -----------------------------
    //  FormArray Getters / Helpers
    // -----------------------------

    get saleArray(): FormArray {
        return this.salesForm.get('p_sale') as FormArray;
    }

    // Return FormArray rows as FormGroup[] for template binding (fixes typing issue)
    get saleRows(): FormGroup[] {
        return this.saleArray.controls as FormGroup[];
    }
    disableItemSearchSubmit() {
        this.salesForm.get('itemSearch')?.disable();
        this.submitDisabledByBill = true;
    }
    enableItemSearchAndSubmit() {
        this.salesForm.get('itemSearch')?.enable();
        this.submitDisabledByBill = false;
    }
    get isPrintDisabled(): boolean {
        const billNo = this.salesForm.get('p_billno')?.value;
        const hasItem = this.saleArray.length > 0;

        // Disable print if BOTH are empty
        return !(billNo || hasItem);
    }
    setupBackButtonListener() {
        // This helps preserve state when using browser back button
        window.addEventListener('beforeunload', () => {
            // If user refreshes sales page, we don't want to preserve invoice state
            this.sharedService.clearInvoiceState();
        });
    }

    ngOnDestroy() {
        // Optional: Clear event listener
        window.removeEventListener('beforeunload', () => {});
    }
    // -----------------------------
    //  Row Creation / Mapping
    // -----------------------------

    // Sales Array => Create a FormGroup for a sale item
    createSaleItem(data?: any): FormGroup {
        return this.fb.group({
            TransactiondetailId: this.salesForm.controls['p_transactionid'].value || 0,
            ItemId: [data?.itemid || 0],
            ItemName: [data?.itemname || ''],
            UOMId: [data?.uomid || 0],
            UomName:[data?.uomname || ''],
            Quantity: [1],
            itemcost: [data?.pruchaseprice || 0],
            MRP: [data?.saleprice || 0],
            totalPayable: [data ? data.saleprice : 0],
            curStock: [data?.currentstock || 0],
            warPeriod: [data?.warrentyperiod || 0],
            location: [data?.location || ''],
            itemsku: [data?.itemsku || ''],

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
                    UomName:[item.uomname || ''],
                    Quantity: item.quantity || 1,
                    itemcost: item.itemcost || 0,
                    MRP: (item.mrp || 0).toFixed(2),
                    totalPayable: ((item.quantity || 1) * (item.mrp || 0)).toFixed(2),
                    curStock: item.current_stock || 0,
                    warPeriod: item.warrenty || 0,
                    location: '',
                    itemsku: item.itemsku || ''
                })
            );
            console.log('uomvalue',this.saleArray.at(index).get('UOMId')?.value)
            const uomValue=this.saleArray.at(index).get('UOMId')?.value;
            this.OnUMO(item.itemid || item.itemsku, index,uomValue);
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

    // -----------------------------
    //  Dropdown / Data Loading
    // -----------------------------
    onMobileFilter(event: any) {
        const typedValue = event.filter;
        this.mobilePlaceholder = typedValue || 'Mobile No';

        // Only update form control if typed value is 10 digits
        if (typedValue && /^[6-9]\d{9}$/.test(typedValue)) {
            this.salesForm.patchValue({
                p_mobileno: typedValue
            });
            this.mobilePlaceholder = 'Mobile No';
        } else {
            this.mobilePlaceholder = 'Mobile No';
        }
    }
    onMobileSelect(event: any) {
        const mobileSelection = this.cusMobileOptions.find((mobileNo) => mobileNo.fieldid === event.value);
        if (mobileSelection) {
            this.salesForm.patchValue({
                p_mobileno: mobileSelection.customerphone,
                p_customername: mobileSelection.fieldname
            });
        }
    }

    populateSaleForm(data: any, itemsData: any[]) {
        console.log('Populating form with header:', data);
        console.log('Populating form with items:', itemsData);
        this.salesForm.patchValue({
            p_customername: data.customername || '',
            p_mobileno: data.mobileno || '',
            p_deliveryboy:data.deliveryboy,
            p_gsttran: data.gstin || '',
            p_billno: data.billno || '',
            p_transactionid: data.transactionid || 0,
            p_transactiondate: data.transactiondate ? new Date(data.transactiondate) : new Date(),
            status: data.status || '',
            p_totalcost: data.totalcost || 0,
            p_totalsale: data.totalsale || 0,
            p_disctype: data.discounttype === 'Y',
            p_overalldiscount: data.discount || 0,
            discountvalueper: data.discountvalueper || 0,
            p_roundoff: data.roundoff || 0,
            p_totalpayable: data.totalpayable || 0,
            p_paymentdue:data.amountpaid,
            sgst_9: data.sgst_9 || 0,
            tax_18: data.tax_18 || 0,
            cgst_9: data.cgst_9 || 0,
            amount_before_tax: data.amount_before_tax || 0
        });
        this.saleArray.clear();

        // Add items to FormArray
        if (itemsData && itemsData.length > 0) {
            itemsData.forEach((item: any) => {
                this.saleArray.push(
                    this.fb.group({
                        TransactiondetailId: item.transactiondetailid || 0,
                        ItemId: item.itemsku || 0,
                        ItemName: item.itemname || '',
                        UOMId: item.uomid || 0,
                        UOMName: item.uomname || '',
                        Quantity: item.quantity || 1,
                        itemcost: item.itemcost || 0,
                        MRP: item.mrp || 0,
                        totalPayable: (item.quantity || 1) * (item.mrp || 0),
                        curStock: item.current_stock || 0,
                        warPeriod: item.warrenty || 0,
                        location: '',
                        itemsku: item.itemsku || '',
                        apiCost: (item.quantity || 1) * (item.itemcost || 0)
                    })
                );

                // Load UOM for each item
                const index = this.saleArray.length - 1;
                this.OnUMO(item.itemid || item.itemsku, index);
            });
        }

        // Calculate totals
        this.calculateSummary();
        this.updateTotalCostSummary();
    }

    // Generic payload creator
    createDropdownPayload(returnType: string) {
        return {
            p_returntype: returnType,
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
    OnGetCusMobile() {
        const payload = this.createDropdownPayload('CUSTOMER');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.cusMobileOptions = res.data),
            error: (err) => console.log(err)
        });
    }
     OnGetProfile() {
        const payload = this.createDropdownPayload('PROFILE');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => {
            if(res.data && res.data.length>0){
                this.profileOptions=res.data;
                const profile=res.data[0];
                this.companyName=profile.companyname,
                this.companyAddress=profile.companyaddress,
                this.companystate=profile.state_name,
                this.companycity=profile.city_name,
                this.companyemail=profile.companyemail,
                this.companygstno=profile.companygstno,
                this.statecode=profile.statecode,
                this.bankname=profile.bankname,
                this.accountno=profile.accountno,
                this.branchname=profile.branch,
                this.ifsc=profile.ifsc,
                this.pan=profile.pan
            }
            },
            error: (err) => console.log(err)
        });
    }

    // Load initial dropdowns (items, bill no)this.OngetcalculatedMRP
    loadAllDropdowns() {
        this.OnGetItem();
        this.OnGetBillNo();
        this.OnGetCusMobile();
        this.OnGetProfile();
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
          console.log('gdsfsd:',loginusername)
       const payload={
            p_returntype: 'NEWTRANSACTIONID',
            p_username:loginusername
       }
        this.salesService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                const billdata: any = res.data;
                this.billNoOptions = billdata.filter((item: { billno: null }) => item.billno != null);
                this.billValue=this.billNoOptions;
            },
            error: (err) => console.log(err)
        });
    }

    // -----------------------------
    //  Event Handlers (Item / Bill)
    // -----------------------------

    // Called when an item is selected from the item dropdown
    OnItemChange(event: any) {
  const latetData = this.itemOptions.find(
    (item) => item.itemid == event.value
  );
  if (!latetData) return;

  // Prevent duplicate item
  const alreadyExists = this.saleArray.controls.some(
    (row) => row.get('ItemId')?.value === latetData.itemid
  );

  if (alreadyExists) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Duplicate Item',
      detail: `${latetData.itemname} is already added.`,
      life: 2000
    });

    // Clear dropdown on duplicate
    this.salesForm.get('p_itemdata')?.setValue(null, { emitEvent: false });
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
    this.salesForm.get('p_itemdata')?.setValue(null, { emitEvent: false });
  }

  this.isAutoSelect = false; // reset after use
  this.calculateSummary();
}

    costGreaterThanSaleValidator(): ValidatorFn {
        return (form: AbstractControl): ValidationErrors | null => {
            const totalCost = Number(form.get('p_totalcost')?.value || 0);
            const finalPayable = Number(form.get('p_totalpayable')?.value || 0);

            // ❗ Condition: final payable must be >= total cost
            if (finalPayable < totalCost) {
                return { costNotGreater: true };
            }

            return null;
        };
    }

    paidAmountLessThanFinalAmount(): ValidatorFn {
        return (form: AbstractControl): ValidationErrors | null => {
            const p_paymentdue = Number(form.get('p_paymentdue')?.value || 0);
            const finalPayable = Number(form.get('p_totalpayable')?.value || 0);

            if (finalPayable < p_paymentdue) {
                return {
                    amountNotGreater: true
                };
            }
            return null;
        };
    }

    // Called when bill dropdown value changes
    onBillDetails(event: any) {
        const billDetails = this.billNoOptions.find((billitem) => billitem.billno === event.value);
        if (billDetails) {
            this.SaleDetails(billDetails);
            this.salesForm.patchValue({
                p_transactionid: billDetails.transactionid,
                p_customername: billDetails.customername,
                p_transactiondate: billDetails.transactiondate ? new Date(billDetails.transactiondate) : null,
                p_mobileno: billDetails.mobileno,
                status: billDetails.status,
                p_paymode:billDetails.paymode,
                p_totalcost: billDetails.totalcost.toFixed(2),
                p_totalsale: billDetails.totalsale.toFixed(2),
                p_disctype: billDetails.discounttype == 'Y' ? true : false,
                p_deliveryboy:billDetails.deliveryboy,
                p_overalldiscount: billDetails.discount,
                discountvalueper: billDetails.discountvalueper,
                p_roundoff: billDetails.roundoff,
                p_totalpayable: billDetails.totalpayable.toFixed(2),
                p_paymentdue: billDetails.amountpaid,
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
                    this.salesForm.patchValue({
                        status: res.data[0].status || ''
                    });
                }
                this.mapSaleItems(res.data);

                if (res.data && res.data.length > 0 && res.data[0].discounttype) {
                    this.salesForm.patchValue({
                        p_disctype: res.data[0].discounttype === 'Y'
                    });
                }
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
    // Custom validator to check if total cost exceeds final payable
    costNotExceedPayableValidator(): ValidatorFn {
        return (formGroup: AbstractControl): ValidationErrors | null => {
            const totalCost = Number(formGroup.get('p_totalcost')?.value || 0);
            const finalPayable = Number(formGroup.get('p_totalpayable')?.value || 0);

            // Only validate if both have values
            if (totalCost !== null && finalPayable !== null && totalCost < finalPayable) {
                return { maxCost: true };
            }
            return null;
        };
    }
    // -----------------------------
    //  Validation / Submit helpers
    // -----------------------------

    // Returns true when submit should be disabled
    isSubmitDisabled(): boolean {
        // 1) No items → disable
        if (this.saleArray.length === 0) return true;

        // 2) Stock errors set by updateTotal
        for (let row of this.saleArray.controls) {
            if (row.get('Quantity')?.errors?.['maxStock']) return true;
        }

        // 3) Required header fields missing
        // if (!this.salesForm.get('p_customername')?.value) return true;
        // if (!this.salesForm.get('p_mobileno')?.value) return true;
        if (!this.salesForm.get('p_transactiondate')?.value) return true;

        // 4) Per-row validation: qty cannot be 0 and cannot exceed stock
        for (let row of this.saleArray.controls) {
            const qty = Number(row.get('Quantity')?.value || 0);
            const stock = Number(row.get('curStock')?.value || 0);
            if (qty === 0) return true;
            if (qty > stock) return true;
        }

        // All checks passed → enable submit
        return false;
    }

    // -----------------------------
    //  Form Actions (submit / reset)
    // -----------------------------

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
                this.OnSalesHeaderCreate(this.salesForm.value);
            }
        });
    }

    // Reset form and clear sale array
    onReset() {
        this.salesForm.reset({
            p_gsttran: true,
        });
        this.backshow = false;
        this.saleArray.clear();
        this.salesForm.get('p_transactiondate')?.setValue(this.today);
         this.salesForm.get('p_paymode')?.setValue('Cash');
    }

    // -----------------------------
    //  Calculations (row & summary)
    // -----------------------------

    // Recalculate totals for entire sale
    calculateSummary() {
        let totalMRP = 0;

        this.saleArray.controls.forEach((row: AbstractControl) => {
            const qty = Number(row.get('Quantity')?.value || 0);
            const mrp = Number(row.get('MRP')?.value || 0);

            totalMRP += qty * mrp;
        });

        this.salesForm.patchValue({
            p_totalsale: totalMRP.toFixed(2),
            p_roundoff: 0,
            p_totalpayable: totalMRP.toFixed(2)
        });

        this.applyDiscount();
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
        this.salesForm.updateValueAndValidity();
    }

    back() {
        this.route.navigate(['/layout/pos/invoice']);
    }
    // Apply overall discount & round off
    applyDiscount() {
        const totalSale = Number(this.salesForm.get('p_totalsale')?.value || 0);
        const discountValue = Number(this.salesForm.get('p_overalldiscount')?.value || 0);
        const isPresent = this.salesForm.get('p_disctype')?.value;
        let discountAmount = 0;

        if (isPresent) {
            discountAmount = (totalSale * discountValue) / 100;
        } else {
            discountAmount = discountValue;
        }
        let finalPayable = totalSale - discountAmount;

        // Round off to 2 decimals difference and then round to integer for payable
        const roundOff = +(finalPayable - Math.floor(finalPayable)).toFixed(2);

        this.salesForm.patchValue({
            p_roundoff: roundOff,
            p_totalpayable: Math.round(finalPayable)
        });
        this.salesForm.updateValueAndValidity();
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
            p_customername: body.p_customername || '',
            p_mobileno: body.p_mobileno || '',
            p_totalcost: Number(body.p_totalcost) || 0,
            p_totalsale: Number(body.p_totalsale) || 0,
            p_overalldiscount: Number(body.p_overalldiscount) || 0,
            p_roundoff: body.p_roundoff ? body.p_roundoff.toString() : '0.00',
            p_totalpayable: Number(body.p_totalpayable) || 0,
            p_currencyid: Number(body.p_currencyid) || 0,
            p_gsttran: body.p_gsttran === true ? 'Y' : body.p_gsttran === false ? 'N' : 'N',
            p_status: body.p_status || 'Done',
            p_isactive: 'Y',
            p_linktransactionid: 0,
             p_creditnoteno: body.p_deliveryboy || '',
            // p_replacesimilir: body.p_replacesimilir || "",
            p_replacesimilir: body.p_disctype === true ? 'Y' : 'N',
            p_discounttype: body.p_disctype === true ? 'Y' : 'N',
            p_paymentmode: body.p_paymode,
            p_paymentdue: Number(body.p_paymentdue) || 0,
            p_sale: (body.p_sale || []).map((x: any) => ({
                TransactiondetailId: x.TransactiondetailId || 0,
                ItemId: x.ItemId,
                ItemName: x.ItemName,
                UOMId: x.UOMId,
                Quantity: x.Quantity,
                itemcost: x.itemcost,
                warrenty: x.warPeriod,
                MRP: x.MRP,
                totalPayable: x.totalPayable,
                currentstock: x.curStock
            }))
        };
    }

    // -----------------------------
    //  API Submit + Notifications
    // -----------------------------

    // Send header (and sale) to API, show toast notifications on result
    OnSalesHeaderCreate(data: any) {
  
        const apibody = this.cleanRequestBody(this.salesForm.value);

        this.stockInService.OninsertSalesDetails(apibody).subscribe({
            next: (res) => {
                const billno = res.data[0]?.billno;
               this.OnGetBillNo();
                this.OnGetItem();
               this.OnGetCusMobile();
                this.salesForm.controls['p_billno'].setValue(billno);
                if (res.data && res.data.length > 0) {
                    this.salesForm.patchValue({
                        status: 'Done'
                    });
                    
                }
                setTimeout(()=>{
                    if(this.billValue){
                        const currentBill=this.billValue.find((bill:any)=>bill.billno===billno);
                        if(currentBill){
                            this.patchPrintValues(currentBill);
                        }
                    }
                },500);
                 console.log('mobile option:',this.cusMobileOptions);
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
patchPrintValues(apiData:any){
    const patchData:any={};
    patchData.p_transactionid=apiData.transactionid;
    patchData.discountvalueper = apiData.discountvalueper;
    patchData.sgst_9=apiData.sgst_9;
    patchData.cgst_9=apiData.cgst_9;
     patchData.tax_18=apiData.tax_18;
      patchData.amount_before_tax=apiData.amount_before_tax;
    this.salesForm.patchValue(patchData);
    this.salesForm.updateValueAndValidity();
}
    // -----------------------------
    //  Utility / Misc
    // -----------------------------

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    OnUMO(value: any, index: number, uomValue?:string) {
        let apibody = {
            ...this.getUserDetails,
            p_returntype: 'SALEUOM',
            p_returnvalue: value
        };
  console.log("values",value,index);
   
        this.salesService.Getreturndropdowndetails(apibody).subscribe({
            next: (res) => {
                this.uomlist[index] = res.data;
                  const firstUom = this.uomlist[index][0];
                const row = this.saleArray.at(index);
                const uomArray=this.uomlist[index];
                // ⭐ Auto-select FIRST UOM
             const select=uomArray.filter((u:any)=>u.fieldid===this.Uomid)
             console.log("select",select)
                if (uomArray && uomArray.length > 0) {
                    console.log("uomindex",uomArray[index])
  let matchUom=this.uomlist.find((uom:any)=>uom.fieldname===uomValue);   
                //   this.salesForm.controls['UomName'].setValue(matchUom.fieldname)
                   if(uomValue){
                       row.patchValue({
                        UOMId: matchUom.fieldid,
                        UomName: matchUom?.fieldname
                    });
                   }
                   else{
                   row.patchValue({
                        UOMId:firstUom.fieldid,
                        UomName: this.Uomid
                    });
                   }
                   
                    console.log('UOMNAME', this.salesForm.get('UomName')?.value)
                    // ⭐ Immediately calculate MRP + TOTAL + COST
                    this.calculateMRP(index);
                }
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
  row.addControl(
    'baseStock',
    new FormControl(Number(row.get('curStock')?.value || 0))
  );
}

      const baseStock = Number(row.get('baseStock')?.value || 0);

      // 🔹 Converted stock based on UOM
      const convertedStock = baseStock * conversion;

      // 🔹 Patch values
      row.patchValue({
        MRP: mrp,
        itemcost: cost,
        totalPayable: qty * mrp,
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

        // Get current row data
        const rowData = {
            ItemId: row.get('ItemId')?.value,
            UOMId: event.value
        };
         this.Uomid=event.value.UOMId;
        console.log(this.Uomid)
        console.log('calculate mrp:', event.value);
        this.OngetcalculatedMRP(event.value, index);
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
                    const mrp = Number(res?.data.totalmrp || 0);
                    const cost = Number(res?.data.totalcost || 0);

                    // ⭐ IMPORTANT — Update purchase price also
                    row.patchValue({
                        MRP: mrp,
                        itemcost: cost, // <-- FIXED
                        totalPayable: qty * mrp,
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

        this.salesForm.patchValue({
            p_totalcost: finalCost.toFixed(2)
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
                        <title>Invoice Print</title>
                        <style>
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