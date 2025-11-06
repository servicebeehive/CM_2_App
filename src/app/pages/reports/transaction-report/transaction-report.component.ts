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
    // ✅ Move dropdown options into variables

    reportTypeOptions = [
        {label:'Purchase'},
       {label:'Replace'},
       {label:'Return'},
       {label:'Sale'}
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
                itemName: ['', [Validators.maxLength(50)]],
                reportType: ['',Validators.required],
                fromDate: [''],
                toDate:[''],
                category:['',[Validators.required]],
               gstTransaction:[true]
            }
        );
       
    }

 onGetStockIn() {
 this.products=this.stockInService.productItem;
 console.log('item',this.products);
 this.products.forEach(p=>p.selection=true);
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
        transactionId:updatedData.transactionId,
        transactionDate:updatedData.transactionDate,
        itemName:updatedData.itemName,
        category:updatedData.category,
        status:updatedData.status,
        quantity:updatedData.quantity,
        amount:updatedData.amount,
        discount:updatedData.discount,
        total:updatedData.total
    };
    }

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
        this.first=0;
        this.pagedProducts=[];
    }
}
