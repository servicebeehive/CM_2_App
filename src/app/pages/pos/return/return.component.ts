import { CommonModule } from '@angular/common';
import { Component, ViewChild, viewChild } from '@angular/core';
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
@Component({
    selector: 'app-retrun',
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
    templateUrl: './return.component.html',
    styleUrl: './return.component.scss',
    providers: [ConfirmationService]
})
export class ReturnComponent {
    returnForm!: FormGroup;
    visibleDialog = false;
    selectedRow: any = null;
    mode: 'add' | 'edit' = 'add';
    pagedProducts: StockIn[] = [];
    first: number = 0;
    rowsPerPage: number = 5;
    products: StockIn[] = [];
    filteredProducts: StockIn[] = [];
    selectedProducts:any[]=[];
    globalFilter: string = '';
    childUomStatus: boolean = false;
    showGlobalSearch:boolean=true;
    //for testing
      @ViewChild(AddinventoryComponent) addInventoryComp!: AddinventoryComponent;
 // ✅ Move dropdown options into variables
    returnBillNoOptions = [
        { label: 'Return Bill 1', value: 'rerunBill1' },
        { label: 'Return Bill 2', value: 'rerunBill2' },
        { label: 'Return Bill 3', value: 'rerunBill3' }
    ];

    // ✅ Move dropdown options into variables
    billNoOptions = [
        { label: 'Bill 1', value: 'bill1' },
        { label: 'Bill 2', value: 'bill2' },
        { label: 'Bill 3', value: 'bill3' }
    ];

    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.onGetStockIn();
        this.returnForm = this.fb.group({
            returnBillNo: ['', Validators.required],
            billNo: ['', Validators.required],
            customerName: [''],
            mobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],
            transId: ['', Validators.required],
            totalCost: [''],
            mrpTotal: [''],
            roundOff: [''],
            discountLabel: [''],
            finalPayable: [''],
        });
        this.returnForm.valueChanges.subscribe(() => {
            this.filterProducts();
        });
        this.returnForm.get('discountLabel')?.valueChanges.subscribe(() => {
            this.updatedFinalAmount();
        });
    }

    allowOnlyNumbers(event: KeyboardEvent) {
        const allowedChars = /[0-9]\b/;
        const inputChar = String.fromCharCode(event.key.charCodeAt(0));
        if (!allowedChars.test(inputChar)) {
            event.preventDefault();
        }
    }

    onGetStockIn() {
        this.products = this.stockInService.productItem || [];
        this.products.forEach((p: any) => {
            p.selection = true;
            // p.quantity = 0;
            p.total = 0;
        });
        this.filteredProducts = [...this.products];
    }
    filterProducts() {
        const searchTerm = this.globalFilter?.toLowerCase() || '';
        this.filteredProducts = this.products.filter((p) => {
            const globalMatch = searchTerm ? Object.values(p).some((val) => String(val).toLowerCase().includes(searchTerm)) : true;
            return globalMatch;
        });
        console.log('filtered data:', this.filteredProducts);
    }

    applyGlobalFilter() {
        const searchTerm = this.globalFilter?.toLowerCase() || '';
        this.filteredProducts = this.products.filter((p) => {
            return Object.values(p).some((value) => String(value).toLowerCase().includes(searchTerm));
        });
    }
    updateTotal(item: any) {
        const qty = Number(item.quantity);
        const mrp = Number(item.mrp) || 0;
        item.total = +(mrp * qty).toFixed(2);
        this.calculateTotals();
        this.updateSelectedTotal();
    }
    calculateTotals() {
        const totalMrp = this.filteredProducts.reduce((sum, p) => sum + (p.mrp || 0) * (p.quantity || 0), 0);
        this.returnForm.patchValue(
            {
                mrpTotal: totalMrp.toFixed(2)
            },
            { emitEvent: false }
        );
        this.updatedFinalAmount();
    }
    updatedFinalAmount() {
        const mrpTotal = Number(this.returnForm.get('mrpTotal')?.value || 0);
        const disc = Number(this.returnForm.get('discountLabel')?.value || 0);
        const discountedAmount = mrpTotal - (mrpTotal * disc) / 100;
        const roundedAmount = Math.round(discountedAmount);
        const roundOff = +(roundedAmount - discountedAmount).toFixed(2);
        this.returnForm.patchValue(
            {
                roundOff: roundOff,
                finalPayable: roundedAmount.toFixed(2)
            },
            { emitEvent: false }
        );
        this.returnForm.patchValue({ finalPayable: roundedAmount }, { emitEvent: false });
    }
    updateSelectedTotal(){
        const totalMrp=this.selectedProducts.reduce((sum, item)=>{
          const qty=Number(item.quantity) || 0;
          const mrp = Number(item.mrp) || 0;
          return sum + (qty * mrp);
        },0);
        this.returnForm.patchValue({
            mrpTotal:totalMrp.toFixed(2)
        },{emitEvent:false});
        this.updatedFinalAmount();
    }
    onSelectionChange(){
         console.log('Selected rows:', this.selectedProducts);
    }
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.updatePagedProducts();
    }
    updatePagedProducts() {
        this.pagedProducts = this.products.slice(this.first, this.first + this.rowsPerPage);
    }

    //for testing
    addItem() {
        this.mode = 'add';
        this.selectedRow = null;
        this.visibleDialog = true;
        setTimeout(() => {
            this.addInventoryComp.resetForm();
        });
    }
    closeDialog() {
        this.visibleDialog = false;
    }
    onChildUom(status: boolean): boolean {
        this.childUomStatus = status;
        return this.childUomStatus;
    }

    deleteItem(product: any) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete <b>${product.name}</b>?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.products = this.products.filter((p) => p.code !== product.code);
                this.filterProducts();
                this.calculateTotals();
            },
            reject: () => {
                // Optional: Add toast or log cancel
                console.log('Deletion cancelled');
            }
        });
    }
    hold() {}
    print() {}
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
            uom: updatedData.uom,
            mrp: updatedData.mrp,
            discount: updatedData.discount,
            minStock: updatedData.minStock,
            warPeriod: updatedData.warPeriod,
            location: updatedData.location
        };
        const index = this.filteredProducts.findIndex((p) => p.code === this.selectedRow?.code);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...mappedData };
        }
        if (this.mode === 'add') {
            this.products.push(mappedData);
        }
        this.filteredProducts = [...this.products];
        this.calculateTotals();
        this.closeDialog();
    }

    saveAllChanges() {
        // this.stockInService.productItem = [...this.filteredProducts];
    }
    onSubmit() {
        console.log(this.returnForm.value);
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
        this.returnForm.reset();
        this.products = [];
        this.filteredProducts = [];
        this.pagedProducts = [];
        this.first = 0;
        this.returnForm.patchValue(
            {
                mrpTotal: '',
                totalCost: '',
                roundOff: '',
                discountLabel: '',
                finalPayable: ''
            },
            { emitEvent: false }
        );
    }
}
