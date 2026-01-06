import { CommonModule, DatePipe } from '@angular/common';
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
    providers: [ConfirmationService, DatePipe]
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
    filteredProducts: any[] = [];
    columns: any[] = [];

    reportTypeOptions: any[] = [
        { label: 'Item List', value: 'ITEMLIST' },
        { label: 'Out of Stock', value: 'OUTSTOCK' },
        { label: 'Low Stock', value: 'LOWSTOCK' },
        { label: 'Most Saleable', value: 'MOSTSALEABLE' },
        { label: 'Non-Active Item', value: 'NONACTIVE' }
    ];

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private messageService: MessageService,
        private datePipe: DatePipe
    ) {}

    ngOnInit(): void {
        this.reportForm = this.fb.group({
            item: [{ value: '', disabled: true }],
            reportType: ['', Validators.required],
            category: [{ value: '', disabled: true }]
        });
        this.setTableColumns();
        this.loadAllDropdowns();

        this.reportForm.get('reportType')?.valueChanges.subscribe((selected) => {
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
        if (!reportType) {
            this.errorSuccess('Please select a Report Type.');
            return;
        }
        const payload = {
            p_categoryid: category || null,
            p_itemid: item || null,
            p_username: 'admin',
            p_type: reportType || 'ITEMLIST'
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
            p_username: 'admin',
            p_returntype: 'CATEGORY',
            p_returnvalue: id.toString()
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
            p_returntype: returnType
        };
    }

    OnGetItem() {
        const payload = this.createDropdownPayload('ITEMALL');
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

    private setTableColumns(): void {
        const formatDate = (dateValue: any): string => {
            if (!dateValue) return '';
            try {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
                }
            } catch {}
            return String(dateValue);
        };

        this.columns = [
            { fields: 'itemsku', header: 'Item Code' },
            { fields: 'itemname', header: 'Item Name' },
            { fields: 'categoryname', header: 'Category' },
            { fields: 'currentstock', header: 'Stock' },
            { fields: 'uomname', header: 'UOM' },
            { fields: 'costprice', header: 'Cost Price' },
            { fields: 'saleprice', header: 'MRP' },
            { fields: 'gstitem', header: 'GST Item' },
            { fields: 'isactive', header: 'Active' },
            { fields: 'warrentyperiod', header: 'Warranty (in Mon)' },
            { fields: 'location', header: 'Location' },
            { fields: 'updatedby', header: 'Last Upd By' },
            { fields: 'updatedon', header: 'Last Upd On', formatter: formatDate }
        ];
    }

    downloadExcel() {
        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            this.errorSuccess('No data available to download.');
            return;
        }
        const csvContent = this.generateCSV();
        this.downloadFile(csvContent, 'text/csv;charset=utf-8;', '.csv');

        this.showSuccess('Excel file downloaded successfully!');
    }

    private generateCSV(): string {
        const headers = this.columns.map((col) => this.escapeCSV(col.header));
        const headerRow = headers.join(',');

        // Create data rows
        const dataRows = this.filteredProducts.map((item) => {
            const row = this.columns.map((col) => {
                const value = item[col.fields];
                const formattedValue = col.formatter ? col.formatter(value) : value;
                return this.escapeCSV(formattedValue);
            });
            return row.join(',');
        });
        // Combine header and data rows
        return [headerRow, ...dataRows].join('\n');
    }
    private escapeCSV(value: any): string {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        const stringValue = String(value);
        const escapedValue = stringValue.replace(/"/g, '""');
        if (/[,"\n\r]/.test(escapedValue)) {
            return `"${escapedValue}"`;
        }
        return escapedValue;
    }
    private downloadFile(data: string, mimeType: string, extension: string) {
        const blob = new Blob([data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.generateFileName() + extension;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
    private generateFileName(): string {
        const reportType = this.reportForm.get('reportType')?.value || 'Item';
        const category = this.reportForm.get('category')?.value;
        const item = this.reportForm.get('item')?.value;
        const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd_HH-mm');

        let fileName = `${reportType}_Report_${currentDate}`;

        if (category) {
            fileName += `_Category_${category}`;
        }

        if (item) {
            fileName += `_Item_${item}`;
        }

        return fileName;
    }
    onDownloadClick() {
        if (this.reportForm.invalid) {
            this.errorSuccess('Please fill all required fields before downloading.');
            return;
        }

        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            if (!this.showData) {
                this.errorSuccess('Please click "Display" first to load data before downloading.');
                return;
            } else {
                this.errorSuccess('No data available to download.');
                return;
            }
        }

        this.downloadExcel();
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
