import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { ShareService } from '@/core/services/shared.service';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface Product {
    name: string;
    price: string;
    code: string;
    sku: string;
    status: string;
    tags: string[];
    category: string;
    colors: string[];
    stock: string;
    inStock: boolean;
    description: string;
    images: Image[];
}

interface Image {
    name: string;
    objectURL: string;
}

@Component({
    selector: 'app-add-item-cons',
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
        DatePickerModule,
        DropdownModule,
        ToggleSwitchModule,
        RippleModule,
        ChipModule,
        FluidModule,
        MessageModule,
        AutoCompleteModule,
        CheckboxModule,
        ToastModule
    ],
    templateUrl: './add-item-cons.component.html',
    styleUrl: './add-item-cons.component.scss',
    providers: [DatePipe, MessageService]
})
export class AddItemConsComponent {
    @Input() transationid: any = null;
    @Output() close = new EventEmitter<void>();
    @Input() editData: any;
    @Input() mode: 'add' | 'edit' | 'itemedit' = 'add';
    @Output() save = new EventEmitter<any>();
    @Output() childUom = new EventEmitter<boolean>();

    @Input() itemOptions: any[] = [];
    @Input() categoryOptions: any[] = [];
    @Input() uomOptions: any[] = [];
    @Input() vendorOptions: any[] = [];
    @Input() purchaseIdOptions: any[] = [];

    @ViewChild('locationDropdown') locationDropdown!: Dropdown;
    
    public authService = inject(AuthService);
    copyMessage: string = '';
    showCopyMessage: boolean = false;
    addForm!: FormGroup;
    filteredItemCode: any[] = [];
    dateTime = new Date();

    itemCodeOptions = [];
    parentUOMOptions = [];
    uom = [];
    itemCodeExists: boolean = false;
    barcodeExists: boolean = false;
    resetDisabled = false;

    itemtypeOptions: any[] = [
        { fieldid: 'consumable', fieldname: 'Consumable' },
        { fieldid: 'returnable', fieldname: 'Returnable' }
    ];
    taxOptions: any[] = [
        { fieldid: '5', fieldname: '5%' },
        { fieldid: '10', fieldname: '10%' }
    ];

    /** Payment type options for lease / rent */
    paymentTypeOptions: any[] = [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Yearly', value: 'yearly' },
        { label: 'One Time', value: 'onetime' }
    ];

    selectItemType = [
        { label: 'Select Existing Item', value: 1 },
        { label: 'Add New Item', value: 2 }
    ];

    locationOptions: { label: string; value: string }[] = [
        { label: 'Main Warehouse', value: 'Main Warehouse' },
        { label: 'Site A', value: 'Site A' },
        { label: 'Site B', value: 'Site B' }
    ];

    filteredUOM: any[] = [];
    searchValue: string = '';
    newLocationLabel:string = '';
    showAddLocation:boolean = false;
    showEmptyFilter = false;

    constructor(
        private fb: FormBuilder,
        public inventoryService: InventoryService,
        public shareservice: ShareService,
        public datePipe: DatePipe,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.addForm = this.fb.group(
            {
                itembarcode: ['', [Validators.maxLength(50)]],
                itemCode: ['', [Validators.required, Validators.maxLength(50)]],
                category: ['', Validators.required],
                parentUOM: ['', Validators.required],
                itemName: ['', [Validators.required, Validators.maxLength(500)]],
                curStock: [''],
                purchasePrice: ['', [Validators.required, Validators.min(1)]],
                minStock: ['', Validators.maxLength(3)],
                warPeriod: ['', Validators.maxLength(2)],
                p_expirydate: [null],
                costPerItem: [''],
                mrp: ['', [Validators.required, Validators.min(1)]],
                location: ['', Validators.maxLength(100)],
                qty: ['', [Validators.required, Validators.min(1)]],
                discount: [''],
                activeItem: [true],
                gstItem: [true],
                itemSearch: [''],
                itemtype: [''],
                p_tax: [''],
                // New fields
                transactionType: ['purchase'],
                paymentType: [''],
                leaseStartDate: [null],
                leaseEndDate: [null]
            },
            { validators: this.mrpValidator }
        );

        this.addForm.get('purchasePrice')?.valueChanges.subscribe(() => this.updateCostPerItem());
        this.addForm.get('qty')?.valueChanges.subscribe(() => this.updateCostPerItem());

        // React to transactionType changes
        this.addForm.get('transactionType')?.valueChanges.subscribe((type: string) => {
            this.onTransactionTypeChange(type);
        });

        this.applyModeData();
    }

    /** Helper to check current transaction type */
    isTransactionType(type: string): boolean {
        return this.addForm.get('transactionType')?.value === type;
    }

