import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StatsWidget } from './ecommerce/statswidget';
import { RecentSalesWidget } from './ecommerce/recentsaleswidget';
import { RevenueOverViewWidget } from './ecommerce/revenueoverviewwidget';
import { SalesByCategoryWidget } from './ecommerce/salesbycategorywidget';
import { TopProductsWidget } from './ecommerce/topproductswidget';
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
import { AuthService } from '@/core/services/auth.service';
import { SaleMangerDashboard } from './salemanagerdashboard';

@Component({
    selector: 'app-ecommerce-dashboard',
    standalone: true,
    imports: [
        StatsWidget,
        RecentSalesWidget,
        SaleMangerDashboard,
        RevenueOverViewWidget,
        SalesByCategoryWidget,
        FilterPage,
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        DropdownModule,
        TagModule,
        PaginatorModule,
        IconFieldModule,
        InputIconModule
    ],
    template: `
        <!-- @if (role === 'Admin' || role === 'StoreOwner') { -->
            <div>
                <div class="flex flex-wrap items-center gap-3 mb-4">
                    <p-dropdown [options]="filterOptions" [(ngModel)]="selectedFilter" optionLabel="label" optionValue="value" placeholder="Filter" (onChange)="onFilterChange($event)" styleClass="w-40"></p-dropdown>

                    <p-dropdown
                        [options]="dashboardOptions"
                        [(ngModel)]="selectedDashboard"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Go to Dashboard"
                        (onChange)="onDashboardChange($event)"
                        styleClass="w-52"
                    ></p-dropdown>
                </div>
                <!-- Main Content -->
                <div class="grid grid-cols-12 gap-8">
                    <!-- Stats Widget -->
                    <app-stats-widget [filerby]="selectedFilter" />
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
            </div>
        <!-- } @else {
            <div>
                <app-sales-dashboard></app-sales-dashboard>
            </div>
        } -->
    `
})
export class EcommerceDashboard implements OnInit {
    public role: string = '';
    filterOptions = [
        { label: 'Today', value: 'TODAY' },
        { label: 'This Month', value: 'MONTH' },
        { label: 'Quarterly', value: 'QUARTER' },
        { label: 'Yearly', value: 'YEAR' }
    ];
    selectedFilter = 'MONTH'; // default value

    // Dropdown to jump to another dashboard page.
    // Update these `value` paths to match your actual route config (app.routes.ts).
    dashboardOptions = [
        { label: 'Management Dashboard', value: '/layout/management-dashboard' },
        { label: 'Operational Dashboard', value: '/layout/operational-dashboard' }
    ];
    selectedDashboard: string | null = null;

    constructor(
        public authservice: AuthService,
        private router: Router
    ) {}

    onFilterChange(e: any) {}

    onDashboardChange(e: any): void {
        const path = e.value;
        if (path) {
            this.router.navigate([path]);
        }
    }

    ngOnInit(): void {
        const isUserRoleType: any = this.authservice.isLogIntType();
        this.role = isUserRoleType?.usertypecode;
    }
}