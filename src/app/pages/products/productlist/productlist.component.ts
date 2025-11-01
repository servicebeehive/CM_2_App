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
        AddinventoryComponent
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
    // ✅ Move dropdown options into variables
    categoryOptions = [
        { label: 'Switch', value: 'Switch' },
        { label: 'Bulb', value: 'Bulb' },
        { label: 'Fan', value: 'Fan' }
    ];

    itemOptions = [
        { label: 'Anchor switch 3/4', value: 'Anchor Switch 3/4' },
        { label: 'Led Bulb', value: 'LED Bulb' },
        { label: 'Fan', value: 'Fan' }
    ];

    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.onGetStockIn();
        this.updateForm = this.fb.group({
            category: ['', Validators.required],
            item: ['', Validators.required],
            globalFilter: ['']
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
        const searchTerm = this.updateForm.get('globalFilter')?.value?.toLowerCase() || '';
        this.filteredProducts = this.products.filter((p) => {
            return Object.values(p).some((value) => String(value).toLowerCase().includes(searchTerm));
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
        this.selectedRow = rowData || null;
        this.visibleDialog = true;
    }

    // deleteAll() {
    //     const selectedItems=this.filteredProducts.filter(p=>p.selection);
    //     if(selectedItems.length===0)
    //         return;
    //     this.confirmationService.confirm({
    //         message: `Are you sure you want to delete <b>${selectedItems.length}</b> selected item(s)?`,
    //         header:'Confirm Bulk Delete',
    //         icon:'pi pi-exclamation-triangle',
    //         acceptLabel:'Yes',
    //         rejectLabel:'No',
    //         acceptButtonStyleClass:'p-button-danger',
    //         rejectButtonStyleClass:'p-button-secondary',
    //         accept: ()=>{
    //             const selectedCodes=selectedItems.map((p)=>p.code);
    //             this.products=this.products.filter((p)=>!selectedCodes.includes(p.code));
    //            this.filteredProducts=this.filteredProducts.filter(p=>!selectedCodes.includes(p.code));

    //         },
    //         reject: ()=>console.log('Deletion Cancelled')
    //     });
    // }
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
            uom: updatedData.discount,
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
    // deleteItem(product: any) {
    //     this.confirmationService.confirm({
    //         message: `Are you sure you want to delete <b>${product.name}</b>?`,
    //         header: 'Confirm Delete',
    //         icon: 'pi pi-exclamation-triangle',
    //         acceptLabel: 'Yes',
    //         rejectLabel: 'No',
    //         acceptButtonStyleClass: 'p-button-danger',
    //         rejectButtonStyleClass: 'p-button-secondary',
    //         accept: () => {
    //             this.products = this.products.filter((p) => p.code !== product.code);
    //             this.filterProducts();
    //         },
    //         reject: () => {
    //             // Optional: Add toast or log cancel
    //             console.log('Deletion cancelled');
    //         }
    //     });
    // }
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
