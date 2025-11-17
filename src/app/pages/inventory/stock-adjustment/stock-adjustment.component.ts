import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { EditorModule } from 'primeng/editor';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { StockIn } from '@/types/stockin.model';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';

@Component({
    selector: 'app-stock-adjustment',
    standalone: true,
    imports: [
        CommonModule,
        EditorModule,
        ReactiveFormsModule,
        TableModule,
        InputTextModule,
        FormsModule,
        ButtonModule,
        SelectModule,
        DropdownModule,
        RippleModule,
        ChipModule,
        FluidModule,
        MessageModule,
        DialogModule,
        ConfirmDialogModule,
        CheckboxModule,
        AutoCompleteModule,
        GlobalFilterComponent
    ],
    templateUrl: './stock-adjustment.component.html',
    styleUrls: ['./stock-adjustment.component.scss'],
    providers: [ConfirmationService]
})
export class StockAdjustmentComponent {
    updateForm!: FormGroup;

    // paging
    first: number = 0;
    rowsPerPage: number = 10;
    pagedProducts: StockIn[] = [];

    // data
    products: any[] = []; // original full list (raw product objects)
    filteredProducts: any[] = []; // current filtered list shown in table
    globalFilter: string = '';

    // dropdowns
    categoryOptions: any[] = [];
    itemOptions: any[] = [];
    adjustment = [
        { label: 'Increase', value: 'increase' },
        { label: 'Decrease', value: 'decrease' }
    ];
    mrpUpdate = [
        { label: 'Batch', value: 'B' },
        { label: 'Item', value: 'I' }
    ];
    filteredAdjustment: any[] = [];

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private confirmationService: ConfirmationService,
        private authService: AuthService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.updateForm = this.fb.group({
            category: [''],
            item: [''],
            mrpUpdate: ['B'],
            p_stock: this.fb.array([]) // formArray for rows
        });

        this.loadAllDropdowns();
        this.onGetStockIn();

