import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
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
import { ConfirmationService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { AddinventoryComponent } from '@/pages/inventory/addinventory/addinventory.component';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
@Component({
    selector: 'app-productlist',
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
        CheckboxModule,
        AddinventoryComponent,
        GlobalFilterComponent   
    ],
    templateUrl: './productlist.component.html',
    styleUrl: './productlist.component.scss',
    providers: [ConfirmationService]
})
export class ProductlistComponent {
    updateForm!: FormGroup;
    
    visibleDialog = false;
    selectedRow: any = null;
    selection: boolean = true;
    mode: 'add' | 'edit' = 'edit';
    pagedProducts: StockIn[] = [];
    first: number = 0;
    rowsPerPage: number = 5;
    products: StockIn[] = [];
    filteredProducts: StockIn[] = [];
    globalFilter: string = '';
    showGlobalSearch: boolean =true;
    // ✅ Move dropdown options into variables
   categoryOptions = [];

    itemOptions = [];

    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService,
        private inventoryService:InventoryService,
        private authService:AuthService,
    ) {}

    ngOnInit(): void {
        this.loadAllDropdowns();
        this.onGetStockIn();
        this.updateForm = this.fb.group({
            category: [''],
            item: [''],
        });
        this.updateForm.valueChanges.subscribe(() => {
            this.filterProducts();
        });
    }

    onGetStockIn() {
        this.products = this.stockInService.productItem || [];
        this.products.forEach((p: any) => (p.selection = true));
        this.filteredProducts = [...this.products];
    }
    allowOnlyNumbers(event:KeyboardEvent){
        const allowedChars=/[0-9]\b/;
        const inputChar=String.fromCharCode(event.key.charCodeAt(0));
        if(!allowedChars.test(inputChar)){
            event.preventDefault();
        }
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
        // const searchTerm = this.updateForm.get('globalFilter')?.value?.toLowerCase() || '';
        // this.filteredProducts = this.products.filter((p) => {
        //     return Object.values(p).some((value) => String(value).toLowerCase().includes(searchTerm));
        // });
        const searchTerm=this.globalFilter?.toLowerCase() || '';
        this.filteredProducts=this.products.filter((p)=>{
             Object.values(p).some((value)=>String(value).toLowerCase().includes(searchTerm));
        });
    }
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.updatePagedProducts();
    }
    updatePagedProducts() {
        this.pagedProducts = this.products.slice(this.first, this.first + this.rowsPerPage);
    }
    openEditDialog(rowData: any) {
    //    const matchedCategory = this.categoryOptions.find(otp=>otp.value===rowData.category);
       const matchedUOM = rowData.uom?{label:rowData.uom , value:rowData.uom} : null; 
       this.selectedRow={
        ...rowData,
        // category:matchedCategory? matchedCategory.value :rowData.category,
        parentUOM:matchedUOM?matchedUOM.value:rowData.uom
       }
        this.visibleDialog = true;
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
    onSave(updatedData: any) {
        const mappedData = {
            selection: true,
            code: updatedData.itemCode.label || updatedData.itemCode,
            name: updatedData.itemName,
            category: updatedData.category,
            curStock: updatedData.curStock,
            purchasePrice: updatedData.purchasePrice,
            quantity: updatedData.qty,
            total: (updatedData.purchasePrice || 0) * (updatedData.qty || 0),
            uom: updatedData.parentUOM,
            mrp: updatedData.mrp,
            discount: updatedData.discount,
            minStock: updatedData.minStock,
            warPeriod: updatedData.warPeriod,
            location: updatedData.location
        };
        const index = this.filteredProducts.findIndex((p) => p.code === this.selectedRow.code);
        if (index !== -1) {
            this.filteredProducts[index] = { ...this.products[index], ...mappedData };
        }
    }
    closeDialog() {
        this.visibleDialog = false;
    }
    saveAllChanges() {
        // this.stockInService.productItem = [...this.filteredProducts];
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
}
