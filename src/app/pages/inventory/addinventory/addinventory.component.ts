import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
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
import { AutoCompleteModule } from 'primeng/autocomplete';
import productRouters from '@/pages/products/product.routers';
import { CheckboxModule } from 'primeng/checkbox';
import { InventoryService } from '@/core/services/inventory.service';
import { StockHeader } from '@/core/models/inventory.model';
import { AuthService } from '@/core/services/auth.service';
import { ShareService } from '@/core/services/shared.service';
import { DatePickerModule } from 'primeng/datepicker';
import { NotificationService } from '@/core/services/notification.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
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
    selector: 'app-addinventory',
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
        DatePickerModule,
        DropdownModule,
        ToggleSwitchModule,
        RippleModule,
        ChipModule,
        FluidModule,
        MessageModule,
        AutoCompleteModule,
        CheckboxModule,
        ToastModule
    ],
    templateUrl: './addinventory.component.html',
    styleUrl: './addinventory.component.scss',
    providers: [DatePipe]
})
export class AddinventoryComponent {
    @Input() transationid: any = null;
    @Output() close = new EventEmitter<void>();
    @Input() editData: any;
    @Input() mode: 'add' | 'edit'|'itemedit' = 'add';
    @Output() save = new EventEmitter<any>();
    @Output() childUom = new EventEmitter<boolean>();

    @Input() itemOptions: any[] = [];
    @Input() categoryOptions: any[] = [];
    @Input() uomOptions: any[] = [];
    @Input() vendorOptions: any[] = [];
    @Input() purchaseIdOptions: any[] = [];
    public ChilduomOptions:[]=[]
    public authService = inject(AuthService);
    copyMessage:string='';
    showCopyMessage: boolean=false;
    addForm!: FormGroup;
    filteredItemCode: any[] = [];
    dateTime=new Date()
    // ✅ Move dropdown options into variables
    itemCodeOptions = [];
    parentUOMOptions = [];
    uom = [];
    itemCodeExists:boolean=false;
    barcodeExists:boolean=false;
    uomTableDisabled=false;
    resetDisabled=false;
    products: any[] = [
        // { childUOM:'', conversion:'', mrpUom:'' }
    ];

    selectItemType=[
      {label:'Select Existing Item' , value:1},
        {label:'Add New Item' , value:2}
    ];
     
    filteredUOM: any[] = [];
    searchValue:string='';
    constructor(
        private fb: FormBuilder,
        public inventoryService: InventoryService,
        public shareservice: ShareService,
        public datePipe: DatePipe,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.addForm = this.fb.group(
            {   itembarcode: ['', [Validators.maxLength(50)]],
                itemCode: ['', [Validators.required, Validators.maxLength(50)]],
                category: ['', Validators.required],
                parentUOM: ['', Validators.required],
                itemName: ['', [Validators.required, Validators.maxLength(500)]],
                curStock: [''],
                purchasePrice: ['', [Validators.required, Validators.min(1)]],
                minStock: ['',Validators.maxLength(3)],
                warPeriod: ['',Validators.maxLength(2)],
                p_expirydate: [null],
                costPerItem: [''],
                mrp: ['', [Validators.required, Validators.min(1)]],
                location: ['', Validators.maxLength(100)],
                qty: ['', [Validators.required,Validators.min(1)]],
                discount: [''],
                activeItem: [true],
                gstItem: [true],
                itemSearch:['']
            },
            { validators: this.mrpValidator }
        );
        this.addForm.get('purchasePrice')?.valueChanges.subscribe(() => this.updateCostPerItem());
        this.addForm.get('qty')?.valueChanges.subscribe(() => this.updateCostPerItem());
        this.resetChildUOMTable();
    }

    resetChildUOMTable() {
        this.products = [];
    }
    allowOnlyNumbers(event: KeyboardEvent) {
        const allowedChars = /[0-9]\b/;
        const inputChar = String.fromCharCode(event.key.charCodeAt(0));
        if (!allowedChars.test(inputChar)) {
            event.preventDefault();
        }
    }

    mrpValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        const costperitem = parseFloat(group.get('costPerItem')?.value);
        const mrp = parseFloat(group.get('mrp')?.value);
        if (isNaN(costperitem) || isNaN(mrp)) {
            return null;
        }
        if (mrp < costperitem) {
            return { mrpGreaterThanPurchase: true };
        }
        return null;
    };
