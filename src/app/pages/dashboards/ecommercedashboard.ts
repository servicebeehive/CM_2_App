import { Component } from '@angular/core';
import { StatsWidget } from './ecommerce/statswidget';
import { RecentSalesWidget } from './ecommerce/recentsaleswidget';
import { RevenueOverViewWidget } from "./ecommerce/revenueoverviewwidget";
import { SalesByCategoryWidget } from "./ecommerce/salesbycategorywidget";
import { TopProductsWidget } from "./ecommerce/topproductswidget";
import { FilterPage } from './ecommerce/filterpage';

@Component({
    selector: 'app-ecommerce-dashboard',
    standalone: true,
    imports: [StatsWidget, RecentSalesWidget, RevenueOverViewWidget, SalesByCategoryWidget,FilterPage],
    template: `
      <!-- Top Filter Section -->
     <div class="grid grid-cols-12 gap-8 mb-8">
        <div class="col-span-12">
            <app-filter-page class="top-filter-section" />
        </div>
     </div>
     
     <!-- Main Content -->
     <div class="grid grid-cols-12 gap-8">
        <!-- Stats Widget -->
        <app-stats-widget />
        
        <!-- Revenue Section -->
        <div class="col-span-12 xl:col-span-6">
            <app-revenue-overview-widget />
        </div>
        <div class="col-span-12 lg:col-span-6">
            <app-recent-sales-widget />
        </div>
       
        
        <!-- Recent Sales and Top Products -->
         <div class="col-span-12 xl:col-span-3">
            <app-sales-by-category-widget />
        </div>
          <div class="col-span-12 xl:col-span-3">
            <app-sales-by-category-widget />
        </div>
     </div>
    `
})
export class EcommerceDashboard {}
