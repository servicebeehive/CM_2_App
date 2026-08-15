import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { DropdownModule } from 'primeng/dropdown';
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
import { AuthService } from '@/core/services/auth.service';
import JsBarcode from 'jsbarcode';
import { Router } from '@angular/router';
import { AddItemConsComponent } from '@/pages/inventory/add-item-cons/add-item-cons.component';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-product-list-cons',
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
        AddItemConsComponent,
        ToastModule
    ],
    templateUrl: './product-list-cons.component.html',
    styleUrl: './product-list-cons.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class ProductListConsComponent {
    updateForm!: FormGroup;

    visibleDialog = false;
    selectedRow: any = null;
    selection: boolean = true;
    mode: 'add' | 'edit' = 'add';
    first: number = 0;
    rowsPerPage: number = 5;
    products: StockIn[] = [];
    filteredProducts: StockIn[] = [];
    globalFilter: string = '';
    showGlobalSearch: boolean = true;
    uomOptions: any[] = [];
    showData: boolean = false; 
    categoryOptions = [];
    printList: any[] = [];
    itemOptions = [];
    barcodeDialog: boolean = false;
    selectedItems: any[] = [];
    currentPage = 1;
    itemsPerPage = 10;

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private messageService: MessageService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.updateForm = this.fb.group({
            category: [''],
            item: [''],
            p_stock: this.fb.array([])
        });
        this.loadAllDropdowns();
    }

    onGetStockIn() {
        this.products = this.inventoryService.productItem || [];
    }

    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
    }

    getStockArray(): FormArray {
        return this.updateForm.get('p_stock') as FormArray;
    }

    openEditDialog(rowData: any) {
        this.mode='edit';
        this.selectedRow = rowData || null;
        this.visibleDialog = true;
    }

    createDropdownPayload(returnType: string) {
        return {
            p_username: this.authService.isLogIntType().industry_type_id.toString(),
            p_returntype: returnType
        };
    }

    loadAllDropdowns() {
        this.OnGetItem();
        this.OnGetCategory();
        this.OnGetUOM();
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
            p_username: this.authService.isLogIntType().industry_type_id.toString(),
            p_returntype: 'CATEGORY',
            p_returnvalue: id.toString()
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
                this.itemOptions = [];
            }
        });
    }

    OnGetItem() {
        const payload = this.createDropdownPayload('ITEMALL');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.itemOptions = res.data || []),
            error: (err) => console.log(err)
        });
    }

    OnGetCategory() {
        const payload = this.createDropdownPayload('CATEGORY');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.categoryOptions = res.data || []),
            error: (err) => console.log(err)
        });
    }

    Onreturndropdowndetails() {
        const category = this.updateForm.controls['category'].value;
        const item = this.updateForm.controls['item'].value;
        if (category === null && item === null) {
            this.filteredProducts = [];
            this.products = [];
        }
        if (!category && !item) {
            let message = 'Please select both Category and Item before filtering.';
            this.errorSuccess(message);
            return;
        }
        const payload = {
            p_returntype: 'ITEMDETAILS',
            p_returnvalue: category || '',
             p_username: item || ''
        };

        this.showData = false;

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                console.log('API RESULT:', res.data);
                this.products = res?.data || [];
                this.filteredProducts = [...this.products];
                this.showData = true;
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

    OnGetUOM() {
        const payload = this.createDropdownPayload('UOM');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.uomOptions = res.data || []),
            error: (err) => console.log(err)
        });
    }

    add(){
       this.mode = 'add';
    this.selectedRow = null;
    this.visibleDialog = true;
    }

    onSave(updatedData: any) {
        const message = updatedData?.message || 'Item saved successfully.';
        this.showSuccess(message);
        this.Onreturndropdowndetails();
    }

    closeDialog() {
        this.visibleDialog = false;
        this.reset();
    }

    reset() {
        this.updateForm.reset();
        this.filteredProducts = [];
        this.products = [];
        this.showData = false;
        this.OnGetItem();
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }

    allowOnlyNumbers(event: any) {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode < 48 || charCode > 57) {
            event.preventDefault();
        }
    }

    openBarcodeDialog() {
        if (!this.selectedItems || this.selectedItems.length === 0) {
            alert('Please select at least one item.');
            return;
        }
        this.printList = this.selectedItems.map((item) => ({
            itemcombine: item.itemcombine,
            barcode: item.itembarcode
        }));
        this.currentPage = 1;
        this.barcodeDialog = true;
    }

    generateBarcode(code: string) {
        const canvas = document.createElement('canvas');
        if (!code) {
            return;
        }
        JsBarcode(canvas, code, { format: 'CODE128', width: 3, height: 50 });
        return canvas.toDataURL('image/png');
    }

    printBarcodes() {
        const printContents = document.getElementById('print-barcode-area')?.innerHTML;
        const popup = window.open('', '_blank', 'width=800,height=600');

        popup!.document.open();
        popup!.document.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            body { font-family: Arial; text-align:center; }
            img { margin-top:0px; }
            div { margin-bottom:0px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    }

    get totalPages() {
        return Math.ceil(this.printList.length / this.itemsPerPage);
    }

    get paginatedItems() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.printList.slice(start, start + this.itemsPerPage);
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    goToPage(page: number) {
        this.currentPage = page;
    }

    printSingleBarcode(row: any) {
        const barcodeImage = this.generateBarcode(row.itembarcode);

        const popup = window.open('', '_blank', 'width=400,height=600');

        popup!.document.open();
        popup!.document.write(`
    <html>
      <head>
        <title>Print Barcode</title>
        <style>
          body { text-align: center; font-family: Arial; padding: 20px; }
          img { width: 250px; height: auto; margin-top:0px; }
          h4 { margin-bottom:0px; font-size:18px; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <h4>${row.itemcombine}</h4>
        <img src="${barcodeImage}" />
      
      </body>
    </html>
  `);
    }
}