blockMinus(event: KeyboardEvent) {
  if (event.key === '-' || event.key === 'Minus'|| event.key==='e' || event.key === 'e') {
    event.preventDefault();
  }
}

toUppercase(event:Event){
    const input = event.target as HTMLInputElement;
    input.value=input.value.toUpperCase();
}

    updateCostPerItem(): void {
        const purchasePrice = parseFloat(this.addForm.get('purchasePrice')?.value);
        const qty = parseFloat(this.addForm.get('qty')?.value);

        if (!isNaN(purchasePrice) && !isNaN(qty) && qty > 0) {
            const cost = purchasePrice / qty;
           this.addForm.get('costPerItem')?.setValue(cost.toFixed(2), { emitEvent: false });
        } else {
          this.addForm.get('costPerItem')?.setValue(this.addForm.get('costPerItem')?.value, { emitEvent: false });
        }
    }
   
   onItemSearch(event:any){
    this.searchValue=event.filter || '';
   }

//    addNewItem(select:any){
//     const code = this.searchValue?.trim();
//     if(code){
       
//         select.clear();
//         select.hide();
//         this.addForm.reset();
//     this.addForm.patchValue({
//       itemCode: code,
//       itemName: '',
//       activeItem: true,
//       gstItem: true
//     });
//     this.resetChildUOMTable();
//   } else {
//     this.messageService.add({
//       severity: 'warn',
//       summary: 'Warning',
//       detail: 'Please enter an item code first before adding a new item.'
//     });
//    }
// }
enterEditItemMode(itemData: any) {
    // const costperitem=(itemData.pruchaseprice/itemData.quantity).toFixed(2);
        // patch form with itemData (same fields as before)
        console.log('edit',itemData.value);
        this.addForm.patchValue({
            itembarcode:itemData.itembarcode,
            itemCode: itemData.itemsku || itemData.itemid,
            itemName: itemData.itemname,
            category: itemData.categoryid,
            curStock: itemData.currentstock,
            p_expirydate: itemData.expirydate ? new Date(itemData.expirydate) : null,
            gstItem: itemData.gstitem === 'Y',
            activeItem: itemData.isactive === 'Y',
            location: itemData.location,
            minStock: itemData.minimumstock,
            purchasePrice: itemData.costprice * itemData.quantity,
            mrp: itemData.saleprice,
            parentUOM: itemData.uomid,
            qty: itemData.quantity,
            costPerItem:itemData.costprice,
            warPeriod: itemData.warrentyperiod

        });

        // load child UOM and master child options
        this.OnChildOM(itemData.itemid);
        this.viewItem(itemData.uomid);
 this.resetDisabled=true;
        // Disable only the item-related fields (not purchasePrice/mrp/qty)
        this.disableItemRelatedControls();
              this.addForm.get('purchasePrice')?.enable();
    this.addForm.get('mrp')?.enable();
    this.addForm.get('qty')?.enable();
          // disable child UOM table & Add UOM button
        this.uomTableDisabled = true;
       
    }
    enterItemUpdateMode(itemData: any) {
    // const costperitem=(itemData.pruchaseprice/itemData.quantity).toFixed(2);
        // patch form with itemData (same fields as before)
        console.log('update data',itemData);
        this.addForm.patchValue({
            itembarcode:itemData.itembarcode,
            itemCode: itemData.itemsku || itemData.itemid,
            itemName: itemData.itemname,
            category: itemData.categoryid,
            curStock: itemData.currentstock,
            p_expirydate: itemData.expirydate ? new Date(itemData.expirydate) : null,
            gstItem: itemData.gstitem==='Y',
            activeItem: itemData.isactive==='Y',
            location: itemData.location,
            minStock: itemData.minimumstock,
            // purchasePrice: itemData.costprice * itemData.quantity,
            mrp: itemData.saleprice,
            parentUOM: itemData.uomid,
            qty: itemData.quantity,
            costPerItem:itemData.costprice,
            warPeriod: itemData.warrentyperiod

        });

        // load child UOM and master child options
        this.OnChildOM(itemData.itemid);
        this.viewItem(itemData.uomid);
 this.resetDisabled=true;
 this.addForm.disable(); 
 
        // Disable only the item-related fields (not purchasePrice/mrp/qty)
        this.disableItemRelatedControls();
              this.addForm.get('category')?.enable();
    this.addForm.get('minStock')?.enable();
    this.addForm.get('warPeriod')?.enable();
     this.addForm.get('p_expirydate')?.enable();
      this.addForm.get('location')?.enable();
      this.addForm.get('gstItem')?.enable();
      this.addForm.get('activeItem')?.enable();
       
    }

