import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
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
  
  @Output() close=new EventEmitter<void>();
  @Input() editData: any;
  @Input() mode : 'add' |'edit' ='add';
  @Output() save=new EventEmitter<any>();
  @Output() childUom = new EventEmitter<boolean>() ;

  addForm!: FormGroup;
filteredItemCode:any[]=[];
    // ✅ Move dropdown options into variables
    itemCodeOptions = [
        { label: 'Item1' },
        { label: 'Item2' },
        { label: 'Item3' }
    ];

    parentUOMOptions = [
          { label: 'Box', value: 'box' },
           {label:'Bundle', value:'bundle'},
         { label: 'Meter', value: 'meter' },
        { label: 'Piece', value: 'piece'}
      
    ];

   categoryOptions = [
        { label: 'Wires & Cables', value: 'Wires & Cables' },
        { label: 'Lighting', value: 'Lighting' },
        { label: 'Fans & Fixtures', value: 'Fans & Fixtures' },
        {label: 'Switches & Accessories',value:'Switches & Accessories'},
        {label: 'Plugs, Holders & Connectors',value:'Plugs, Holders & Connectors'}
    ];
    uom = [
           { label: 'Box', value: 'Box' },
            {label:'Bundle', value:'Bundle'},
         { label: 'Meter', value: 'Meter' },
        { label: 'Piece', value: 'Piece'}
    ]
    //   products = [{
    //       childUOM:'',
    //       conversion:'',
    //       mrp:'',
    //   },
    //   ];
    products: any[] = [
    { childUOM:'', conversion:'', mrpUom:'' }
];

    filteredUOM: any[]=[];
    constructor(private fb: FormBuilder) {}

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
  }
}
search(event:any){
    const query=event.query?.toLowerCase() || '';
     if(!query){
        this.filteredUOM=[...this.uom];
        return;
     }
     this.filteredUOM=this.uom.filter(u=>u.label.toLowerCase().includes(query));
}

filterItemCode(event:any){
    const query = event.query.toLowerCase();
    this.filteredItemCode=this.itemCodeOptions.filter(v=>v.label.toLowerCase().includes(query));
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


    onSubmit() {

this.childUom.emit();
console.log('child uom:',);
        if(this.addForm.valid){  
            const formData={
                ...this.addForm.value,
                childUOMDetails:this.products
            };
            this.save.emit(formData);
          setTimeout(()=>{
            this.close.emit();
          },0);
        }
    }
    onCancel(){
        this.close.emit();
        console.log(this.products);
    }
    resetForm(){
        this.addForm.reset();
        this.resetChildUOMTable();
    }
}
