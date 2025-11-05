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
import { ConfirmationService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { Paginator } from 'primeng/paginator';
import { RouterLink } from "@angular/router";
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
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
    selector: 'app-item-report',
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
    RouterLink,
    GlobalFilterComponent
],
    templateUrl: './item-report.component.html',
    styleUrl: './item-report.component.scss',
    providers:[ConfirmationService]
})
export class ItemReportComponent {
    reportForm!: FormGroup;

     selectedRow:any=null;
     selection:boolean=true;
     pagedProducts:StockIn[]=[];
     filteredProducts:StockIn[]=[];
     globalFilter:string='';
     first:number=0;
     rowsPerPage:number=5;
     childUomStatus:boolean=false;
     showGlobalSearch:boolean=false;
    // ✅ Move dropdown options into variables

    reportTypeOptions = [
       {label:'Item MAaster'},
       {label:'Stock Report'}
    ];

    categoryOptions = [
        { label: 'Wires & Cables', value: 'Wires & Cables' },
        { label: 'Lighting', value: 'Lighting' },
        { label: 'Fans & Fixtures', value: 'Fans & Fixtures' },
        {label: 'Switches & Accessories',value:'Switches & Accessories'},
        {label: 'Plugs, Holders & Connectors',value:'Plugs, Holders & Connectors'}
    ];

    products:StockIn[] =[];
    constructor(private fb: FormBuilder, private stockInService:InventoryService,private confirmationService:ConfirmationService) {}

    ngOnInit(): void {
         this.onGetStockIn();
        this.reportForm = this.fb.group(
            {
                count: [''],
                itemName: ['', [Validators.maxLength(50)]],
                reportType: ['',Validators.required],
                fromDate: [''],
                toDate:[''],
                category:['',[Validators.required]],
                activeItem:[true],
                threshold:[true],
                groupByMonthly:[true]
            }
        );
       
    }

 onGetStockIn() {
 this.products=this.stockInService.productItem;
 console.log('item',this.products);
 this.products.forEach(p=>p.selection=true);
 this.filteredProducts=[...this.products];
}
applyGlobalFilter(){
    const searchTerm = this.globalFilter?.toLowerCase() || '';
    this.filteredProducts=this.products.filter((p)=>{
       return Object.values(p).some((value)=>String(value).toLowerCase().includes(searchTerm));
    })
}
 allowOnlyNumbers(event:KeyboardEvent){
        const allowedChars=/[0-9]\b/;
        const inputChar=String.fromCharCode(event.key.charCodeAt(0));
        if(!allowedChars.test(inputChar)){
            event.preventDefault();
        }
    }
onSave(updatedData:any){
    const mappedData={
        selection:true,
     code: updatedData.itemCode.label ||updatedData.itemCode,
     name:updatedData.itemName,
     category:updatedData.category,
     curStock: updatedData.curStock,
    quantity: updatedData.qty,
    uom: updatedData.parentUOM,
    // childUOM:hasChildUOM?'Yes' :'No',
    status:updatedData.status,
    threshold:updatedData.threshold,
    entryDate:updatedData.entryData,
    location: updatedData.location,
    gstItem:updatedData.gstItem===true?'Yes':'No',
    };
    // if(this.mode==='edit' && this.selectedRow){
    //     const index=this.products.findIndex(p=>p.code === this.selectedRow.code);
    //         if(index!==-1){
    //            this.products[index]={...this.products[index], ...mappedData };
    //         }
    //     }
    //         else{
    //             this.products.push(mappedData);
    //         }
    }
 deleteItem(product:any) {
  this.confirmationService.confirm({
    message: `Are you sure you want to delete <b>${product.name}</b>?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Yes',
    rejectLabel: 'No',
    acceptButtonStyleClass: 'p-button-danger',
    rejectButtonStyleClass: 'p-button-secondary',
    accept: () => {
      this.products = this.products.filter(p => p.code !== product.code);
    },
    reject: () => {
      // Optional: Add toast or log cancel
      console.log('Deletion cancelled');
    }
  });
  }
// onChildUom(status: boolean):boolean{
// this.childUomStatus=status;
// return this.childUomStatus;
// }
onPageChange(event: any) {
    this.first = event.first;
    this.rowsPerPage = event.rows;
    this.updatePagedProducts();
}

updatePagedProducts() {
    this.pagedProducts = this.products.slice(this.first, this.first + this.rowsPerPage);
}

get grandTotal():number{
    return this.products.reduce((sum,p)=>sum+(p.total || 0),0);
}
    display() {
        // this.confirmationService.confirm({
        //     message:'Do you want to save the header information',
        //     header:'Confirm',
        //     acceptLabel:'Yes',
        //     rejectLabel:'Cancel',
        //     rejectButtonStyleClass:'p-button-secondary',
        //     accept:()=>{
        //      this.addItemEnabled=true;
        //     }
        // });
    }
    exportToExcel(){
    }

    reset(){
        this.reportForm.reset({
            transId:'',
            invoiceNo:'',
            vendorName:'',
            invoiceDate:'',
            remark:''
            });
        this.products=[];
        this.filteredProducts=[];
        this.first=0;
        this.pagedProducts=[];
        this.childUomStatus=false;
        this.globalFilter='';
        this.showGlobalSearch=false;
        // if (this.addInventoryComp){
        //     this.addInventoryComp.resetForm();
        // }
    }
}
