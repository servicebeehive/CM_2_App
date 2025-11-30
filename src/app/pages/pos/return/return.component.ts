import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ViewChild, viewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
        AddinventoryComponent
        // GlobalFilterComponent
    ],
    templateUrl: './return.component.html',
    styleUrl: './return.component.scss',
    providers: [ConfirmationService, DatePipe]
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
    filteredProducts: any[] = [];
    filteredCustomerName: any[] = [];
    itemOptions: any[] = [];
    filteredMobile: any[] = [];
    selectedProducts: any[] = [];
    globalFilter: string = '';
    childUomStatus: boolean = false;
    showGlobalSearch: boolean = true;
    today: Date = new Date();
    discountplace: string = 'Enter Amount';
    //for testing
    @ViewChild(AddinventoryComponent) addInventoryComp!: AddinventoryComponent;
    // ✅ Move dropdown options into variables
    returnBillNoOptions: any[] = [];

    // ✅ Move dropdown options into variables
    billNoOptions: any[] = [];
    public authService = inject(AuthService);
    public getUserDetails = {
        uname: 'admin',
        p_loginuser: 'admin',
        clientcode: 'CG01-SE',
        'x-access-token': this.authService.getToken()
    };
    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService,
        private returnService: InventoryService,
        private messageService: MessageService,
        public datepipe: DatePipe
    ) {}

    ngOnInit(): void {
        this.loadAllDropdowns();
        // this.onGetStockIn();
        this.returnForm = this.fb.group({
            returnBillNo: ['', Validators.required],
            p_itemdata: [null],
            p_transactiontype: [''],
            p_itemid: [null],
            p_billno: [null],
            p_transactionid: [0],
            p_transactiondate: [this.today, [Validators.required]],
            p_customername: [''],
            p_mobileno: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
            p_totalcost: [0],
            p_totalsale: [0],
            p_disctype: [false],
            p_overalldiscount: [''],
            p_roundoff: [''],
            p_totalpayable: [0],
            p_currencyid: [0],
            p_gsttran: [true],
            p_status: [''],
            p_isactive: [''],
            p_loginuser: [''],
            p_linktransactionid: [0],
            p_replacesimilir: [''],
            p_creditnoteno: [''],
            p_paymentmode: [''],
            p_paymentdue: [0],
            p_sale: this.fb.array([])
        });
        this.returnForm.get('discountLabel')?.valueChanges.subscribe(() => {
            this.updatedFinalAmount();
        });
        this.returnForm.get('p_disctype')?.valueChanges.subscribe((value) => {
            if (!value) {
                this.discountplace = 'Enter Amount';
            } else {
                this.discountplace = 'Enter %';
            }
            // this.returnForm.get('p_overalldiscount')?.setValue('', { emitEvent: false });
            this.applyDiscount();
        });
    }

    blockDecimal(event: KeyboardEvent) {
        if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E'|| event.key === '0' || event.key === '-') {
            event.preventDefault(); // block decimal
        }
    }

    get saleArray(): FormArray {
        return this.returnForm.get('p_sale') as FormArray;
    }
    get saleRows(): FormGroup[] {
        return this.saleArray.controls as FormGroup[];
    }
    mapSaleItems(apiItems: any[]) {
        this.saleArray.clear(); // Remove old rows if any

        apiItems.forEach((item, i) => {
            this.saleArray.push(
                this.fb.group({
                    TransactiondetailId: item.transactiondetailid || 0,
                    ItemId: item.itemsku || 0, // use itemsku when itemid not present
                    ItemName: item.itemname || '',
                    UOMId: item.uomid || 0,
                    Quantity: item.quantity || 1,
                    itemcost: item.itemcost || 0,
                    MRP: (item.mrp || 0).toFixed(2),
                    totalPayable: ((item.quantity || 1) * (item.mrp || 0)).toFixed(2),
                    // p_totalcost:item.
                    // Additional fields used in UI
                    curStock: item.current_stock || 0,
                    warPeriod: 0,
                    location: '',
                    itemsku: item.itemsku || ''
                })
            );
            this.updateTotal(i);
        });
        this.calculateSummary();
        // If items were added, update totals for the last row and overall summary
        const index = this.saleArray.length - 1;
        this.updateTotal(index);
        this.calculateSummary();
    }
    SaleDetails(data: any) {
        const apibody = {
            ...this.getUserDetails,
            p_returntype: 'SALEDETAIL',
            p_returnvalue: data.transactionid
        };

        this.stockInService.Getreturndropdowndetails(apibody).subscribe({
            next: (res) => {
                this.mapSaleItems(res.data);
             if(res.data && res.data.length>0 && res.data[0].discounttype){
          this.returnForm.patchValue({
            p_disctype:(res.data[0].discounttype==='Y')
          });
             }
            }
        });
    }
    onBillDetails(event: any) {
        console.log(event.value);
        const billDetails = this.billNoOptions.find((billitem) => billitem.billno === event.value);
        console.log('bill', billDetails);
        if (billDetails) {
            this.SaleDetails(billDetails);

            this.returnForm.patchValue({
                p_transactionid: billDetails.transactionid,
                p_customername: billDetails.customername,
                p_transactiondate: billDetails.transactiondate ? new Date(billDetails.transactiondate) : null,
                p_mobileno: billDetails.mobileno,
                p_totalcost: billDetails.totalcost,
                p_totalsale: billDetails.totalsale,
                 p_disctype: billDetails.discounttype=='Y'?true:false,
                p_overalldiscount: billDetails.discount,
                p_roundoff: billDetails.roundoff,
                p_totalpayable:(billDetails.totalpayable).toFixed(2),
            });
        }
    }

    onReturnBillDetails(event: any) {
        const returnBillDetails = this.returnBillNoOptions.find((returnbillitem) => returnbillitem.billno === event.value);
        if (returnBillDetails) {
            this.SaleDetails(returnBillDetails);
            this.returnForm.patchValue({
                p_transactionid: returnBillDetails.transactionid,
                p_customername: returnBillDetails.customername,
                p_transactiondate: returnBillDetails.transactiondate ? new Date(returnBillDetails.transactiondate) : null,
                p_mobileno: returnBillDetails.mobileno,
                p_totalcost: returnBillDetails.totalcost.toFixed(2),
                p_totalsale: returnBillDetails.totalsale.toFixed(2),
                p_disctype: returnBillDetails.discounttype=='Y'?true:false,
                p_overalldiscount: returnBillDetails.discount,
                p_roundoff: returnBillDetails.roundoff,
                p_totalpayable: returnBillDetails.totalpayable.toFixed(2)
            });
        }
    }
    cleanRequestBody(body: any) {
        const formattedDate = this.datepipe.transform(body.p_transactiondate, 'dd/MM/yyyy');
        return {
            ...this.getUserDetails,
            p_transactiontype: 'RETURN',
            p_transactionid: 0,
            p_transactiondate: formattedDate || '',
            p_customername: body.p_customername || '',
            p_mobileno: body.p_mobileno || '',
            p_totalcost: Number(body.p_totalcost) || 0,
            p_totalsale: Number(body.p_totalsale) || 0,
            p_overalldiscount: Number(body.p_overalldiscount) || 0,
            p_roundoff: body.p_roundoff ? body.p_roundoff.toString() : '0.00',
            p_totalpayable: Number(body.p_totalpayable) || 0,
            p_currencyid: Number(body.p_currencyid) || 0,
            p_gsttran: body.p_gsttran === true ? 'Y' : body.p_gsttran === false ? 'N' : 'N',
            p_status: body.p_status || 'Complete',
            p_isactive: 'Y',
            p_linktransactionid: body.p_transactionid ?? 0,
            // p_replacesimilir: body.p_replacesimilir || "",
            p_replacesimilir: body.p_disctype === true ? 'Y' : 'N',
            p_creditnoteno: body.p_creditnoteno || '',
            p_paymentmode: body.p_paymentmode || 'Cash',
            p_paymentdue: Number(body.p_paymentdue) || 0,
            p_sale: (body.p_sale || []).map((x: any) => ({
                TransactiondetailId: 0,
                ItemId: x.ItemId,
                ItemName: x.ItemName,
                UOMId: x.UOMId,
                Quantity: x.Quantity,
                itemcost: x.itemcost,
                MRP: x.MRP,
                totalPayable: x.totalPayable
            }))
        };
    }
    OnSalesHeaderCreate(data: any) {
        const apibody = this.cleanRequestBody(this.returnForm.value);

        this.stockInService.OninsertSalesDetails(apibody).subscribe({
            next: (res) => {
                console.log(res.data);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Return saved successfully!',
                    life: 3000
                });
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save sales. Please try again.',
                    life: 3000
                });
            }
        });
    }

    applyGlobalFilter() {
        const searchTerm = this.globalFilter?.toLowerCase() || '';
        this.filteredProducts = this.products.filter((p) => {
            return Object.values(p).some((value) => String(value).toLowerCase().includes(searchTerm));
        });
    }
    updateTotal(index: number) {
        const row = this.saleArray.at(index) as FormGroup;

        const qty = Number(row.get('Quantity')?.value || 0);
        const stock = Number(row.get('curStock')?.value || 0);
        const mrp = Number(row.get('MRP')?.value || 0);
        const total = +(mrp * qty).toFixed(2);
        if (qty > stock + 1) {
            row.get('Quantity')?.setErrors({ maxStock: true });
            return;
        } else {
            // Clear error if valid
            row.get('Quantity')?.setErrors(null);
        }

        row.patchValue({ totalPayable: total });
        this.calculateSummary();
        this.updateSelectedTotal();
    }
    calculateTotals() {
        const totalMrp = this.filteredProducts.reduce((sum, p) => sum + (p.mrp || 0) * (p.Quantity || 0), 0);
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
    updateSelectedTotal() {
        const totalMrp = this.selectedProducts.reduce((sum, item) => {
            const qty = Number(item.Quantity) || 0;
            const mrp = Number(item.mrp) || 0;
            return sum + (qty * mrp);
        }, 0);
        this.returnForm.patchValue(
            {
                mrpTotal: totalMrp.toFixed(2)
            },
            { emitEvent: false }
        );
        this.updatedFinalAmount();
    }
    onSelectionChange() {
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
    applyDiscount() {
        const totalSale = Number(this.returnForm.get('p_totalsale')?.value || 0);
        const discountValue = Number(this.returnForm.get('p_overalldiscount')?.value || 0);
        const isPresent = this.returnForm.get('p_disctype')?.value;
        let discountAmount = 0;

        if (isPresent) {
            discountAmount = (totalSale * discountValue) / 100;
        } else {
            discountAmount = discountValue;
        }
        let finalPayable = totalSale - discountAmount;

        // Round off to 2 decimals difference and then round to integer for payable
        const roundOff = +(finalPayable - Math.floor(finalPayable)).toFixed(2);

        this.returnForm.patchValue({
            p_roundoff: roundOff,
            p_totalpayable: Math.round(finalPayable)
        });
    }
    calculateSummary() {
        let totalCost = 0;
        let totalMRP = 0;
        let totalSale = 0;

        this.saleArray.controls.forEach((row: AbstractControl) => {
            const qty = Number(row.get('Quantity')?.value || 0);
            const cost = Number(row.get('itemcost')?.value || 0);
            const mrp = Number(row.get('MRP')?.value || 0);

            totalCost += qty * cost;
            totalMRP += qty * mrp;
            totalSale += qty * mrp;
        });

        // Assign summary values
        this.returnForm.patchValue({
          p_totalcost: (totalCost).toFixed(2),
          p_totalsale: (totalMRP).toFixed(2),
          p_roundoff: 0,
          p_totalpayable: (totalMRP).toFixed(2)
        });

        // Apply discount/rounding adjustments
        this.applyDiscount();
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
            Quantity: updatedData.qty,
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

    onSubmit() {
        //    if (this.isSubmitDisabled()) {
        //   this.messageService.add({
        //     severity: 'error',
        //     summary: 'Validation Failed',
        //     detail: 'Please correct all errors before submitting.',
        //     life: 2500
        //   });
        //   return;
        // }

        this.confirmationService.confirm({
            message: 'Are you sure you want to make changes?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            accept: () => {
                this.OnSalesHeaderCreate(this.returnForm.value);
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
    createDropdownPayload(returnType: string) {
        return {
            p_returntype: returnType,
            ...this.getUserDetails
        };
    }
    OnGetBillNo() {
        const payload = this.createDropdownPayload('SALERETURN');
        this.returnService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                const billdata: any = res.data;
                this.billNoOptions = billdata.filter((item: { billno: null }) => item.billno != null);
            },
            error: (err) => console.log(err)
        });
    }
    OnGetReturnBillNo() {
        const payload = this.createDropdownPayload('RETURN');
        this.returnService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                const billdata: any = res.data;
                this.returnBillNoOptions = billdata.filter((item: { billno: null }) => item.billno != null);
            },
            error: (err) => console.log(err)
        });
    }

    loadAllDropdowns() {
        this.OnGetBillNo();
        this.OnGetReturnBillNo();
    }
}