    /** Handle side effects when switching transaction type */
    onTransactionTypeChange(type: string): void {
        const isPurchase = type === 'purchase';
        const isLease = type === 'lease';

        // Fields to disable on lease/rent
        const leaseRentDisabledFields = ['minStock', 'warPeriod', 'p_expirydate'];

        if (isPurchase) {
            // Re-enable purchase-only fields
            leaseRentDisabledFields.forEach((f) => this.addForm.get(f)?.enable());

            // Clear & remove validators for lease/rent-only fields
            this.addForm.get('paymentType')?.clearValidators();
            this.addForm.get('paymentType')?.setValue('');
            this.addForm.get('leaseStartDate')?.clearValidators();
            this.addForm.get('leaseStartDate')?.setValue(null);
            this.addForm.get('leaseEndDate')?.clearValidators();
            this.addForm.get('leaseEndDate')?.setValue(null);
        } else {
            // Disable purchase-only fields
            leaseRentDisabledFields.forEach((f) => {
                this.addForm.get(f)?.setValue('');
                this.addForm.get(f)?.disable();
            });

            // Require paymentType for lease/rent
            this.addForm.get('paymentType')?.setValidators(Validators.required);

            if (isLease) {
                // Require lease period dates
                this.addForm.get('leaseStartDate')?.setValidators(Validators.required);
                this.addForm.get('leaseEndDate')?.setValidators(Validators.required);
            } else {
                // rent — clear lease period
                this.addForm.get('leaseStartDate')?.clearValidators();
                this.addForm.get('leaseStartDate')?.setValue(null);
                this.addForm.get('leaseEndDate')?.clearValidators();
                this.addForm.get('leaseEndDate')?.setValue(null);
            }
        }

        // Update validity for affected controls
        ['paymentType', 'leaseStartDate', 'leaseEndDate'].forEach((f) => {
            this.addForm.get(f)?.updateValueAndValidity();
        });
    }

    allowOnlyNumbers(event: KeyboardEvent) {
        const allowedChars = /[0-9]\b/;
        const inputChar = String.fromCharCode(event.key.charCodeAt(0));
        if (!allowedChars.test(inputChar)) {
            event.preventDefault();
        }
    }

    mrpValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        const costperitem = parseFloat(group.get('costPerItem')?.value);
        const mrp = parseFloat(group.get('mrp')?.value);
        if (isNaN(costperitem) || isNaN(mrp)) {
            return null;
        }
        if (mrp < costperitem) {
            return { mrpGreaterThanPurchase: true };
        }
        return null;
    };

    blockMinus(event: KeyboardEvent) {
        if (event.key === '-' || event.key === 'Minus' || event.key === 'e') {
            event.preventDefault();
        }
    }

    toUppercase(event: Event) {
        const input = event.target as HTMLInputElement;
        input.value = input.value.toUpperCase();
    }

    onLocationFilter(event: any): void {
  this.newLocationLabel = (event.filter || '').trim();
  const matched = this.locationOptions.some(o =>
    o.label.toLowerCase().includes(this.newLocationLabel.toLowerCase())
  );
  this.showEmptyFilter = this.newLocationLabel.length > 0 && !matched;
}

