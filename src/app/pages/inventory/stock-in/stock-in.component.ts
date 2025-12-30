import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
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
import { AddinventoryComponent } from '../addinventory/addinventory.component';
import { StockIn } from '@/types/stockin.model';
import { InventoryService } from '@/core/services/inventory.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { Paginator } from 'primeng/paginator';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@/core/services/auth.service';
import { DrowdownDetails } from '@/core/models/inventory.model';
import { MessageService } from 'primeng/api';
import { ShareService } from '@/core/services/shared.service';

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
    selector: 'app-stock-in',
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
        AddinventoryComponent,
        AutoCompleteModule,
        ConfirmDialogModule,
        CheckboxModule
    ],
    templateUrl: './stock-in.component.html',
    styleUrl: './stock-in.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class StockInComponent {
    public transationid: any;
    productForm!: FormGroup;
    public authService = inject(AuthService);
    visibleDialog = false;
    selectedRow: any = null;
    filteredVendors: any[] = [];
    filteredInvoiceNo: any[] = [];
    selectedVendor: any;
    mode: 'add' | 'edit' = 'add';
    selection: boolean = true;
    pagedProducts: StockIn[] = [];
    first: number = 0;
    rowsPerPage: number = 5;
    childUomStatus: boolean = false;
    addItemEnabled = false;
    @ViewChild(AddinventoryComponent) addInventoryComp!: AddinventoryComponent;
    public itemOptionslist: any[] = [];
    childUomDialog: boolean = false;
    backshow: boolean = false;
    childUOMList: any[] = [];

    // ✅ Move dropdown options into variables
    transactionIdOptions = [];

    invoiceNoOptions = [];

    vendorNameOptions: DrowdownDetails[] = [];

    categoryOptions = [];

    itemOptions = [];

    products: StockIn[] = [];
    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService,
        public datePipe: DatePipe,
        private messageService: MessageService,
        private sharedService: ShareService,
        private route:Router
    ) {}

    ngOnInit(): void {
        this.OnGetDropdown();
        this.loadAllDropdowns();
        this.onGetStockIn();
        this.productForm = this.fb.group({
            p_tranpurchaseid: [null],
            p_invoiceno: ['', [Validators.maxLength(50),Validators.required]],
            p_vendorid: [null,Validators.required],
            p_invoicedate: [null,Validators.required],
            p_remarks: ['', [Validators.maxLength(500)]],
            grandTotal: [0],
            p_amountpaid :[''],
        },{validators:[this.paidAmountLessThanGrandTotal()]});

        const navigation = history.state;
        console.log('Navigation state:', navigation);
        if (navigation && navigation.stockData && navigation.itemsData) {
            this.backshow = true;
            this.mode = navigation.mode || 'edit';
            this.populateStockForm(navigation.stockData, navigation.itemsData);
        }

        if(this.mode==='edit'){
            this.productForm.get('p_amountpaid')?.disable();
        }
        this.setupBackButtonListener();
    }
    
     paidAmountLessThanGrandTotal(): ValidatorFn {
        return (form: AbstractControl): ValidationErrors | null => {
            const grandtotal = Number(form.get('grandTotal')?.value || 0);
            const p_amountpaid = Number(form.get('p_amountpaid')?.value || 0);

            if (grandtotal < p_amountpaid) {
                return {
                    amountNotGreater: true
                };
            }
            return null;
        };
    }
    onGetStockIn() {
        this.products = this.stockInService.productItem;
        console.log('item', this.products);
        this.products.forEach((p) => (p.selection = true));
    }
    filterVendors(event: any) {
        const query = event.query.toLowerCase();
        this.filteredVendors = this.vendorNameOptions.filter((v) => v.fieldname.toLowerCase().includes(query));
        if (!this.filteredVendors.some((v) => v.label.toLowerCase() === query)) {
            this.filteredVendors.push({ label: event.query });
        }
    }
    filterInvoiceNo(event: any) {
        const query = event.query.toLowerCase();
        // this.filteredInvoiceNo=this.invoiceNoOptions.filter(v=>v.label.toLowerCase().includes(query));//commented beacause of error
        if (!this.filteredInvoiceNo.some((v) => v.label.toLowerCase() === query)) {
            this.filteredInvoiceNo.push({ label: event.query });
        }
    }
    setupBackButtonListener() {
        window.addEventListener('beforeunload', () => {
            this.sharedService.clearTransactionState();
        });
    }

    ngOnDestory() {
        window.removeEventListener('beforeunload', () => {});
    }
    populateStockForm(data: any, itemsData: any[]) {
        console.log('data date:', data);
        this.productForm.patchValue({
            p_tranpurchaseid: data.purchaseid || 0,
            p_invoiceno: data.invoicenumber || '',
            p_invoicedate: data.invoicedate ? new Date(data.invoicedate) : new Date(),
            p_remarks: data.remark || '',
            p_vendorid: data.vendorid || null,
           p_amountpaid:data.total_paid,
           grandTotal:data.total_cost
        });
        if (itemsData && itemsData.length > 0) {
            console.log('Processing itemsData:', itemsData);

            const transformedItems = itemsData.map((item: any) => {
                console.log('Mapping item:', item);
                return {
                    p_tranpurchaseid: item.transactiondetailid || 0,
                    itemid: item.itemid || 0,
                    itemsku: item.itemsku || '',
                    itembarcode: item.itembarcode || 0,
                    itemname: item.itemname || '',
                    location: item.location || '',
                    minimumstock: item.minimumstock || 0,
                    categoryid: item.categoryid || 0,
                    warrentyperiod: item.warrentyperiod || 0,
                    uomid: item.uomid || 0,
                    uomname: item.uomname || item.uom || '',
                    childuom: item.hasChildUOM ? 'Y' : 'N',
                    currentstock: item.currentstock || 0,
                    quantity: item.quantity || 1,
                    costprice: item.itemcost || item.costprice || 0,
                    saleprice: item.mrp || item.saleprice || 0,
                    gstitem: item.gstItem === 'Y' ? 'Y' : 'N',
                    categoryname: item.categoryname || item.category || '',
                    expirydate: item.expirydate || null,
                    isactive: 'Y',
                    discount: item.discount || 0
                };
            });
            this.itemOptionslist = transformedItems;
        }
    }
    onSave(updatedData: any) {
        console.log('before:', updatedData);
        if (!updatedData) return;
        const hasChildUOM = updatedData.childUOMDetails?.some((u: any) => u.childUOM || u.conversion || u.mrp);
        const costPerItem = updatedData.qty && updatedData.purchasePrice ? (updatedData.purchasePrice / updatedData.qty).toFixed(2) : 0;

        const mappedData = {
            selection: true,
            code: updatedData.itemCode.label || updatedData.itemCode,
            name: updatedData.itemName,
            category: updatedData.category,
            curStock: updatedData.curStock,
            purchasePrice: updatedData.purchasePrice,
            costPerItem: costPerItem,
            quantity: updatedData.qty,
            total: updatedData.purchasePrice * updatedData.qty,
            uom: updatedData.parentUOM,
            childUOM: hasChildUOM ? 'Yes' : 'No',
            mrp: updatedData.mrp,
            discount: updatedData.discount,
            minStock: updatedData.minStock,
            warPeriod: updatedData.warPeriod,
            p_expirydate: new Date(updatedData.expirydate),
            location: updatedData.location,
            gstItem: updatedData.gstItem === true ? 'Yes' : 'No',
            activeItem: updatedData.activeItem === true ? 'Yes' : 'No'
        };
        if (this.mode === 'edit' && this.selectedRow) {
            const index = this.products.findIndex((p) => p.code === this.selectedRow.code);
            if (index !== -1) {
                this.products[index] = { ...this.products[index], ...mappedData };
                console.log('after', updatedData);
            }
        } else {
            this.products.push(mappedData);
        }
        this.closeDialog(updatedData);
        this.OnGetItem();
    }
    back() {
      this.route.navigate(['/layout/inventory/transaction']);
    }
    deleteItem(product: any) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete <b>${product.itemname}</b>?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.OnDeleteItem(product.purchasedetailid);
            },
            reject: () => {
                // Optional: Add toast or log cancel
                console.log('Deletion cancelled');
            }
        });
    }
    onChildUom(status: boolean): boolean {
        this.childUomStatus = status;
        return this.childUomStatus;
    }
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.updatePagedProducts();
    }

    updatePagedProducts() {
        this.pagedProducts = this.products.slice(this.first, this.first + this.rowsPerPage);
    }

    get grandTotal(): number {
        if (!this.itemOptionslist || this.itemOptionslist.length === 0) return 0;
        return this.itemOptionslist.reduce((sum, item: any) => {
            const quantity = item.quantity || 0;
            const costPrice = item.costprice || 0;
            return sum + quantity * costPrice;
        }, 0);
    }
    onSubmit() {
        this.confirmationService.confirm({
            message: 'Do you want to save the header information',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                let message = 'Header Information Saved Successfully';
                this.showSuccess(message);
                this.addItemEnabled = true;
                this.OnPurchesHeaderCreate(this.productForm.value);
            }
        });
    }
    openAddDialog() {
        this.mode = 'add';
        this.selectedRow = null;
        this.visibleDialog = true;

        setTimeout(() => this.addInventoryComp.resetForm(), 10);
        this.OnGetItem();
    }
    openEditDialog(rowData: any) {
        this.mode = 'edit';
        this.selectedRow = rowData || null;
        this.visibleDialog = true;
    }
    closeDialog(event: any) {
        console.log(event);
        this.visibleDialog = false;

        this.OnGetPurcheseItem(this.transationid);
    }
    reset() {
        this.productForm.reset({
            transId: '',
            invoiceNo: '',
            vendorName: '',
            invoiceDate: '',
            remark: '',
            paidAmount:''
        });
        this.backshow=false;
        this.productForm.get('p_amountpaid')?.enable();
        // this.transationid='null';
        this.products = [];
        this.itemOptionslist = [];
        this.first = 0;
        this.pagedProducts = [];
        this.childUomStatus = false;
        this.addItemEnabled = false;
        if (this.addInventoryComp) {
            this.addInventoryComp.resetForm();
        }
    }

    //GetdropdwonDetails Function
    // itemOptions: any[] = [];          // For ITEM dropdown
    // categoryOptions: any[] = [];      // For CATEGORY dropdown
    uomOptions: any[] = []; // For UOM dropdown
    vendorOptions: any[] = []; // For VENDOR dropdown
    purchaseIdOptions: any[] = []; // For PURCHASE ID dropdown
    dateTime = new Date();

    OnGetDropdown() {
        let payload = {
            p_username: 'admin',
            p_returntype: 'ITEM'
        };

        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                console.log(res);
                this.vendorNameOptions = res.data;
            },
            error: (error) => {
                console.log(error);
            }
        });
    }

    OnPurchesHeaderCreate(data: any) {
        const payload: any = {
            p_operationtype: 'PUR_INSERT',
            p_purchaseid: data.p_tranpurchaseid == null ? '' : this.valueReturnToString(data.p_tranpurchaseid),
            p_vendorid: data.p_vendorid == null ? this.valueReturnToString(0) : this.valueReturnToString(data.p_vendorid),
            p_invoiceno: data.p_invoiceno,
            p_invoicedate: this.datePipe.transform(data.p_invoicedate, 'dd/MM/yyyy'),
            p_remarks: data.p_remarks,
            p_amountpaid :data.p_amountpaid ,
            p_active: 'Y'
        };

        this.stockInService.OnPurchesHeaderCreate(payload).subscribe({
            next: (res) => {
                console.log(res);
                this.transationid = res.data[0].tranpurchaseid;
                this.transactionIdOptions = res.data;

                const id = Number(res.data[0].tranpurchaseid);

                // check if ID already exists in array
                const exists = this.purchaseIdOptions.some((item) => item.purchaseid === id);

                if (!exists) {
                    // create item
                    const newItem = {
                        invoicedate: null,
                        invoicenumber: '',
                        purchaseid: id,
                        remark: '',
                        vendorid: 0,
                        paidAmount:0
                    };

                    // push only if not exists
                    this.purchaseIdOptions.push(newItem);
                }
                this.productForm.patchValue({
                    p_tranpurchaseid: id
                });
                // patch form always

                this.loadAllDropdowns();
            },
            error: (error) => {
                console.log(error);
            }
        });
    }
    createDropdownPayload(returnType: string) {
        return {
            p_username: 'admin',
            p_returntype: returnType
        };
    }
    purchaseIdDetails(event: any) {
        this.transationid = event.value;
        const selectedPurchaseData = this.purchaseIdOptions.find((item) => item.purchaseid == event.value);
        console.log(selectedPurchaseData);
        this.productForm.patchValue({
            p_vendorid: selectedPurchaseData.vendorid,
            p_invoiceno: selectedPurchaseData.invoicenumber,
            p_remarks: selectedPurchaseData.remark,
            p_invoicedate: selectedPurchaseData.invoicedate ? new Date(selectedPurchaseData.invoicedate) : null,
            grandTotal: this.grandTotal,
             p_amountpaid:selectedPurchaseData.total_paid,
        });
        if (this.productForm.value) {
            this.addItemEnabled = true;
            this.transationid = event.value;
        }

        this.OnGetPurcheseItem(event.value);
        this.transationid = event.value;
        const selectedPurchaseData1 = this.purchaseIdOptions.find((item) => item.purchaseid == event.value);
        console.log(selectedPurchaseData1);
        this.productForm.patchValue({
            p_vendorid: selectedPurchaseData1.vendorid,
            p_invoiceno: selectedPurchaseData1.invoicenumber,
            p_remarks: selectedPurchaseData1.remark,
            p_invoicedate: selectedPurchaseData1.invoicedate ? new Date(selectedPurchaseData1.invoicedate) : null,
            grandTotal: this.grandTotal,
            p_amountpaid:selectedPurchaseData1.total_paid,
        });
        if (this.productForm.value) {
            this.addItemEnabled = true;
            this.transationid = event.value;
        }

        this.OnGetPurcheseItem(event.value);
    }

    valueReturnToString(value: any) {
        return value != null ? value.toString() : null;
    }

    OnGetItem() {
        const payload = this.createDropdownPayload('ITEM');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    loadAllDropdowns() {
        this.OnGetItem();
        this.OnGetCategory();
        this.OnGetUOM();
        this.OnGetVendor();
        this.OnGetPurchaseId();
    }

    OnGetCategory() {
        const payload = this.createDropdownPayload('CATEGORY');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.categoryOptions = res.data),
            error: (err) => console.log(err)
        });
    }

    OnGetUOM() {
        const payload = this.createDropdownPayload('UOM');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.uomOptions = res.data),
            error: (err) => console.log(err)
        });
    }

    OnGetVendor() {
        const payload = this.createDropdownPayload('VENDOR');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.vendorOptions = res.data),
            error: (err) => console.log(err)
        });
    }

    OnGetPurchaseId() {
        const payload = this.createDropdownPayload('PURCHASEID');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.purchaseIdOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    OnGetPurcheseItem(id: any) {
        const payload = {
            p_username: 'admin',
            p_returntype: 'PURCHASEDETAIL',
            p_returnvalue: id.toString()
        };

        this.stockInService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.itemOptionslist = res.data;
                console.log('result:', res.data);
                this.productForm.patchValue({
                    grandTotal: this.grandTotal
                });
            },
            error: (err) => console.log(err)
        });
    }
    //Delete stock item
    OnDeleteItem(id: any) {
        const payload = {
            p_username: 'admin',
            p_returntype: 'PURCHASEDETAIL',
            p_purchasedetailid: id

            //"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyY29kZSI6ImFkbWluIiwiaWF0IjoxNzYzMDI3NzU5LCJleHAiOjE3NjMxMTQxNTl9.w9YSCAVi4G5bou6vlR2tjFb2oU4jUAJ1uHSLUTfbxKc"
        };
        this.stockInService.DeletStockinitem(payload).subscribe({
            next: (res) => {
                this.showSuccess(res.data[0].msg);
                this.OnGetPurcheseItem(this.transationid);
                this.OnGetItem();
            }
        });
    }
    // onchildUOM(id:any){
    //     const payload = {
    //
    //     "p_username": "admin",
    //     "p_returntype": "CHILDUOM",
    //      "p_returnvalue":id.toString(),
    //
    //

    // };
    //   this.stockInService.Getreturndropdowndetails(payload).subscribe({
    //     next:(res)=>{
    //       this.showSuccess(res.data[0].msg)
    //       this.OnGetPurcheseItem(this.transationid)

    //     }
    //   })
    // }
    viewItem(id: number) {
        console.log(id);

        const payload = {
            p_username: 'admin',
            p_returntype: 'CHILDUOM',
            p_returnvalue: id.toString()
        };

        this.stockInService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                if (!res.data || res.data.length === 0) {
                    //  this.showError("No Child UOM Data Available");
                    return;
                }

                this.childUOMList = res.data; // assign data
                this.childUomDialog = true; // open popup
            },
            error: (err) => {
                // this.showError("Failed to load Child UOM Details");
                console.error(err);
            }
        });
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
}
