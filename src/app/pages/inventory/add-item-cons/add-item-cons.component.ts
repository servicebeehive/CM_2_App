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
    @Input() mode: 'add' | 'edit'= 'add';
    @Output() save = new EventEmitter<any>();
    @Output() childUom = new EventEmitter<boolean>();

    @Input() itemOptions: any[] = [];
    @Input() categoryOptions: any[] = [];
    @Input() uomOptions: any[] = [];
    @Input() vendorOptions: any[] = [];
    @Input() purchaseIdOptions: any[] = [];
    
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
    materialTypeOptions: any[] = [];
    subCategoryOptions: any[] = [];
    itemGroupOptions: any[] = [];
    itemSubGroupOptions: any[] = [];

    selectItemType = [
        { label: 'Select Existing Item', value: 1 },
        { label: 'Add New Item', value: 2 }
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
                itembarcode: ['', [ Validators.maxLength(50)]],
                itemCode: ['', [Validators.maxLength(50)]],
                category: ['', Validators.required],
                parentUOM: ['', Validators.required],
                itemName: ['', [Validators.required, Validators.maxLength(500)]],
                description: ['', Validators.maxLength(1000)],
                location: ['', Validators.maxLength(150)],
                brand: ['', Validators.maxLength(100)],
                model: ['', Validators.maxLength(100)],
                hsnCode: ['', Validators.maxLength(50)],
                curStock: [''],
                purchasePrice: ['', [Validators.min(1)]],
                qty: ['', [Validators.min(1)]],
                minStock: ['', Validators.maxLength(3)],
                reorderLevel: ['', Validators.maxLength(3)],
                warPeriod: ['', Validators.maxLength(2)],
                p_expirydate: [null],
                costPerItem: [''],
                mrp: ['', [Validators.min(1)]],
                materialType: [''],
                subCategory: [''],
                itemGroup: [''],
                itemSubGroup: [''],
                activeItem: [true],
                itemSearch: [''],
                itemtype: [''],
                p_tax: [''],
                transactionType: ['purchase'],
            },
            { validators: this.mrpValidator }
        );
        this.onGetTax();
        this.addForm.get('purchasePrice')?.valueChanges.subscribe(() => this.updateCostPerItem());
        this.addForm.get('qty')?.valueChanges.subscribe(() => this.updateCostPerItem());

        this.applyModeData();
    }

    /** Helper to check current transaction type */
    isTransactionType(type: string): boolean {
        return this.addForm.get('transactionType')?.value === type;
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

    onGetTax(){
        const payload = {
            p_returntype: 'TAXDETAILS',
                p_returnvalue: this.authService.isLogIntType()?.industry_type_id.toString(),
                p_username: ''
        }
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.taxOptions = res?.data || [];
            }
        })
    }

    onItemSearch(event: any) {
        this.searchValue = event.filter || '';
    }

   enterEditItemMode(itemData: any) {
    this.addForm.patchValue({
        itembarcode: itemData.itembarcode ?? '',
        itemCode: itemData.itemsku ?? itemData.itemid ?? '',
        itemName: itemData.itemname ?? itemData.item_description ?? '',
        category: itemData.categoryid ?? null,
        curStock: itemData.currentstock ?? itemData.available_stock ?? 0,
        p_expirydate: itemData.expirydate ? new Date(itemData.expirydate) : null,
        gstItem: itemData.gstitem ? itemData.gstitem === 'Y' : true,
        activeItem: itemData.isactive ? itemData.isactive === 'Y' : true,
        minStock: itemData.minimumstock ?? itemData.buffer_stock ?? '',
        mrp: itemData.saleprice ?? '',
        parentUOM: itemData.uomid ?? itemData.uom ?? null,
        warPeriod: itemData.warrentyperiod ?? 0,
        brand: itemData.brand ?? '',
        model: itemData.model_size ?? '',
        hsnCode: itemData.hsncode ?? '',
        reorderLevel: itemData.reorderlevel ?? '',
        materialType: itemData.materialtypeid ?? '',
        subCategory: itemData.subcategoryid ?? '',
        itemGroup: itemData.itemgroupid ?? '',
        itemSubGroup: itemData.itemsubgroupid ?? '',
        location: itemData.location ?? '',
        p_tax: itemData.gstrate?.toString() ?? '',
        purchasePrice: itemData.purchaseprice ?? 0
    });

    this.resetDisabled = true;
    // this.disableItemRelatedControls();
}

    enterAddItemMode(itemData: any) {   
        this.addForm.patchValue({
            itembarcode: itemData.itembarcode,
            itemCode: itemData.itemsku,
            itemName: itemData.itemname,
            category: itemData.categoryid,
            curStock: itemData.currentstock,
            p_expirydate: itemData.expirydate ? new Date(itemData.expirydate) : null,
            activeItem: itemData.isactive === 'Y',
            minStock: itemData.minimumstock,
            purchasePrice: this.mode == 'add' ? 0 : itemData.pruchaseprice.toFixed(2),
            mrp: itemData.saleprice,
            parentUOM: itemData.uomid,
            qty: itemData.quantity,
            costPerItem: itemData.costprice.toFixed(5),
            warPeriod: itemData.warrentyperiod
        });

        // this.disableItemRelatedControls();
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
    this.addForm.get('transactionType')?.setValue('purchase');
    this.showCopyMessage = false;
    }

   private disableItemRelatedControls() {
    // const controls = ['itembarcode', 'itemCode', 'parentUOM'];
    // controls.forEach((c) => this.addForm.get(c)?.disable());
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
    }
    if (this.mode === 'add') {
        this.enterAddModeReset();
    }
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

  mapFormToPayload(form: any) {
    return {
        p_companyid: this.authService.isLogIntType()?.companyid,
        p_itemid: this.mode === 'edit' ? Number(this.editData?.itemid ?? 0) : 0,
        p_itemsku: form.itemCode,
        p_itemname: form.itemName,
        p_location: form.location ?? '',
        p_minimumstock: Number(form.minStock) || 0,
        p_categoryid: Number(form.category),
        p_warrentyperiod: Number(form.warPeriod) || 0,
        p_expirydate: this.datePipe.transform(form.p_expirydate, 'dd/MM/yyyy'),
        p_gstitem: 'Y',
        p_isactive: form.activeItem ? 'Y' : 'N',
        p_loginuser: this.shareservice.getUserData()?.username || this.authService.isLogIntType().userid.toString(),
        p_itembarcode: form.itembarcode,
        p_uomid: Number(form.parentUOM),
        p_itemdesc: form.description ?? null,
        p_reorderlevel: Number(form.reorderLevel) || 0,
        p_brand: form.brand ?? null,
        p_model_size: form.model ?? null,
        p_hsncode: form.hsnCode ?? null,
        p_purchaseprice: Number(form.purchasePrice) || 0,
        p_saleprice: Number(form.mrp) || 0,
        p_gstrate: Number(form.p_tax) || 0,
        p_materialtypeid: form.materialType ? Number(form.materialType) : null,
        p_subcategoryid: form.subCategory ? Number(form.subCategory) : null,
        p_itemgroupid: form.itemGroup ? Number(form.itemGroup) : null,
        p_itemsubgroupid: form.itemSubGroup ? Number(form.itemSubGroup) : null,
        p_remarks: null,
        p_industry: this.authService.isLogIntType()?.industry_type_id || null,
    };
}

onSubmit() {
    if (this.addForm.invalid) return;
    this.inventoryService.onUpsertItem(this.mapFormToPayload(this.addForm.getRawValue())).subscribe({
        next: (res) => {
            const msg = res?.data?.message;
            this.save.emit({ message: msg, payload: this.addForm.getRawValue() });
            this.close.emit();
        },
        error: (res) => {
            const msg = res?.error?.message || 'Failed to save item.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        }
    });
}

    onCancel() {
        this.resetForm();
        this.close.emit();
    }

    resetForm() {
        this.addForm.reset();
        this.addForm.get('activeItem')?.setValue(true);
        this.addForm.get('transactionType')?.setValue('purchase');
        this.addForm.enable();
    }

    onItemCodeChange(event: any) {
        this.showCopyMessage = false;

        const itemnamdata = this.itemOptions.find((item) => item.itemsku === event.value);
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