addNewLocation(): void {
  if (!this.newLocationLabel) return;

  const exists = this.locationOptions.some(
    o => o.label.toLowerCase() === this.newLocationLabel.toLowerCase());
  if (exists) return;

  const newOption = { label: this.newLocationLabel, value: this.newLocationLabel };
  this.locationOptions = [...this.locationOptions, newOption];
  this.addForm.get('location')?.setValue(newOption.value);
  this.newLocationLabel = '';

  this.locationDropdown.hide();
}

    updateCostPerItem(): void {
        const purchasePrice = parseFloat(this.addForm.get('purchasePrice')?.value);
        const qty = parseFloat(this.addForm.get('qty')?.value);

        if (!isNaN(purchasePrice) && !isNaN(qty) && qty > 0) {
            const cost = purchasePrice / qty;
            this.addForm.get('costPerItem')?.setValue(cost.toFixed(5), { emitEvent: false });
        } else {
            this.addForm.get('costPerItem')?.setValue(this.addForm.get('costPerItem')?.value, { emitEvent: false });
        }
    }

    onItemSearch(event: any) {
        this.searchValue = event.filter || '';
    }

    enterEditItemMode(itemData: any) {
        console.log(itemData)
        this.addForm.patchValue({
            itemid: itemData.itemid,
            p_tranpurchaseid: itemData.purchaseid,
            itembarcode: itemData.itembarcode,
            itemCode: itemData.itemsku || itemData.itemid,
            itemName: itemData.itemname,
            category: itemData.categoryid,
            curStock: itemData.currentstock,
            p_expirydate: itemData.expirydate ? new Date(itemData.expirydate) : null,
            gstItem: itemData.gstitem === 'Y',
            activeItem: itemData.isactive === 'Y',
            location: itemData.location,
            minStock: itemData.minimumstock,
            purchasePrice: (itemData.costprice * itemData.quantity).toFixed(2),
            mrp: itemData.saleprice,
            parentUOM: itemData.uomid,
            qty: itemData.quantity,
            costPerItem: itemData.costprice.toFixed(5),
            warPeriod: itemData.warrentyperiod
        });

        this.resetDisabled = true;
        this.disableItemRelatedControls();
        this.addForm.get('purchasePrice')?.enable();
        this.addForm.get('mrp')?.enable();
        this.addForm.get('qty')?.enable();
    }

    enterItemUpdateMode(itemData: any) {
        this.addForm.patchValue({
            itembarcode: itemData.itembarcode,
            itemCode: itemData.itemsku || itemData.itemid,
            itemName: itemData.itemname,
            category: itemData.categoryid,
            curStock: itemData.currentstock,
            p_expirydate: itemData.expirydate ? new Date(itemData.expirydate) : null,
            gstItem: itemData.gstitem === 'Y',
            activeItem: itemData.isactive === 'Y',
            location: itemData.location,
            minStock: itemData.minimumstock,
            mrp: itemData.saleprice,
            parentUOM: itemData.uomid,
            qty: itemData.quantity,
            costPerItem: itemData.costprice.toFixed(5),
            warPeriod: itemData.warrentyperiod
        });

        this.resetDisabled = true;
        this.addForm.disable();
        this.disableItemRelatedControls();
        this.addForm.get('category')?.enable();
        this.addForm.get('minStock')?.enable();
        this.addForm.get('warPeriod')?.enable();
        this.addForm.get('p_expirydate')?.enable();
        this.addForm.get('location')?.enable();
        this.addForm.get('gstItem')?.enable();
        this.addForm.get('activeItem')?.enable();
        this.addForm.get('discount')?.enable();
    }

    enterAddItemMode(itemData: any) {   
        this.addForm.patchValue({
            itembarcode: itemData.itembarcode,
            itemCode: itemData.itemsku,
            itemName: itemData.itemname,
            category: itemData.categoryid,
            curStock: itemData.currentstock,
            p_expirydate: itemData.expirydate ? new Date(itemData.expirydate) : null,
            gstItem: itemData.gstitem === 'Y',
            activeItem: itemData.isactive === 'Y',
            location: itemData.location,
            minStock: itemData.minimumstock,
            purchasePrice: this.mode == 'add' ? 0 : itemData.pruchaseprice.toFixed(2),
            mrp: itemData.saleprice,
            parentUOM: itemData.uomid,
            qty: itemData.quantity,
            costPerItem: itemData.costprice.toFixed(5),
            warPeriod: itemData.warrentyperiod
        });

        this.disableItemRelatedControls();
        this.addForm.get('purchasePrice')?.enable();
        this.addForm.get('mrp')?.enable();
        this.addForm.get('qty')?.enable();
        this.addForm.get('itemSearch')?.enable();
    }

    enterAddModeReset() {
    this.resetDisabled = false;
        this.addForm.reset();
    this.addForm.enable();
    this.addForm.get('activeItem')?.setValue(true);
    this.addForm.get('gstItem')?.setValue(true);
    this.addForm.get('transactionType')?.setValue('purchase');
    this.showCopyMessage = false;
    }

    private disableItemRelatedControls() {
        const controls = ['itembarcode', 'itemCode', 'parentUOM', 'category', 'itemName', 'curStock', 'location', 'minStock', 'warPeriod', 'p_expirydate', 'activeItem', 'gstItem', 'itemSearch', 'discount'];
        controls.forEach((c) => this.addForm.get(c)?.disable());
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.addForm) return;
        this.applyModeData();
    }

    private applyModeData():void{
     const hasEditData = !!this.editData;
    if (hasEditData) {
        if (this.mode === 'edit') {
            this.enterEditItemMode(this.editData);
            return;
        }
        if (this.mode === 'itemedit') {
            this.enterItemUpdateMode(this.editData);
            return;
        }
    }
    if (this.mode === 'add') {
        this.enterAddModeReset();
    }
    }

    copy(event: any) {
        const itemCode = this.addForm.get('itemCode')?.value;
        if (!itemCode || itemCode === '') {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Select An Item Before Copy'
            });
            return;
        }

        this.showCopyMessage = true;
        this.addForm.enable();
        this.addForm.get('curStock')?.setValue(0);
        this.addForm.get('itembarcode')?.setValue('');
        this.addForm.get('itemCode')?.setValue('');
    }

    onBlur(event: FocusEvent) {
        const itemcodevalue = (event.target as HTMLInputElement).value.trim();

        const payload = {
            p_username: this.authService.isLogIntType().userid.toString(),
            p_returntype: 'ITEMCODEVALIDATE',
            p_returnvalue: itemcodevalue
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.itemCodeExists = res?.data?.[0]?.itemno === 1;
                if (this.itemCodeExists) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Item Code is already exist.',
                        life: 3000
                    });
                }
            },
            error: (err) => console.log(err)
        });
    }

    onBlurBarCode(event: FocusEvent) {
        const itembarcodevalue = (event.target as HTMLInputElement).value;

        const payload = {
            p_username: this.authService.isLogIntType().userid.toString(),
            p_returntype: 'ITEMBARVALIDATE',
            p_returnvalue: itembarcodevalue
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.barcodeExists = res?.data[0]?.itemno === 1;
                if (this.barcodeExists) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Item Barcode is already exist.',
                        life: 3000
                    });
                }
            },
            error: (err) => console.log(err)
        });
    }

    search(event: any) {
        const query = event.query?.toLowerCase() || '';
        if (!query) {
            this.filteredUOM = [...this.uom];
            return;
        }
    }

    filterItemCode(event: any) {
        const query = event.query.toLowerCase();
        if (!this.filteredItemCode.some((v) => v.label.toLowerCase() === query)) {
            this.filteredItemCode.push({ label: event.query });
        }
    }

    mapFormToPayload(form: any, childUOM: any[]) {
        return {
            p_operationtype: this.mode == 'itemedit' ? 'ITEM_UPD' : 'PUR_INSERT',
            p_purchaseid: this.mode == 'itemedit' ? '0' : (this.transationid?.toString() ?? '0'),
            p_itembarcode: form.itembarcode,
            p_itemsku: form.itemCode,
            p_itemname: form.itemName,
            p_categoryid: Number(form.category),
            p_uomid: Number(form.parentUOM),
            p_quantity: Number(form.qty),
            p_costprice: Number(form.costPerItem),
            p_saleprice: Number(form.mrp),
            p_minimumstock: Number(form.minStock),
            p_warrentyperiod: Number(form.warPeriod),
            p_location: form.location ?? '',
            p_currentstock: Number(form.curStock),
            p_expirydate: this.datePipe.transform(this.addForm.controls['p_expirydate'].value, 'dd/MM/yyyy'),
            p_currencyid: Number(form.currencyId || 1),
            p_taxid: Number(form.taxId || 0),
            p_warehourse: form.warehouse || 'ShristiShop',
            p_isactive: form.activeItem ? 'Y' : 'N',
            p_gstitem: form.gstItem ? 'Y' : 'N',
            p_transactiontype: form.transactionType,
            p_paymenttype: form.paymentType ?? '',
            p_leasestartdate: this.datePipe.transform(form.leaseStartDate, 'dd/MM/yyyy') ?? '',
            p_leaseenddate: this.datePipe.transform(form.leaseEndDate, 'dd/MM/yyyy') ?? '',
            p_childuom: 'N',
            p_uom: [],
            p_loginuser: this.shareservice.getUserData()?.username || this.authService.isLogIntType().userid.toString(),
        };
    }