enterAddItemMode(itemData: any) {
    console.log(itemData)
        // patch form with itemData (same fields as before)
        // const costperitem=(itemData.pruchaseprice/itemData.quantity).toFixed(2);
        console.log('add item:',itemData);
        this.addForm.patchValue({
            itembarcode:itemData.itembarcode,
            itemCode: itemData.itemsku,
            itemName: itemData.itemname,
            category: itemData.categoryid,
            curStock: itemData.currentstock,
            p_expirydate: itemData.expirydate ? new Date(itemData.expirydate) : null,
            gstItem: itemData.gstitem === 'Y',
            activeItem: itemData.isactive === 'Y',
            location: itemData.location,
            minStock: itemData.minimumstock,
            purchasePrice:this.mode=='add'?0:itemData.pruchaseprice,
            // purchasePrice:itemData.pruchaseprice,
            mrp: itemData.saleprice,
            parentUOM: itemData.uomid,
            qty: itemData.quantity,
           // costPerItem:itemData.pruchaseprice,
          costPerItem:itemData.costprice,
            warPeriod: itemData.warrentyperiod
        });
        
        // load child UOM and master child options
        this.OnChildOM(itemData.itemid);
        this.viewItem(itemData.uomid);

        // Disable only the item-related fields (not purchasePrice/mrp/qty)
        this.disableItemRelatedControls();
              this.addForm.get('purchasePrice')?.enable();
    this.addForm.get('mrp')?.enable();
    this.addForm.get('qty')?.enable();
  this.addForm.get('itemSearch')?.enable();
          // disable child UOM table & Add UOM button
        this.uomTableDisabled = true;
    }

     enterAddModeReset() {
        this.uomTableDisabled = false;
        this.resetDisabled = false; 
        this.addForm.enable();
        this.resetChildUOMTable();
        this.addForm.get('activeItem')?.setValue(true);
        this.addForm.get('gstItem')?.setValue(true);
         this.showCopyMessage = false;
    }

    private disableItemRelatedControls() {
        // disable fields that should not be editable after selecting an existing item
        const controls = ['itembarcode','itemCode', 'parentUOM', 'category', 'itemName', 'curStock', 'location', 'minStock', 'warPeriod','p_expirydate','activeItem','gstItem','itemSearch'];
        controls.forEach(c => this.addForm.get(c)?.disable());
    }

    ngOnChanges(changes: SimpleChanges): void {
        const hasEditDataChange = !!changes['editData'] && !!this.editData;
        const formReady=!!this.addForm;
if (hasEditDataChange && formReady) {
    if (this.mode === 'edit') {
      this.enterEditItemMode(this.editData);
      return;
    }
    if (this.mode === 'itemedit') {
      this.enterItemUpdateMode(this.editData);
      return;
    }
  }
    if (this.mode === 'add' && formReady) {
    this.enterAddModeReset();
  }   
    }
   copy(event:any){
    const itemCode = this.addForm.get('itemCode')?.value;
    if(!itemCode || itemCode === ''){
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Select An Item Before Copy'
        });
        return;
    }
     
    this.showCopyMessage = true;  
    this.addForm.enable();  
    this.uomTableDisabled=false;

   this.addForm.get('curStock')?.setValue(0);
   this.addForm.get('itembarcode')?.setValue('');
    this.addForm.get('itemCode')?.setValue('');
}
onBlur(event:FocusEvent){
   const itemcodevalue = (event.target as HTMLInputElement).value.trim();
 
      const payload = {
            p_username: 'admin',
            p_returntype: 'ITEMCODEVALIDATE',
            p_returnvalue: itemcodevalue
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
               this.itemCodeExists=res?.data?.[0]?.itemno===1;
                if(this.itemCodeExists){
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Item Code is already exist.',
                    life: 3000
                });
                }
                
            },
            error: (err) => console.log(err)
        });
}
onBlurBarCode(event:FocusEvent){
   const itembarcodevalue = (event.target as HTMLInputElement).value;

      const payload = {
            p_username: 'admin',
            p_returntype: 'ITEMBARVALIDATE',
            p_returnvalue: itembarcodevalue
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.barcodeExists=res?.data[0]?.itemno===1;
                if(this.barcodeExists){
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Item Barcode is already exist.',
                    life: 3000
                });
                }
                
            },
            error: (err) => console.log(err)
        });
}

    search(event: any) {
        const query = event.query?.toLowerCase() || '';
        if (!query) {
            this.filteredUOM = [...this.uom];
            return;
        }
        //  this.filteredUOM=this.uom.filter(u=>u.label.toLowerCase().includes(query));//commented beacause of error
    }

    filterItemCode(event: any) {
        const query = event.query.toLowerCase();
        // this.filteredItemCode=this.itemCodeOptions.filter(v=>v.label.toLowerCase().includes(query)); //commented beacause of error
        if (!this.filteredItemCode.some((v) => v.label.toLowerCase() === query)) {
            this.filteredItemCode.push({ label: event.query });
        }
    }
    addRow() {
        this.products.push({ childUOM: null, conversion: null, mrpUom: null });
    }
    removeRow() {
        if (this.products.length > 1) {
            this.products.pop();
        } else {
            this.resetChildUOMTable();
        }
    }
  isChildUOMValid(): boolean {
      this.addForm.updateValueAndValidity();
  if (!this.products || this.products.length === 0) return true;

  const parentMrp = Number(this.addForm.get('mrp')?.value || 0);
  for (const row of this.products) {
    const hasChild = !!row.childUOM?.toString().trim();
    const hasConversion = !!row.conversion?.toString().trim();
    const hasMrp = !!row.mrpUom?.toString().trim();
    
    // ✅ Case 1: completely empty row → OK
    if (!hasChild && !hasConversion && !hasMrp) {
      row.mrpError = false;
      continue;
    }

    // ❌ Case 2: partially filled row → INVALID
    if (!(hasChild && hasConversion && hasMrp)) {
      row.mrpError = false;
      return false;
    }

    // ✅ Case 3: all fields present → validate numbers
    const conv = Number(row.conversion);
    const mrpUom = Number(row.mrpUom);

    if (!conv || !mrpUom) {
      row.mrpError = false;
      return false;
    }

    const requiredMinMrpUom = parentMrp / conv;

    if (mrpUom < requiredMinMrpUom) {
      row.mrpError = true;
      return false;
    } else {
      row.mrpError = false;
    }
  }
  return true;
}


    mapFormToPayload(form: any, childUOM: any[]) {
       console.log(form)
     //   return
        
        return {
            // p_operationtype: this.mode === 'add' ? 'PUR_INSERT' : 'PUR_UPDATE',
             p_operationtype:this.mode=='itemedit'?'ITEM_UPD':'PUR_INSERT',
            p_purchaseid:this.mode=='itemedit'?"0":this.transationid.toString(),
            p_itembarcode:form.itembarcode,
            p_itemsku: form.itemCode,
            p_itemname: form.itemName,
            p_categoryid: Number(form.category),
            p_uomid: Number(form.parentUOM),
            p_quantity: Number(form.qty),
            p_costprice: Number(form.costPerItem),
            p_saleprice: Number(form.mrp),
            p_minimumstock: Number(form.minStock),
            p_warrentyperiod: Number(form.warPeriod),

            // Location handling
            p_location: form.location ?? '',

            p_currentstock: Number(form.curStock),

            // Date Format (dd/MM/yyyy)
            p_expirydate: this.datePipe.transform(this.addForm.controls['p_expirydate'].value, 'dd/MM/yyyy'),

            p_currencyid: Number(form.currencyId || 1),
            p_taxid: Number(form.taxId || 0),
            p_warehourse: form.warehouse || 'ShristiShop',
            p_isactive: form.activeItem ? 'Y' : 'N' ,
            p_gstitem: form.gstItem ? 'Y' : 'N',

            // Child UOM logic
            p_childuom: childUOM.length > 0 ? 'Y' : 'N',
            p_uom:
                childUOM.length > 0
                    ? childUOM.map((x) => ({
                          itemsku: form.itemCode,
                          childuomid: Number(x.childUOM),
                          uomconversion: Number(x.conversion),
                          childmrp: Number(x.mrpUom)
                      }))
                    : [],

            // User Session Info
            p_loginuser: this.shareservice.getUserData()?.username || 'admin',
                
            
        };
    }

    onSubmit() {
        if (this.addForm.invalid || !this.isChildUOMValid()) return;
        if(this.mode=='itemedit'){
            this.inventoryService.Oninsertitemdetails(this.mapFormToPayload(this.addForm.getRawValue(), this.products)).subscribe({
            next: (res) => {
               const msg = res?.data?.[0]?.msg || "Item saved successfully";
                this.showSuccess(msg);
                this.save.emit(this.addForm.getRawValue());
                this.close.emit(this.addForm.getRawValue());
            },
            error: (res) => {}
        });
        }
        else{

       
        this.inventoryService.Oninsertitemdetails(this.mapFormToPayload(this.addForm.getRawValue(), this.products)).subscribe({
            next: (res) => {
               const msg = res?.data?.[0]?.msg || "Item saved successfully";
                this.showSuccess(msg);
                this.close.emit(this.addForm.getRawValue());
            },
            error: (res) => {}
        });
         }
    }

    
    onCancel() {
        this.close.emit();
        console.log(this.products);
    }

    resetForm() {
        this.addForm.reset();
        this.resetChildUOMTable();
        this.addForm.get('activeItem')?.setValue(true);
        this.addForm.get('gstItem')?.setValue(true);
        this.addForm.enable();
        this.uomTableDisabled=false;
    }
    onItemCodeChange(event: any) {
         this.showCopyMessage = false;
    
        const itemnamdata = this.itemOptions.find((item) => item.itemsku === event.value);
      
        console.log('itemnamdata', itemnamdata);
        
      if (itemnamdata) {
this.enterAddItemMode(itemnamdata);
}
    }
    
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
OnChildOM(id: number) {
 
    const payload = {
       
      p_username: "admin",
      p_returntype: "CHILDUOM",
      p_returnvalue:id.toString(),
      
       
    };

    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
      next: (res: any) => {
        console.log("CHILD UOM DATA =>", res.data);

        if (!res.data || res.data.length === 0) {
          // No need to show error now
          this.products = []; // or keep existing rows
          return;
        }

        // ✅ Assign API data into table rows (NO FUNCTIONALITY CHANGES)
        this.products = res.data.map((x: any) => ({
          childUOM: x.childuomid,        // bind to dropdown
          conversion: x.uomconversion,   // number input
          mrpUom: x.childmrp             // number input
        }));
      },

      error: (err) => {
        console.error(err);
      }
    });
  
}
Reset(){
    this.addForm.reset();
     this.enterAddModeReset();
     this.enterAddModeReset();
     this.resetChildUOMTable();
      this.showCopyMessage = false;
    
}
getFilteredChildUOM() {
  const parent = this.addForm.get('parentUOM')?.value;
  return this.uomOptions.filter(u => u.fieldid !== parent);
}
onItemParentUM(event:any){
    this.viewItem(event.value)
    this.clearChildUOMValues();
}
clearChildUOMValues() {
    if (this.products && this.products.length > 0) {
        this.products.forEach(row => {
            row.childUOM = '';
            row.conversion = '';
            row.mrpUom = '';
            row.mrpError = false;
        });
    }
  }
viewItem(id: number) {
  console.log(id)
 this.ChilduomOptions=[]

  const payload = {
     
    p_username: "admin",
    p_returntype: "CHILDUOMMASTER",
    p_returnvalue:id.toString(),
    
     
  };

  this.inventoryService.Getreturndropdowndetails(payload).subscribe({
    next: (res: any) => {

      if (!res.data || res.data.length === 0) {
      //  this.showError("No Child UOM Data Available");
        return;
      }

      this.ChilduomOptions = res.data; // assign data
    //   this.childUomDialog = true;   // open popup
    },
    error: (err) => {
     // this.showError("Failed to load Child UOM Details");
      console.error(err);
    }
  });

}


}
