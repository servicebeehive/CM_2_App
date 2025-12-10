import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '@/core/services/auth.service';

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
        CheckboxModule
    ],
    templateUrl: './item-report.component.html',
    styleUrl: './item-report.component.scss',
    providers: [ConfirmationService]
})
export class ItemReportComponent {
    reportForm!: FormGroup;
    visibleDialog = false;
    selectedRow: any = null;
    selection: boolean = true;
    first: number = 0;
    rowsPerPage: number = 5;
    globalFilter: string = '';
    showData: boolean = false; 
    
    categoryOptions = [];
    itemOptions = [];
    products: StockIn[] = [];
    filteredProducts: StockIn[] = [];
    
    reportTypeOptions: any[] = [
        { label: 'Item List', value: 'ITEMLIST' },
        { label: 'Out of Stock', value: 'OUTSTOCK' },
        { label: 'Low Stock', value: 'LOWSTOCK' },
        { label: 'Most Saleable', value: 'MOSTSALEABLE'},
        { label: 'Non-Active Item', value: 'NONACTIVE' },
    ];
    
    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService
    ) {}
    
    ngOnInit(): void {
        this.reportForm = this.fb.group({
            item: [{value: '', disabled: true}],
            reportType: ['', Validators.required],
            category: [{value: '', disabled: true}],
        });
        
        this.loadAllDropdowns();
        
        this.reportForm.get('reportType')?.valueChanges.subscribe(selected => {
            if (selected) {
                this.reportForm.get('category')?.enable();
                this.reportForm.get('item')?.enable();
            } else {
                this.reportForm.get('category')?.disable();
                this.reportForm.get('item')?.disable();
                this.reportForm.patchValue({ category: null, item: null });
            }
        });
    }
    
    Onreturndropdowndetails() {
        const category = this.reportForm.controls['category'].value;
        const item = this.reportForm.controls['item'].value;
        const reportType = this.reportForm.controls['reportType'].value;
        
        console.log('Filters:', { category, item, reportType });
        
        if (!reportType) {
            this.errorSuccess('Please select a Report Type.');
            return;
        }
        
        const payload = {
             
            p_categoryid: category || null,
            p_itemid: item || null,
            p_username: 'admin',
            p_type: reportType || 'ITEMLIST',
                
                  
        };
        
        this.showData = false; 
        
        this.inventoryService.getupdatedata(payload).subscribe({
            next: (res: any) => {
                console.log('API RESULT:', res.data);
                this.products = res?.data || [];
                this.filteredProducts = [...this.products];
                this.showData = true; 
                
                if (this.products.length === 0) {
                    this.showSuccess('No Data Available for the selected filters.');
                }
            },
            error: (err) => {
                console.error(err);
                this.errorSuccess('Error loading data. Please try again.');
                this.showData = false;
            }
        });
    }
  
   
    
    onReportChange(event: any) {
        const reportType = event.value;
        if (!reportType) {
            this.products = [];
            this.filteredProducts = [];
            this.showData = false; 
            return;
        }
    }
    
    onCategoryItem(event: any) {
        const categoryId = event.value;
        this.reportForm.get('item')?.setValue(null);
        
        if (!categoryId) {
            this.OnGetItem();
            return;
        }
        
        this.categoryRelavantItem(categoryId);
    }
    
    categoryRelavantItem(id: any) {
        this.itemOptions = [];
        const payload = {
             
            p_username: "admin",
            p_returntype: "CATEGORY",
            p_returnvalue: id.toString(),
            
             
        };
        
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                if (!res.data || res.data.length === 0) {
                    this.itemOptions = [];
                    this.showSuccess('No items found for this category.');
                    return;
                }
                this.itemOptions = res.data;
            },
            error: (err) => {
                console.error(err);
            }
        });
    }
    
    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
    }
    
    reset() {
        this.reportForm.reset();
        this.filteredProducts = [];
        this.products = [];
        this.showData = false; 
        this.OnGetItem();
    }
    
    createDropdownPayload(returnType: string) {
        return {
             
            p_username: 'admin',
            p_returntype: returnType,
        };
    }
    
    OnGetItem() {
        const payload = this.createDropdownPayload('ITEM');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    
    OnGetCategory() {
        const payload = this.createDropdownPayload('CATEGORY');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.categoryOptions = res.data),
            error: (err) => console.log(err)
        });
    }
    
    loadAllDropdowns() {
        this.OnGetCategory();
        this.OnGetItem();
    }
    
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    
    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}