onSubmit() {
    if (this.addForm.invalid) return;
    if (this.mode == 'itemedit') {
        this.inventoryService.Oninsertitemdetails(this.mapFormToPayload(this.addForm.getRawValue(), [])).subscribe({
            next: (res) => {
                const msg = res?.data?.[0]?.msg || 'Item saved successfully';
                this.showSuccess(msg);
                this.save.emit(this.addForm.getRawValue());
                this.close.emit(this.addForm.getRawValue());
            },
            error: (res) => {}
        });
    } else {
        this.inventoryService.Oninsertitemdetails(this.mapFormToPayload(this.addForm.getRawValue(), [])).subscribe({
            next: (res) => {
                const msg = res?.data?.[0]?.msg || 'Item saved successfully';
                this.showSuccess(msg);
                this.close.emit(this.addForm.getRawValue());
            },
            error: (res) => {}
        });
    }
}

    onCancel() {
        this.close.emit();
    }

    resetForm() {
        this.addForm.reset();
        this.addForm.get('activeItem')?.setValue(true);
        this.addForm.get('gstItem')?.setValue(true);
        this.addForm.get('transactionType')?.setValue('purchase');
        this.addForm.enable();
    }

    onItemCodeChange(event: any) {
        this.showCopyMessage = false;

        const itemnamdata = this.itemOptions.find((item) => item.itemsku === event.value);

        console.log('itemnamdata', itemnamdata);

        if (itemnamdata) {
            this.enterAddItemMode(itemnamdata);
        }
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }


    Reset() {
        this.addForm.reset();
        this.enterAddModeReset();
        this.showCopyMessage = false;
    }

}
