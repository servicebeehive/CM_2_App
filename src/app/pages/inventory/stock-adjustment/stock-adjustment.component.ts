import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
import { StockIn } from '@/types/stockin.model';
import { InventoryService } from '@/core/services/inventory.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { filter } from 'rxjs';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
@Component({
    selector: 'app-stock-adjustment',
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
    styleUrl: './stock-adjustment.component.scss',
    providers: [ConfirmationService]
})
export class StockAdjustmentComponent {
    updateForm!: FormGroup;

    visibleDialog = false;
    selection: boolean = true;
    pagedProducts: StockIn[] = [];
    first: number = 0;
    rowsPerPage: number = 5;
    products: StockIn[] = [];
    filteredProducts: StockIn[] = [];
    globalFilter: string = '';
    filteredAdjustment: any[] = [];
    showGlobalSearch: boolean = true;
    // ✅ Move dropdown options into variables
    categoryOptions = [];
    itemOptions = [];
    adjustment = [
        { label: 'Increase', value: 'increase' },
        { label: 'Decrease', value: 'decrease' }
    ];
    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private confirmationService: ConfirmationService,
        private authService:AuthService,
        private messageService:MessageService
    ) {}

    ngOnInit(): void {
        this.loadAllDropdowns();
        this.onGetStockIn();
        this.updateForm = this.fb.group({
            category: ['', Validators.required],
            item: ['', Validators.required]
        });

        
        this.updateForm.valueChanges.subscribe(() => {
            this.filterProducts();
        });
    }
    quantityValidator(curStock: number, adjustmentTypeGetter: () => string | null): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            console.log('Validator running for:', curStock, adjustmentTypeGetter(), control.value);
            const adjustmentType = adjustmentTypeGetter();
            const enteredQty = control.value;
            if (adjustmentType === 'decrease' && enteredQty != null && enteredQty > curStock) {
                return { greaterThanStock: true };
            }
            return null;
        };
    }
    onGetStockIn() {
        this.products = this.inventoryService.productItem || [];
        this.products.forEach((p: any) => {
            p.selection = true;
            p.adjustmentType = '';
            p.quantityControl = this.fb.control(null, [Validators.required, this.quantityValidator(p.curStock, () => p.adjustmentType)]);
        });
        this.filteredProducts = [...this.products];
    }
    filterProducts() {
        const category = this.updateForm.get('category')?.value;
        const item = this.updateForm.get('item')?.value;
        const searchTerm = this.globalFilter?.toLowerCase() || '';
        this.filteredProducts = this.products.filter((p) => {
            const categoryMatch = category ? p.category === category : true;
            const itemMatch = item ? p.name === item : true;
            const globalMatch = searchTerm ? Object.values(p).some((val) => String(val).toLowerCase().includes(searchTerm)) : true;

            return categoryMatch && itemMatch && globalMatch;
        });
        console.log('filtered data:', this.filteredProducts);
    }
    applyGlobalFilter() {
  const searchTerm = (this.globalFilter || '').toLowerCase().trim();
  const selectedCategory = this.updateForm.get('category')?.value;
  const selectedItem = this.updateForm.get('item')?.value;

  this.filteredProducts = this.products.filter((p: any) => {
    const matchesSearch =
      !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm) ||
      p.category?.toLowerCase().includes(searchTerm) ||
      p.curStock?.toString().includes(searchTerm);

    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesItem = !selectedItem || p.name === selectedItem;

    return matchesSearch && matchesCategory && matchesItem;
  });
        // const searchTerm = this.updateForm.get('globalFilter')?.value?.toLowerCase() || '';
        // this.filteredProducts = this.products.filter((p) => {
        //     return Object.values(p).some((value) => String(value).toLowerCase().includes(searchTerm));
        // });
    }
    onAdjustmentChange(event: any, product: any) {
        const selected = event?.value ?? event;
        product.adjustmentType = selected.value ?? selected;
        product.quantityControl.updateValueAndValidity({ emitEvent: true });
    }
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.updatePagedProducts();
    }
    updatePagedProducts() {
        this.pagedProducts = this.products.slice(this.first, this.first + this.rowsPerPage);
    }
    search(event: any) {
        const query = (event.query ?? '').toLowerCase();
        if (!query) {
            this.filteredAdjustment = [...this.adjustment];
            return;
        }
        this.filteredAdjustment = this.adjustment.filter((u) => u.label.toLowerCase().includes(query));
    }

    closeDialog() {
        this.visibleDialog = false;
    }
    saveAllChanges() {
      
    }
    createDropdownPayload(returnType: string) {
  return {
    uname: "admin",
    p_username: "admin",
    p_returntype: returnType,
    clientcode: "CG01-SE",
    "x-access-token": this.authService.getToken()
  };
}
    loadAllDropdowns(){
        this.OnGetItem();
        this.OnGetCategory();
    }
    OnGetItem() {
  const payload = this.createDropdownPayload("ITEM");
  this.inventoryService.getdropdowndetails(payload).subscribe({
    next: (res) => this.itemOptions = res.data,
    error: (err) => console.log(err)
  });
}
    OnGetCategory() {
  const payload = this.createDropdownPayload("CATEGORY");
  this.inventoryService.getdropdowndetails(payload).subscribe({
    next: (res) => this.categoryOptions = res.data,
    error: (err) => console.log(err)
  });
}
    onSubmit() {
        console.log(this.updateForm.value);
        this.confirmationService.confirm({
            message: 'Are you sure you want to make changes?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            accept: () => {
                this.saveAllChanges();
            },
            reject: () => {}
        });
    }

    reset() {
        this.updateForm.reset();
        this.filteredProducts = [...this.products];
    }
   
     showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
}
