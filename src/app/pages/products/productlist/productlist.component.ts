import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { ConfirmationService, MessageService } from 'primeng/api';
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
    mode: 'add' | 'itemedit' = 'itemedit';
    pagedProducts: StockIn[] = [];
    first: number = 0;
    rowsPerPage: number = 5;
    products: StockIn[] = [];
    filteredProducts: StockIn[] = [];
    globalFilter: string = '';
    showGlobalSearch: boolean =true;
    uomOptions: any[] = [];  
    // ✅ Move dropdown options into variables
   categoryOptions = [];

    itemOptions = [];

    constructor(
        private fb: FormBuilder,
        private inventoryService:InventoryService,
        private authService:AuthService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
       
        this.updateForm = this.fb.group({
            category: [''],
            item: [''],
             p_stock: this.fb.array([])
        });
       this.loadAllDropdowns();
        this.onGetStockIn();
       
        this.updateForm.get('category')?.valueChanges.subscribe(()=>this.applyGlobalFilter());
        this.updateForm.get('item')?.valueChanges.subscribe(()=>this.applyGlobalFilter());
    }

    onGetStockIn() {
        this.products = this.inventoryService.productItem || [];
        // this.products.forEach((p: any) => (p.selection = true));
        // this.filteredProducts = [...this.products];
        this.buildFormArrayFormProducts(this.products);
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
        const searchTerm=(this.globalFilter || '')?.toLowerCase().trim();
       const selectedCategory=this.updateForm.get('category')?.value;
       const selectedItem=this.updateForm.get('item')?.value;
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
   
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.updatePagedProducts();
    }
    updatePagedProducts() {
        // this.pagedProducts = (this.filterProducts || []).slice(this.first,this.first+this.rowsPerPage);
    }
    getStockArray():FormArray{
        return this.updateForm.get('p_stock') as FormArray;
    }
    openEditDialog(rowData: any) {
    this.mode='itemedit';
    this.selectedRow=rowData|| null;
    this.visibleDialog=true;
    console.log("selectedrow",this.selectedRow);
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
        this.OnGetUOM();
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
private buildFormArrayFormProducts(products:any[]){
const stockArray = this.getStockArray();
console.log('stock arrary',stockArray);
stockArray.clear();
products.forEach((p:any)=>{
  const group=this.fb.group({
    itemid:[p.itemid],
    categoryid:[p.categoryid],
    mrp:[p.mrp],
    BarCode:[p.BarCode],
    isactive:[p.active],
    uon:[p.uom],
    purchaseprice:[p.purchaseprice] 
  });
  stockArray.push(group);
});
}
 Onreturndropdowndetails() {
    const category=this.updateForm.controls['category'].value;
    const item = this.updateForm.controls['item'].value;
    if(category || item){
       const payload = {
    uname: 'admin',
    p_categoryid: category || null,
    p_itemid: item || null,
    p_username: 'admin',
    clientcode: 'CG01-SE',
    'x-access-token': this.authService.getToken()   
       };
        this.inventoryService.getupdatedata(payload).subscribe({
            next:(res:any)=>{
                console.log("API RESULT:", res.data);
                this.products=res?.data || [];
                this.filteredProducts=[...this.products];
                this.buildFormArrayFormProducts(this.filteredProducts);
                if(this.products.length==0){
                    let message='No Data Available for this Category and Item';
                     this.showSuccess(message);
                }
            },
            error:(err)=>{
                console.error(err);
            }
        });
    }
    else{
        let message='Please select both Category and Item before filtering.';
        this.errorSuccess(message);
    }
 }
 OnGetUOM() {
  const payload = this.createDropdownPayload("UOM");
  this.inventoryService.getdropdowndetails(payload).subscribe({
    next: (res) => this.uomOptions = res.data,
    error: (err) => console.log(err)
  });
}
    onSave(updatedData: any) {
        console.log(updatedData)
        return
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
        // this.inventoryService.productItem = [...this.filteredProducts];
    }

    reset() {
        this.updateForm.reset();
        this.filteredProducts = [];
    }
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
     errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
