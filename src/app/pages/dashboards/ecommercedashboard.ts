import { Component } from '@angular/core';
import { StatsWidget } from './ecommerce/statswidget';
import { RecentSalesWidget } from './ecommerce/recentsaleswidget';
import { RevenueOverViewWidget } from "./ecommerce/revenueoverviewwidget";
import { SalesByCategoryWidget } from "./ecommerce/salesbycategorywidget";
import { TopProductsWidget } from "./ecommerce/topproductswidget";
import { FilterPage } from './ecommerce/filterpage';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-ecommerce-dashboard',
    standalone: true,
    imports: [StatsWidget, RecentSalesWidget, RevenueOverViewWidget, SalesByCategoryWidget,FilterPage,
        CommonModule,
    FormsModule,

    // PrimeNG modules
    CardModule,
    TableModule,
    DropdownModule,
    TagModule,
    PaginatorModule,
    IconFieldModule,
    InputIconModule
    ],
    template: `
      <!-- Top Filter Section -->
     <!-- <div class="grid grid-cols-12 gap-8 mb-8">
        <div class="col-span-12">
            <app-filter-page class="top-filter-section" />
        </div>
     </div> -->
     <p-dropdown 
            [options]="filterOptions" 
            [(ngModel)]="selectedFilter"
            optionLabel="label"
            optionValue="value"
            placeholder="Filter"
            (onChange)="onFilterChange($event)"
            styleClass="w-40 mb-4"
        ></p-dropdown>
     
     <!-- Main Content -->
     <div class="grid grid-cols-12 gap-8">
        <!-- Stats Widget -->
        <app-stats-widget />
        
        <!-- Revenue Section -->
        <div class="col-span-12 xl:col-span-4">
            <app-revenue-overview-widget />
        </div>
        <div class="col-span-12 lg:col-span-4">
            <app-recent-sales-widget />
        </div>
       
        
        <!-- Recent Sales and Top Products -->
       <div class="col-span-12 xl:col-span-4">
            <app-sales-by-category-widget />
        </div>
        
     </div>
    `
})
export class EcommerceDashboard {
    filterOptions = [
         { label: 'Today', value: 'today' },
  { label: 'This Month', value: 'month' },
  { label: 'Quarterly', value: 'quarter' },
  { label: 'Yearly', value: 'year' }
];
selectedFilter = 'today';  // default value

onFilterChange(e: any) {
  console.log('Selected Filter:', e.value);

  // Here you will call API based on filter
  // Example:
  // this.loadTopSales(e.value);
  // this.loadOutOfStock(e.value);

  
}

}
