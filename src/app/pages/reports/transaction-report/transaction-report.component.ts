import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { Paginator } from 'primeng/paginator';
import { RouterLink } from "@angular/router";
import { AuthService } from '@/core/services/auth.service';
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
    selector: 'app-transaction-report',
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
    ToggleSwitchModule,
    RippleModule,
    ChipModule,
    FluidModule,
    MessageModule,
    DatePickerModule,
    DialogModule,
    AutoCompleteModule,
    ConfirmDialogModule,
    CheckboxModule,
    RouterLink
],
    templateUrl: './transaction-report.component.html',
    styleUrl: './transaction-report.component.scss',
    providers:[ConfirmationService]
})
export class TransactionReportComponent {
    reportForm!: FormGroup;

     visibleDialog=false;
     selectedRow:any=null;
     selection:boolean=true;
     pagedProducts:StockIn[]=[];
     first:number=0;
     rowsPerPage:number=5;
    globalFilter: string = '';
        // ✅ Move dropdown options into variables
        reportTypeOptions = [];
        categoryOptions = [];
        itemOptions = [];
        products: StockIn[] = [];
        filteredProducts: StockIn[] = [];
        constructor(
            private fb: FormBuilder,
            private inventoryService: InventoryService,
            private authService: AuthService,
            private messageService: MessageService
        ) {}

    ngOnInit(): void {
        this.reportForm = this.fb.group(
            {
                item: [''],
                reportType: [''],
                fromDate: [''],
                toDate:[''],
                category:[''],
               gstTransaction:[true],
                p_stock: this.fb.array([])
            }
        );
       this.loadAllDropdowns();
        this.onGetStockIn();
        this.reportForm.get('category')?.valueChanges.subscribe(() => this.applyGlobalFilter());
        this.reportForm.get('item')?.valueChanges.subscribe(() => this.applyGlobalFilter());
    }

  getStockArray(): FormArray {
        return this.reportForm.get('p_stock') as FormArray;
    }
    Onreturndropdowndetails() {
        const category = this.reportForm.controls['category'].value;
        const item = this.reportForm.controls['item'].value;
        console.log('cat', category,item);
        if (category || item) {
            const payload = {
                uname: 'admin',
                p_categoryid: category || null,
                p_itemid: item || null,
                p_username: 'admin',
                clientcode: 'CG01-SE',
                'x-access-token': this.authService.getToken()
            };
            this.inventoryService.getupdatedata(payload).subscribe({
                next: (res: any) => {
                    console.log('API RESULT:', res.data);
                    this.products = res?.data || [];
                    this.filteredProducts = [...this.products];
                    this.buildFormArrayFormProducts(this.filteredProducts);
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
            let message = 'Please select both Category and Item before filtering.';
            this.errorSuccess(message);
        }
    }
    private buildFormArrayFormProducts(products: any[]) {
        const stockArray = this.getStockArray();
        console.log('stock arrary', stockArray);
        stockArray.clear();
        products.forEach((p: any) => {
            const group = this.fb.group({
               itemid:[p.itemid],
    categoryid:[p.categoryid],
    mrp:[p.mrp],
    purchaseprice:[p.purchaseprice] 
            });
            stockArray.push(group);
        });
    }
    applyGlobalFilter() {
       const searchTerm=(this.globalFilter || '')?.toLowerCase().trim();
       const selectedCategory=this.reportForm.get('category')?.value;
       const selectedItem=this.reportForm.get('item')?.value;
       this.filteredProducts=this.products.filter((p:any)=>{
        const matchesSearch=!searchTerm || String(p.itemcombine ?? p.name ?? '').toLowerCase() .includes(searchTerm) ||
        String(p.categoryname ?? p.category ?? '').toLowerCase() .includes(searchTerm) ||
      String(p.curStock ?? p.currentstock ?? '')
                    .toLowerCase()
                    .includes(searchTerm);

            const matchesCategory = !selectedCategory || p.category === selectedCategory || p.categoryid === selectedCategory;
            const matchesItem = !selectedItem || p.name === selectedItem || p.itemid === selectedItem;

            return matchesSearch && matchesCategory && matchesItem;
       });
       this.buildFormArrayFormProducts(this.filteredProducts);
    }
    onGetStockIn() {
      this.products=this.inventoryService.productItem || [];
      this.buildFormArrayFormProducts(this.products);
    }

    onSave(updatedData: any) {
        const mappedData = {
            selection: true,
            code: updatedData.itemCode.label || updatedData.itemCode,
            itemName: updatedData.itemName,
            category: updatedData.category,
            stock: updatedData.stock,
            costPrice: updatedData.costPrice,
            mrp: updatedData.mrp,
            location: updatedData.location,
            lastUpdatedBy: updatedData.lastUpdatedBy,
            lastUpdated: updatedData.lastUpdated
        };
    }

    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.updatePagedProducts();
    }

    updatePagedProducts() {
        // this.pagedProducts = this.products.slice(this.first, this.first + this.rowsPerPage);
    }

    get grandTotal(): number {
        return this.products.reduce((sum, p) => sum + (p.total || 0), 0);
    }
    exportToExcel() {}

    reset() {
        this.reportForm.reset();
        this.filteredProducts = [];
    }
    createDropdownPayload(returnType: string) {
        return {
            uname: 'admin',
            p_username: 'admin',
            p_returntype: returnType,
            clientcode: 'CG01-SE',
            'x-access-token': this.authService.getToken()
        };
    }
    OnGetItem() {
        const payload = this.createDropdownPayload('ITEM');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    OnGetReport() {
        // const payload = this.createDropdownPayload('ITEM');
        // this.inventoryService.getdropdowndetails(payload).subscribe({
        //     next: (res) => (this.itemOptions = res.data),
        //     error: (err) => console.log(err)
        // });
    }
    OnGetCategory() {
        const payload = this.createDropdownPayload('CATEGORY');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.categoryOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    loadAllDropdowns() {
        this.OnGetReport();
        this.OnGetCategory();
        this.OnGetItem();
    }
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