        // reactively filter products on form changes (category/item)
        this.updateForm.get('category')?.valueChanges.subscribe(() => this.applyGlobalFilter());
        this.updateForm.get('item')?.valueChanges.subscribe(() => this.applyGlobalFilter());
    }

    // ---------- Helpers ----------
    getStockArray(): FormArray {
        return this.updateForm.get('p_stock') as FormArray;
    }
    blockMinus(event: KeyboardEvent) {
        if (event.key === '-' || event.key === 'Minus') {
            event.preventDefault();
        }
    }

    // Rebuild formArray from a list of product objects
    private buildFormArrayFromProducts(products: any[]) {
        const stockArray = this.getStockArray();
        stockArray.clear();
        products.forEach((p: any) => {
            // Keep adjustment type on the plain product for validators that reference it
            p.adjustmentType = p.adjustmentType || 'increase';

            const group = this.fb.group({
                ItemId: [p.itemid ?? p.ItemId],
                // UOMId: [p.uomid ?? p.UOMId],
                BatchId: [p.batchid ?? p.BatchId],
                mrpvalue: [p.mrpvalue ?? p.saleprice ?? null, [Validators.min(1)]],
                Quantity: [
                    p.Quantity ?? null,
                    [
                        // Validators.required,
                        Validators.min(1),
                        this.batchValidator(p.batch_available),
                        this.quantityValidator(p.curStock ?? p.curStock ?? 0, () => p.adjustmentType)
                    ]
                ],
                adjtype: [p.adjustmentType]
            });

            // bind controls to product so template can use row.quantityControl and row.adjustmentControl
            p.mrpControl = group.get('mrpvalue') as AbstractControl;
            p.quantityControl = group.get('Quantity') as AbstractControl;
            p.adjustmentControl = group.get('adjtype') as AbstractControl;

            stockArray.push(group);
        });

        // if table is paged, update pagedProducts
        this.filteredProducts = [...products];
        this.updatePagedProducts();
    }

    // ---------- Initial load ----------
    onGetStockIn() {
        // Use inventoryService.productItem if present else API call
        this.products = this.inventoryService.productItem || [];

        // Ensure each product has expected fields and controls
        this.buildFormArrayFromProducts(this.products);
    }

    // ---------- Filtering ----------
    applyGlobalFilter() {
        const searchTerm = (this.globalFilter || '').toLowerCase().trim();
        const selectedCategory = this.updateForm.get('category')?.value;
        const selectedItem = this.updateForm.get('item')?.value;

        this.filteredProducts = this.products.filter((p: any) => {
            const matchesSearch =
                !searchTerm ||
                String(p.itemcombine ?? p.name ?? '')
                    .toLowerCase()
                    .includes(searchTerm) ||
                String(p.categoryname ?? p.category ?? '')
                    .toLowerCase()
                    .includes(searchTerm) ||
                String(p.curStock ?? p.currentstock ?? '')
                    .toLowerCase()
                    .includes(searchTerm);

            const matchesCategory = !selectedCategory || p.category === selectedCategory || p.categoryid === selectedCategory;
            const matchesItem = !selectedItem || p.name === selectedItem || p.itemid === selectedItem;

            return matchesSearch && matchesCategory && matchesItem;
        });

        // rebuild form controls to match filteredProducts (keeps the same product objects but ensures controls exist)
        this.buildFormArrayFromProducts(this.filteredProducts);
    }

    filterProducts() {
        // older name for filtering, keep for compatibility
        this.applyGlobalFilter();
    }

    // ---------- Adjustment change (dropdown) ----------
    onAdjustmentChange(event: any, product: any, idx?: number) {
        const selected = event?.value ?? event;
        // keep product model updated (used by validator)
        product.adjustmentType = selected;
        // update linked form control if available
        if (product.adjustmentControl) {
            product.adjustmentControl.setValue(selected);
        } else if (idx != null) {
            const ctrl = (this.getStockArray().at(idx) as FormGroup).get('adjtype');
            ctrl?.setValue(selected);
        }

        // update quantity control validity because validator depends on adjustment type
        if (product.quantityControl) {
            product.quantityControl.updateValueAndValidity({ emitEvent: true });
        }
    }

    // ---------- Validator ----------
    quantityValidator(curStock: number, adjustmentTypeGetter: () => string | null): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const type = adjustmentTypeGetter();
            const qty = control.value;
            if (type === 'decrease' && qty != null && qty > (curStock ?? 0)) {
                return { greaterThanStock: true };
            }
            return null;
        };
    }

    batchValidator(maxBatch: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const qty = Number(control.value);

            if (qty > maxBatch) {
                return { greaterThanBatch: true };
            }
            return null;
        };
    }

    // ---------- Autocomplete for adjustment (if you use autocomplete) ----------
    search(event: any) {
        const query = (event.query ?? '').toLowerCase();
        if (!query) {
            this.filteredAdjustment = [...this.adjustment];
            return;
        }
        this.filteredAdjustment = this.adjustment.filter((u) => u.label.toLowerCase().includes(query));
    }

    // ---------- Pagination ----------
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.updatePagedProducts();
    }

    updatePagedProducts() {
        // slice from filteredProducts
        this.pagedProducts = (this.filteredProducts || []).slice(this.first, this.first + this.rowsPerPage);
    }

    // ---------- Dropdown loaders ----------
    createDropdownPayload(returnType: string) {
        return {
            uname: 'admin',
            p_username: 'admin',
            p_returntype: returnType,
            clientcode: 'CG01-SE',
            'x-access-token': this.authService.getToken()
        };
    }

    loadAllDropdowns() {
        this.OnGetItem();
        this.OnGetCategory();
    }

    OnGetItem() {
        const payload = this.createDropdownPayload('ITEM');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res: any) => (this.itemOptions = res?.data || []),
            error: (err) => console.error(err)
        });
    }

    OnGetCategory() {
        const payload = this.createDropdownPayload('CATEGORY');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res: any) => (this.categoryOptions = res?.data || []),
            error: (err) => console.error(err)
        });
    }

    // ---------- Get adjustment data (Filter API) ----------
    Onreturndropdowndetails() {
        const category = this.updateForm.controls['category'].value;
        const item = this.updateForm.controls['item'].value;

        if (category || item) {
            const payload = {
                uname: 'admin',
                p_categoryid: category || null,
                p_itemid: item || null,
                p_username: 'admin',
                p_updatetype: this.updateForm.controls['mrpUpdate'].value,
                clientcode: 'CG01-SE',
                'x-access-token': this.authService.getToken()
            };

            this.inventoryService.getadjustmentdata(payload).subscribe({
                next: (res: any) => {
                    // API returned new list; set as products and rebuild formArray
                    this.products = res?.data || [];
                    this.filteredProducts = [...this.products];
                    this.buildFormArrayFromProducts(this.filteredProducts);
                    if (this.products.length == 0) {
                        let message = 'No Data Available for this Category and Item';
                        this.showSuccess(message);
                    }
                },
                error: (err) => {
                    console.error(err);
                }
            });
        } else {
            // if you want better UX, show a message instead of alert
            let message = 'Please select both Category and Item before filtering.';
            this.errorSuccess(message);
        }
    }

    // ---------- Build payload and save ----------
    OnChangedROPdown() {
        // prepare p_stock from formArray values
        const stockArray = this.getStockArray().value as any[]; // raw values
        const trimmed = (stockArray || [])
            .map((r) => ({
                ItemId: r.ItemId,
                // UOMId: r.UOMId,
                batchId: r.BatchId,
                Quantity: r.Quantity,
                adjtype: r.adjtype,
                mrpvalue: r.mrpvalue
            }))
            .filter((r) => r.Quantity != null && r.adjtype); // keep only filled rows

        if (trimmed.length === 0) {
            let message = 'No rows to save. Please enter Quantity and Adjustment Type for at least one row.';
            this.errorSuccess(message);

            return;
        }

        const payload = {
            uname: 'admin',
            p_stock: trimmed,
            p_username: 'admin',
            clientcode: 'CG01-SE',
            p_updatetype: this.updateForm.controls['mrpUpdate'].value,
            'x-access-token': this.authService.getToken()
        };
        console.log('📌 Payload Sent:', payload);
        // call API
        this.inventoryService.updatestockadjustment(payload).subscribe({
            next: (res: any) => {
                this.showSuccess((res?.data && res.data[0]?.msg) || 'Stock updated successfully');
                // optionally refresh data
                this.onGetStockIn();
            },
            error: (err) => console.error(err)
        });
    }

    // ---------- Submit wrapper with confirm ----------
    onSubmit() {
        // do a confirmation dialog before final save
        this.confirmationService.confirm({
            message: 'Are you sure you want to make changes?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            accept: () => {
                // call save function
                this.OnChangedROPdown();
            },
            reject: () => {}
        });
    }

    // ---------- Utility ----------
    reset() {
        // this.updateForm.reset();
        // // reinitialize form array and filteredProducts to full list
        // this.filteredProducts = [...this.products];
        // this.buildFormArrayFromProducts(this.products);
        this.updateForm.reset();
        this.updateForm.patchValue({
            mrpUpdate: 'B'
        });
        // Clear FormArray
        // this.getStockArray().clear();

        // Clear table data
        this.products = [];
        this.filteredProducts = [];
        this.pagedProducts = [];

        // Reset pagination
        this.first = 0;
        //  this.globalFilter='';
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }

    closeDialog() {
        // placeholder in case you use dialogs
    }
}
