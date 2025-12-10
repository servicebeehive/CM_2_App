import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

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
    AutoCompleteModule
  ],
  templateUrl: './stock-adjustment.component.html',
  styleUrls: ['./stock-adjustment.component.scss'],
  providers: [ConfirmationService]
})
export class StockAdjustmentComponent {
  // -------------------------
  // Form & UI state
  // -------------------------
  updateForm!: FormGroup;

  // Pagination
  first: number = 0;
  rowsPerPage: number = 10;
  pagedProducts: StockIn[] = [];

  // Data arrays
  products: any[] = []; // full data list (raw objects)
  filteredProducts: any[] = []; // current visible list used by p-table
  globalFilter: string = '';
  showData: boolean = false; // New flag to control table visibility
  
  // Dropdown options
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

  // -------------------------
  // Constructor / DI
  // -------------------------
  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private confirmationService: ConfirmationService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  // -------------------------
  // Lifecycle
  // -------------------------
  ngOnInit(): void {
    // Initialize reactive form
    this.updateForm = this.fb.group({
      category: [''],
      item: [''],
      mrpUpdate: ['B'],
      p_stock: this.fb.array([]) // holds FormGroups for each table row
    });
    this.loadAllDropdowns();
  }

  // -------------------------
  // Helpers: FormArray access
  // -------------------------
  getStockArray(): FormArray {
    return this.updateForm.get('p_stock') as FormArray;
  }

  // -------------------------
  // UI utility: Prevent negative sign input
  // -------------------------
  blockMinus(event: KeyboardEvent) {
    // prevents '-' from being typed in numeric inputs used for quantity/mrp
    console.log(event);
    if (event.key === '-' || event.key === 'Minus' || event.key ==='e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  // -------------------------
  // Build Form Array from Products
  // -------------------------
  /**
   * Rebuilds the p_stock FormArray based on a product list.
   * - ensures each product has bound controls (mrpControl, quantityControl, adjustmentControl)
   * - subscribes to adjustmentControl changes to revalidate quantityControl (validator depends on adj type)
   *
   * IMPORTANT: This method intentionally preserves the product object reference and attaches controls to it.
   */
  private buildFormArrayFromProducts(products: any[]) {
    const stockArray = this.getStockArray();
    stockArray.clear();

    products.forEach((p: any) => {
      // ensure a default adjustment type exists on the product model
      p.adjustmentType = p.adjustmentType || 'increase';

      // create group for each product row
      const group = this.fb.group({
        ItemId: [p.itemid ?? p.ItemId],
        BatchId: [p.batchid ?? p.BatchId],

        // mrpvalue control with minimum validator
        mrpvalue: [
          p.mrpvalue ?? p.saleprice ?? null,
          [Validators.min(1)]
        ],

        // Quantity control:
        // - min(1) always
        // - quantityBatchValidator(p) added (validator logic may reference the product row)
        Quantity: [
          p.Quantity ?? null,
          [
            Validators.min(1),
            this.quantityBatchValidator(p) // single validator handling increase/decrease logic
          ]
        ],

        // adjtype bound to product.adjustmentType
        adjtype: [p.adjustmentType]
      });

      // Attach controls back onto product model so template can directly read control references.
      // Template expects row.mrpControl, row.quantityControl, row.adjustmentControl
      p.mrpControl = group.get('mrpvalue');
      p.quantityControl = group.get('Quantity');
      p.adjustmentControl = group.get('adjtype');

      // Keep validator responsive: when adjustment type changes, revalidate Quantity control
      p.adjustmentControl.valueChanges.subscribe(() => {
        p.quantityControl.updateValueAndValidity();
      });

      // push FormGroup into the FormArray
      stockArray.push(group);
    });

    // update filteredProducts to current list and refresh paged view
    this.filteredProducts = [...products];
    this.updatePagedProducts();
  }

  // -------------------------
  // Validator: Quantity vs Batch + Adj Type
  // -------------------------
  /**
   * Custom validator factory that checks:
   *  - If adj type is 'increase' => no batch validation
   *  - If adj type is 'decrease' => ensure Quantity <= row.batch_available
   *
   * The validator uses the product row object (row) which is attached to the form controls.
   */
  quantityBatchValidator(row: any): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const qty = Number(control.value);
      const adjType = row.adjustmentControl?.value;
      const batch = row.batch_available;

      if (!qty || qty < 1) return null;

      // No validation for Increase
      if (adjType === 'increase') {
        return null;
      }

      // Validation for Decrease only
      if (adjType === 'decrease' && qty > batch) {
        return { greaterThanBatch: true };
      }

      return null;
    };
  }


  // -------------------------
  // Adjustment dropdown handler
  // -------------------------
  /**
   * Called when adjustment dropdown changes for a product row.
   * Keeps product model in sync, sets control value and revalidates quantity control.
   */
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

  // -------------------------
  // Legacy / alternative validators (kept as-is per request)
  // -------------------------
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

