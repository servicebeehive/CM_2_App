import { CommonModule } from '@angular/common';
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
          DropdownModule,
          ToggleSwitchModule,
          RippleModule,
          ChipModule,
          FluidModule,
          MessageModule,
          AutoCompleteModule,
          CheckboxModule
      ],
  templateUrl: './addinventory.component.html',
  styleUrl: './addinventory.component.scss'
})
export class AddinventoryComponent {
@Input() transationid=null
  @Output() close=new EventEmitter<void>();
  @Input() editData: any;
  @Input() mode : 'add' |'edit' ='add';
  @Output() save=new EventEmitter<any>();
  @Output() childUom = new EventEmitter<boolean>() ;

@Input() itemOptions: any[] = [];
@Input() categoryOptions: any[] = [];
@Input() uomOptions: any[] = [];
@Input() vendorOptions: any[] = [];
@Input() purchaseIdOptions: any[] = [];
 public authService = inject(AuthService);
  addForm!: FormGroup;
filteredItemCode:any[]=[];
    // ✅ Move dropdown options into variables
    itemCodeOptions = [];
    parentUOMOptions = [];
  
    uom = []
   
    products: any[] = [
   // { childUOM:'', conversion:'', mrpUom:'' }
];

    filteredUOM: any[]=[];
    constructor(private fb: FormBuilder, public inventoryService:InventoryService,public shareservice:ShareService) {}

    ngOnInit(): void {
        this.addForm = this.fb.group(
            {
                itemCode: ['', [Validators.required,Validators.maxLength(50)]],
                category: ['', Validators.required],
                parentUOM: ['',Validators.required],
                itemName: ['', [Validators.required,Validators.maxLength(500)]],
                curStock: [''],
                purchasePrice:['1135',[Validators.required ,Validators.min(1)]],
                minStock:['10'],
                warPeriod:[''],
                costPerItem:[{value:'',disabled:true}],
                mrp:['',[Validators.required ,Validators.min(1)]],
                location:['',Validators.maxLength(100)],
                qty:['',Validators.required ],
                discount:[''],
                gstItem:[true]
            },{validators:this.mrpValidator}
        );
        this.addForm.get('purchasePrice')?.valueChanges.subscribe(()=>this.updateCostPerItem());
        this.addForm.get('qty')?.valueChanges.subscribe(()=>this.updateCostPerItem());
        this.resetChildUOMTable();

    }
    resetChildUOMTable(){
        this.products=[{ childUOM:'', conversion:'', mrpUom:''}];
    }
    allowOnlyNumbers(event:KeyboardEvent){
        const allowedChars=/[0-9]\b/;
        const inputChar=String.fromCharCode(event.key.charCodeAt(0));
        if(!allowedChars.test(inputChar)){
            event.preventDefault();
        }
    }

    mrpValidator:ValidatorFn=(group:AbstractControl):ValidationErrors | null=>{
    const purchase=parseFloat(group.get('purchasePrice')?.value);
    const mrp=parseFloat(group.get('mrp')?.value);
    if(isNaN(purchase) || isNaN(mrp)){
        return null;
    }
    if(mrp<purchase){
        return { mrpGreaterThanPurchase:true };
    }
    return null;
   };

    updateCostPerItem():void{
        const purchasePrice=parseFloat(this.addForm.get('purchasePrice')?.value);
        const qty = parseFloat(this.addForm.get('qty')?.value);

        if(!isNaN(purchasePrice )&& !isNaN(qty) && qty>0){
            const cost=purchasePrice/qty;
            this.addForm.get('costPerItem')?.setValue(cost.toFixed(2),{emitEvent:false});
        }else{
            this.addForm.get('costPerItem')?.setValue('',{emitEvent:false});
        }
    }

