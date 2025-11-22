import { Component, ViewChild } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { Product, ProductService } from '@/pages/service/product.service'
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputIconModule } from 'primeng/inputicon';
import { FilterMatchMode } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    standalone: true,
    selector: 'app-recent-sales-widget',
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        RippleModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        FormsModule,
        TooltipModule,
        TagModule,
        SelectModule
    ],
    template: ` <div class="card">
        <div
            class="flex flex-col md:flex-row md:items-start md:justify-between mb-4"
        >
            <div
                class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4 md:mb-0"
            >
                Recent Sales
            </div>
            <div class="inline-flex items-center">
                <!-- <p-iconfield>
                    <p-inputicon class="pi pi-search" />
                    <input
                        pInputText
                        type="text"
                        (input)="onFilterGlobal($event)"
                        placeholder="Search"
                        [style]="{ borderRadius: '2rem' }"
                        class="w-full"
                    />
                </p-iconfield> -->
                <!-- <p-button
                    icon="pi pi-upload"
                    class="mx-4 export-target-button"
                    rounded
                    pTooltip="Export"
                    (click)="dt.exportCSV()"
                /> -->
                 <p-select 
                        [options]="filterOptions" 
                        [(ngModel)]="filter" 
                        class="w-full"
                        optionLabel="label"
                        placeholder="Filter">
                    </p-select>
            </div>
        </div>
        <p-table
            #dt
            [value]="products"
            [paginator]="true"
            [rows]="5"
            [columns]="cols"
            responsiveLayout="scroll"
            [globalFilterFields]="[
                'type',
                'billDate',
                'price',
                'inventoryStatus',
            ]"
            [exportHeader]="'customExportHeader'"
        >
            <ng-template #header>
                <tr>
                    <th pSortableColumn="type">
                        <span class="flex items-center gap-2">Item <p-sortIcon field="type"></p-sortIcon></span>
                    </th>
                    <th pSortableColumn="billDate">
                        <span class="flex items-center gap-2">Category <p-sortIcon field="billDate"></p-sortIcon></span>
                    </th>
                    <th pSortableColumn="billNo">
                        <span class="flex items-center gap-2">Stock <p-sortIcon field="billNo"></p-sortIcon></span>
                    </th>
                    <th pSortableColumn="totalQty">
                        <span class="flex items-center gap-2">UOM <p-sortIcon field="totalQty"></p-sortIcon></span>
                    </th>
                    <!-- <th pSortableColumn="totalSale">
                        <span class="flex items-center gap-2">Total Sale <p-sortIcon field="totalSale"></p-sortIcon></span>
                    </th>
                    <th>View</th> -->
                </tr>
            </ng-template>
            <ng-template #body let-product>
                <tr>
                    <td style="width: 35%; min-width: 7rem;">
                        {{ product.name }}
                    </td>
                    <td style="width: 35%; min-width: 7rem;">
                        {{ product.category }}
                    </td>
                    <td style="width: 35%; min-width: 8rem;">
                        {{ product.price | currency: 'USD' }}
                    </td>
                    <td style="width: 35%; min-width: 8rem;">
                        <!-- <p-tag
                            [severity]="
                                getBadgeSeverity(product.inventoryStatus)
                            "
                            >{{ product.inventoryStatus }}</p-tag
                        > -->
                    </td>
                    <!-- <td style="width: 15%;">
                        <p-button icon="pi pi-search" outlined rounded />
                    </td> -->
                </tr>
            </ng-template>
        </p-table>
    </div>`,
    providers: [ProductService],
})
export class RecentSalesWidget {
    products!: Product[];

    // filterSalesTable = {
    //     global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    // };
    filterOptions: any[]=[
        {label:'Out of Stock'},
        {label:'Low of Stock'},
        {label:'Most Salable'},
        {label:'Non-Active'}
    ];
    filter:string='';
    cols!: Column[];

    exportColumns!: ExportColumn[];

    @ViewChild('dt') dt!: Table;

    constructor(private productService: ProductService) {}

    ngOnInit() {
        this.productService
            .getProductsSmall()
            .then((data) => (this.products = data));

        this.cols = [
            {
                field: 'code',
                header: 'Code',
                customExportHeader: 'Product Code',
            },
            { field: 'name', header: 'Name' },
            { field: 'category', header: 'Category' },
            { field: 'price', header: 'Price' },
            { field: 'inventoryStatus', header: 'Inventory Status' },
        ];

        this.exportColumns = this.cols.map((col) => ({
            title: col.header,
            dataKey: col.field,
        }));
    }

    onFilterGlobal(event: Event): void {
        const target = event.target as HTMLInputElement | null;
        if (target) {
            this.dt.filterGlobal(target.value, 'contains');
        }
    }

    getBadgeSeverity(inventoryStatus: string) {
        switch (inventoryStatus.toLowerCase()) {
            case 'instock':
                return 'success';
            case 'lowstock':
                return 'warn';
            case 'outofstock':
                return 'danger';
            default:
                return 'info';
        }
    }
}