  // -------------------------
  // Autocomplete helper for adjustment dropdown (if used)
  // -------------------------
  search(event: any) {
    const query = (event.query ?? '').toLowerCase();
    if (!query) {
      this.filteredAdjustment = [...this.adjustment];
      return;
    }
    this.filteredAdjustment = this.adjustment.filter((u) => u.label.toLowerCase().includes(query));
  }

  // -------------------------
  // Pagination handlers
  // -------------------------
  onPageChange(event: any) {
    this.first = event.first;
    this.rowsPerPage = event.rows;
    this.updatePagedProducts();
  }

  updatePagedProducts() {
    // slice from filteredProducts
    this.pagedProducts = (this.filteredProducts || []).slice(this.first, this.first + this.rowsPerPage);
  }

  // -------------------------
  // Dropdown loaders (calls inventory service)
  // -------------------------
  createDropdownPayload(returnType: string) {
    return {
       
      p_username: 'admin',
      p_returntype: returnType,
          
            
    };
  }

  loadAllDropdowns() {
    this.OnGetItem();
    this.OnGetCategory();
  }

  onCategoryItem(event: any) {
    const categoryId = event.value;
    this.updateForm.get('item')?.setValue(null);
    
    if (!categoryId) {
      this.OnGetItem();
      return;
    }
    
    this.categoryRelavantItem(categoryId);
  }

  categoryRelavantItem(id: any) {
    this.itemOptions = [];
    const payload = {
       
      p_username: "admin",
      p_returntype: "CATEGORYITEM",
      p_returnvalue: id.toString(),
      
       
    };
    
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
      next: (res: any) => {
        if (!res.data || res.data.length === 0) {
          this.itemOptions = [];
          this.showSuccess('No items found for this category.');
          return;
        }
        this.itemOptions = res.data;
      },
      error: (err) => {
        console.error(err);
      }
    });
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

  // -------------------------
  // Fetch adjustment data (based on selected category/item)
  // -------------------------
  Onreturndropdowndetails() {
    const category = this.updateForm.controls['category'].value;
    const item = this.updateForm.controls['item'].value;
    if(category ==null && item === null){
      this.filteredProducts=[];
      this.products=[];
    }
    if (!category && !item ) {
      let message = 'Please select both Category and Item before filtering.';
      this.errorSuccess(message);
      return;
    }

    const payload = {
       
      p_categoryid: category || null,
      p_itemid: item || null,
      p_username: 'admin',
      p_updatetype: this.updateForm.controls['mrpUpdate'].value,
          
            
    };

    this.showData = false; // Hide previous data while loading
    
    this.inventoryService.getadjustmentdata(payload).subscribe({
      next: (res: any) => {
        // API returned new list; set as products and rebuild formArray
        this.products = res?.data || [];
        this.filteredProducts = [...this.products];
        this.buildFormArrayFromProducts(this.filteredProducts);
        this.showData = true; // Show data after successful API call
        
        if (this.products.length === 0) {
          let message = 'No Data Available for this Category and Item';
          this.showSuccess(message);
        }
      },
      error: (err) => {
        console.error(err);
        this.errorSuccess('Error loading data. Please try again.');
        this.showData = false;
      }
    });
  }

  // -------------------------
  // Prepare payload and save adjustments
  // -------------------------
  OnChangedROPdown() {
    // prepare p_stock from formArray values
    const stockArray = this.getStockArray().value as any[]; // raw values
    const trimmed = (stockArray || [])
      .map((r) => ({
        ItemId: r.ItemId,
        batchId: r.BatchId,
        Quantity: r.Quantity,
        adjtype: r.adjtype || null,
        mrpvalue: r.mrpvalue
      }))
      .filter((r) => (r.Quantity != null && r.Quantity > 0 && r.adjtype) || (r.mrpvalue != null && r.mrpvalue !== "")); // keep only filled rows

    if (trimmed.length === 0) {
      let message = 'No rows to save. Please enter Quantity and Adjustment Type for at least one row.';
      this.errorSuccess(message);
      return;
    }

    const payload = {
       
      p_stock: trimmed,
       
          
      p_updatetype: this.updateForm.controls['mrpUpdate'].value,
            
    };
  
    // call API
    this.inventoryService.updatestockadjustment(payload).subscribe({
      next: (res: any) => {
        this.showSuccess((res?.data && res.data[0]?.msg) || 'Stock/MRP updated successfully');
        // optionally refresh data
        this.Onreturndropdowndetails();
      },
      error: (err) => console.error(err)
    });
  }

  onItemChange(event: any) {
    // No automatic filtering
  }

  // -------------------------
  // Confirm + submit wrapper
  // -------------------------
  onSubmit() {
    // confirmation dialog before saving
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

  // -------------------------
  // Utilities: reset and messages
  // -------------------------
  reset() {
    // Reset the form and clear table data
    this.updateForm.reset({
      mrpUpdate: 'B',
    });
    
    // Clear model lists and pagination
    this.products = [];
    this.filteredProducts = [];
    this.pagedProducts = [];
    this.first = 0;
    this.showData = false; // Hide table on reset
    this.OnGetItem();
  }

  showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  errorSuccess(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}