   ngOnChanges(changes: SimpleChanges): void {
  if (changes['editData'] && this.editData && this.mode==='edit' && this.addForm) {
    this.addForm.patchValue({
       itemCode:this.editData.code,
       itemName: this.editData.name,
       category:this.editData.category,
       curStock:this.editData.curStock,
       purchasePrice:this.editData.purchasePrice,
       qty:this.editData.quantity,
       mrp:this.editData.mrp,
       minStock:this.editData.minStock,
       warPeriod:this.editData.warPeriod,
       costPerItem:this.editData.costPerItem,
       location:this.editData.location,
       parentUOM:this.editData.uom,
       childUom:this.editData.childUOM,
       conversion:this.editData.conversion,
       mrpUom:this.editData.mrpUom,
       discount:this.editData.discount,
       gstItem:this.editData.gstItem
    });
  }
  else if(this.mode === 'add' && this.addForm){
    this.addForm.reset();
    this.resetChildUOMTable();
    this.addForm.get('gstItem')?.setValue(true);
  }
}
search(event:any){
    const query=event.query?.toLowerCase() || '';
     if(!query){
        this.filteredUOM=[...this.uom];
        return;
     }
    //  this.filteredUOM=this.uom.filter(u=>u.label.toLowerCase().includes(query));//commented beacause of error
}

filterItemCode(event:any){
    const query = event.query.toLowerCase();
    // this.filteredItemCode=this.itemCodeOptions.filter(v=>v.label.toLowerCase().includes(query)); //commented beacause of error
    if(!this.filteredItemCode.some(v=>v.label.toLowerCase()===query)){
        this.filteredItemCode.push({label:event.query});
    }
}
addRow(){
this.products.push({childUOM:'', conversion:'', mrpUom:''});
}
removeRow(){
if(this.products.length>1){
    this.products.pop();
}
else{
    this.resetChildUOMTable();
}
}
isChildUOMValid(): boolean {
  if (!this.products || this.products.length === 0) return true;

  let hasAnyValue = false;
  for (const row of this.products) {
    const hasChild = row.childUOM?.toString().trim() !== '';
    const hasConversion = row.conversion?.toString().trim() !== '';
    const hasMrp = row.mrpUom?.toString().trim() !== '';

    if (hasChild || hasConversion || hasMrp) {
      hasAnyValue = true;

      if (!hasChild || !hasConversion || !hasMrp) {
        return false;
      }
    }
  }
  return true;
}

 mapFormToPayload(form: any, childUOM: any[]) {
  return {
    p_operationtype: this.mode === 'add' ? 'PUR_INSERT' : 'PUR_UPDATE',

    p_itemsku: form.itemCode,
    p_itemname: form.itemName,
    p_categoryid: Number(form.category),
    p_uomid: Number(form.parentUOM),
    p_quantity: Number(form.qty),
    p_costprice: Number(form.purchasePrice),
    p_saleprice: Number(form.mrp),
    p_minimumstock: Number(form.minStock),
    p_warrentyperiod: Number(form.warPeriod),
    p_location: form.location,
    p_currentstock: Number(form.curStock),

    // Extra values added from expected format
    p_expirydate: form.expiryDate, // Keep dd/mm/yyyy format as string
    p_currencyid: Number(form.currencyId || 1),
    p_taxid: Number(form.taxId || 0),
    p_warehourse: form.warehouse || 'ShristiShop', // fallback default
    p_isactive: 'Y',

    p_gstitem: form.gstItem ? 'Y' : 'N',
    p_childuom: childUOM.length > 0 ? 'Y' : 'N',

    // Child UOM array mapping corrected
    // p_uom: childUOM.map(x => ({
    //   itemsku: form.itemCode,
    //   childuomid: Number(x.childUOM),
    //   uomconversion: Number(x.conversion),
    //   childmrp: Number(x.mrpUom)
    // })),
    p_uom:null,

    // User & token information
    p_loginuser: this.shareservice.getUserData()?.username || 'admin',
    clientcode: 'CG01-SE',
    'x-access-token': this.authService.getToken(),
    uname: 'admin'
  };
}


  onSubmit() {
    if (this.addForm.invalid || !this.isChildUOMValid()) return;
    this.inventoryService.Oninsertitemdetails(this.mapFormToPayload(this.addForm.getRawValue(), this.products)).subscribe(() => {
      this.close.emit();
    });
  }
    onCancel(){
        this.close.emit();
        console.log(this.products);
    }
    resetForm(){
        this.addForm.reset();
        this.resetChildUOMTable();
        this.addForm.get('gstItem')?.setValue(true);
    }
onItemCodeChange(event:any){
  console.log(event.value)
  const itemnamdata=this.itemOptions.find(item=>item.itemsku===event.value)
  console.log(itemnamdata)
  if(itemnamdata){
      this.addForm.controls['itemName'].setValue(itemnamdata.itemname)
      console.log(this.addForm.value)
  }


}

}



