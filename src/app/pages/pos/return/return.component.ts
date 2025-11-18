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
        AddinventoryComponent,
        // GlobalFilterComponent
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
    filteredProducts: any [] = [];
    filteredCustomerName: any[] = [];
    itemOptions: any[]=[];
  filteredMobile: any[] = [];
    selectedProducts:any[]=[];
    globalFilter: string = '';
    childUomStatus: boolean = false;
    showGlobalSearch:boolean=true;
    //for testing
      @ViewChild(AddinventoryComponent) addInventoryComp!: AddinventoryComponent;
 // ✅ Move dropdown options into variables
    returnBillNoOptions:any[] = [];

    // ✅ Move dropdown options into variables
    billNoOptions: any[] = [];
public authService = inject(AuthService);
  public getUserDetails = {
    "uname": "admin",
    "p_username": "admin",
    "clientcode": "CG01-SE",
    "x-access-token": this.authService.getToken(),
  };
    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService,
        private returnService: InventoryService,
        private messageService:MessageService,
        // public datepipe: DatePipe
    ) {}

    ngOnInit(): void {
        this.loadAllDropdowns();
        this.onGetStockIn();
        this.returnForm = this.fb.group({
            returnBillNo: ['', Validators.required],
            p_billno: ['', Validators.required],
            p_customername: [''],
            p_mobileno: ['', [Validators.pattern(/^[0-9]{10}$/)]],
            transactionid: ['', Validators.required],
            totalcost: [''],
            totalsale: [''],
            roundoff: [''],
            discount: [''],
            totalpayable: [''],
            p_sale: this.fb.array([]),

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
    
     get saleArray(): FormArray {
    return this.returnForm.get('p_sale') as FormArray;
  }
     mapSaleItems(apiItems: any[]) {
    this.saleArray.clear(); // Remove old rows if any

    apiItems.forEach((item,i) => {
      this.saleArray.push(
        this.fb.group({
          TransactiondetailId: item.transactiondetailid || 0,
          ItemId: item.itemsku || 0,    // use itemsku when itemid not present
          ItemName: item.itemname || '',
          UOMId: item.uomid || 0,
          Quantity: item.Quantity || 1,
          itemcost: item.itemcost || 0,
          MRP: item.mrp || 0,
          totalPayable: (item.Quantity || 1) * (item.mrp || 0),
          // p_totalcost:item.
          // Additional fields used in UI
          curStock: item.current_stock || 0,
          warPeriod: 0,
          location: "",
          itemsku: item.itemsku || ''
        })
      );
      this.updateTotal(i);
    });
   this.calculateSummary();
    // If items were added, update totals for the last row and overall summary
    const index = this.saleArray.length - 1;
    this.updateTotal(index);
    // this.calculateSummary();
  }
    SaleDetails(data: any) {
    const apibody = {
      ...this.getUserDetails,
      "p_returntype": "SALEDETAIL",
      "p_returnvalue": data.transactionid,
    };

    this.stockInService.Getreturndropdowndetails(apibody).subscribe({
      next: (res) => {
        this.mapSaleItems(res.data);
      }
    });
  }
 onBillDetails(event: any) {
    console.log(event.value);
    const billDetails = this.billNoOptions.find(billitem => billitem.billno === event.value);
    console.log('bill',billDetails);
    if (billDetails) {
      this.SaleDetails(billDetails);

      this.returnForm.patchValue({
        p_transactionid: billDetails.transactionid,
        p_customername:billDetails.customername,
        p_transactiondate: billDetails.transactiondate ? new Date(billDetails.transactiondate) : null,
        p_mobileno: billDetails.mobileno,
        p_totalcost: billDetails.totalcost,
        p_totalsale: billDetails.totalsale,
        p_overalldiscount: billDetails.discount,
        p_roundoff: billDetails.roundoff,
        p_totalpayable: billDetails.totalpayable
      });
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
       this.filteredProducts = this.itemOptions.map(item => this.fb.group({
    itemsku: [item.itemsku],
    ItemName: [item.ItemName],
    curStock: [item.curStock],
    UOMId: [item.UOMId],
    Quantity: [0],
    MRP: [item.MRP],
    totalPayable: [0],
    warPeriod: [item.warPeriod],
    location: [item.location]
}));
       
    }

    applyGlobalFilter() {
        const searchTerm = this.globalFilter?.toLowerCase() || '';
        this.filteredProducts = this.products.filter((p) => {
            return Object.values(p).some((value) => String(value).toLowerCase().includes(searchTerm));
        });
    }
    updateTotal(index:number) {
        const row=this.saleArray.at(index) as FormGroup;

        const qty = Number(row.get('Quantity')?.value ||0);
        const mrp = Number(row.get('MRP')?.value || 0);
        const total = +(mrp * qty).toFixed(2);
        row.patchValue({totalPayable: total});
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
    updateSelectedTotal(){
        const totalMrp=this.selectedProducts.reduce((sum, item)=>{
          const qty=Number(item.Quantity) || 0;
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
     applyDiscount() {
    const discountPercent = Number(this.returnForm.get('p_overalldiscount')?.value || 0);
    const totalMRP = Number(this.returnForm.get('p_totalsale')?.value || 0);

    const discountAmount = (totalMRP * discountPercent) / 100;
    let finalPayable = totalMRP - discountAmount;

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
      p_totalcost: totalCost,
      p_totalsale: totalMRP,
      p_roundoff: 0,
      p_totalpayable: totalMRP
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
createDropdownPayload(returnType: string) {
    return {
      p_returntype: returnType,
      ...this.getUserDetails,
    };
  }
    OnGetBillNo() {
    const payload = this.createDropdownPayload("NEWTRANSACTIONID");
    this.returnService.getdropdowndetails(payload).subscribe({
      next: (res) => {
        const billdata: any = res.data;
        this.billNoOptions = billdata.filter((item: { billno: null; }) => item.billno != null);
      },
      error: (err) => console.log(err)
    });
  }
   OnGetReturnBillNo() {
    const payload = this.createDropdownPayload("RETURNTRANSACTIONID");
    this.returnService.getdropdowndetails(payload).subscribe({
      next: (res) => {
        const billdata: any = res.data;
        this.returnBillNoOptions = billdata.filter((item: { billno: null; }) => item.billno != null);
      },
      error: (err) => console.log(err)
    });
  }

    loadAllDropdowns() {
    this.OnGetBillNo();
    this.OnGetReturnBillNo();
  }

}
