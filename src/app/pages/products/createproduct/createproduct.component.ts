import {CommonModule} from '@angular/common';
import {Component, ElementRef, OnInit, QueryList, ViewChildren} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {ChipModule} from 'primeng/chip';
import {EditorModule} from 'primeng/editor';
import {FileUploadModule} from 'primeng/fileupload';
import {FluidModule} from 'primeng/fluid';
import {InputTextModule} from 'primeng/inputtext';
import {RippleModule} from 'primeng/ripple';
import {SelectModule} from 'primeng/select';
import { DropdownModule } from 'primeng/dropdown';
import {ToggleSwitchModule} from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
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
  selector: 'app-createproduct',
 imports: [CommonModule, EditorModule,ReactiveFormsModule,TextareaModule, TableModule,  InputTextModule, FormsModule, FileUploadModule, ButtonModule, SelectModule,  DropdownModule,   ToggleSwitchModule, RippleModule, ChipModule, FluidModule,MessageModule],
  standalone:true,
  templateUrl: './createproduct.component.html',
  styleUrl: './createproduct.component.scss'
})
export class CreateproductComponent implements OnInit {
   productForm!: FormGroup;

  // ✅ Move dropdown options into variables
 categoryOptions = [
  { label: 'Electronics', value: 'electronics' },
  { label: 'Furniture', value: 'furniture' },
  { label: 'Grocery', value: 'grocery' }
];

uomOptions = [
  { label: 'KG', value: 'kg' },
  { label: 'Litre', value: 'litre' },
  { label: 'Box', value: 'box' }
];


  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.productForm = this.fb.group({
      itemCode: ['ITEM-001', Validators.required],
      itemName: ['Sample Product', [Validators.required,Validators.minLength(3)]],
      description:['',Validators.maxLength(300)],
      purchasePrice: [100, [Validators.required,Validators.min(1)]],
      // parentUOM: [this.uomOptions[0],Validators.required], // preselect first UOM
      parentUOM:['',Validators.required],
      mrp: [120,[Validators.min(1)]],
      quantity: [10,[Validators.required,Validators.min(1)]],
      currentStock: [{ value: 50, disabled: true }],
      // category: [this.categoryOptions[0]], // preselect first category
      category:['',Validators.required],
      minStock: [5,Validators.min(1)],
      warrantyPeriod: ['12 Months'],
      location: ['Warehouse A'],
      discount: [5],
       childUOMs: this.fb.array([this.createChildUOMRow()],[this.minChildUOMRows(1)]) // ✅ must initialize here
    },{validators:this.mrpValidator});
  }
minChildUOMRows(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control instanceof FormArray) {
      const len = control.length;
      if (len < min) {
        return { minChildRows: { required: min, actual: len } };
      }
    }
    return null;
  };
}


onImageUpload(event: any) {
  console.log('Single Image Uploaded:', event);
}

onGalleryUpload(event: any) {
  console.log('Gallery Files Uploaded:', event.files);
}

  createChildUOMRow(): FormGroup {
    return this.fb.group({
      childUOM: ['Piece',Validators.required],
      conversion: [1,[Validators.required,Validators.min(1)]],
      childMRP: [120,[Validators.required,Validators.min(1)]],
    });
  }

  get childUOMs(): FormArray {
    return this.productForm.get('childUOMs') as FormArray;
  }

// get itemName() {
//   return this.productForm.get('itemName');
// }

  addChildUOM() {
    this.childUOMs.push(this.createChildUOMRow());
    this.childUOMs.updateValueAndValidity();
  }

  removeChildUOM(index: number) {
    this.childUOMs.removeAt(index);
    this.childUOMs.updateValueAndValidity();
  }

   mrpValidator:ValidatorFn=(group:AbstractControl):ValidationErrors | null=>{
    const purchase=group.get('purchasePrice')?.value;
    const mrp=group.get('mrp')?.value;
    if(purchase != null && mrp != null && mrp< purchase){
      return {
        mrpGreaterThanPurchase:true
      };
    }
    return null;
   };

  onSubmit() {
    console.log(this.productForm.getRawValue());
  }
}
