import { Component, Input, SimpleChanges } from '@angular/core';
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
import { DashboardService } from '@/core/services/dashboard.service';
import { Skeleton, SkeletonModule } from 'primeng/skeleton';
import { RouterModule } from '@angular/router';
import { KnobModule } from 'primeng/knob';
import { AuthService } from '@/core/services/auth.service';

@Component({
    selector: 'app-sales-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        // PrimeNG modules
        CardModule,
        TableModule,
        DropdownModule,
        TagModule,
        PaginatorModule,
        IconFieldModule,
        InputIconModule,
        Skeleton,
        KnobModule,
        FormsModule,
        RouterModule,
        SkeletonModule,
        RecentSalesWidget,
        RevenueOverViewWidget,
        SalesByCategoryWidget
    ],
    template: `
        <p-dropdown [options]="filterOptions" [(ngModel)]="selectedFilter" optionLabel="label" optionValue="value" placeholder="Filter" (onChange)="onFilterChange($event)" styleClass="w-40 mb-4"></p-dropdown>

        <!-- Main Content -->
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12 md:col-span-6 xl:col-span-3" *ngFor="let card of loading ? skeletonItems : dashboardCards" [routerLink]="!loading ? card.routerLink : null">
                <div class="card h-full">
                    <!-- Skeleton View -->
                    <ng-container *ngIf="loading; else cardContent">
                        <p-skeleton height="22px" width="65%"></p-skeleton>
                        <div class="mt-4">
                            <p-skeleton height="38px" width="40%"></p-skeleton>
                        </div>
                    </ng-container>

                    <!-- Actual Card Content -->
                    <ng-template #cardContent>
                        <span class="font-semibold text-lg flex items-center gap-2">
                            <i [class]="card.icon + ' text-2xl text-primary'"></i>
                            {{ card.label }}
                        </span>

                        <div class="flex justify-between items-start mt-4">
                            <div class="w-6/12">
                                <span class="text-4xl font-bold" [ngClass]="card.value < 0 ? 'text-red-600' : 'text-surface-900 dark:text-surface-0'"> Count- {{ card.value }} </span>
                            </div>
                        </div>
                    </ng-template>
                </div>
            </div>
            <div class="col-span-12 xl:col-span-4"></div>
            <div class="col-span-12 lg:col-span-4"></div>
            <!-- Recent Sales and Top Products -->
            <div class="col-span-12 xl:col-span-4"></div>
        </div>
        <div class="grid grid-cols-12 gap-8">
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
export class SaleMangerDashboard {
    @Input() filerby: any;
    public role: string = '';
    filterOptions = [
        { label: 'Today', value: 'TODAY' },
        { label: 'This Month', value: 'MONTH' },
        { label: 'Quarterly', value: 'QUARTER' },
        { label: 'Yearly', value: 'YEAR' }
    ];
    selectedFilter = 'MONTH'; // default value
    loading = true;
    skeletonItems = [1, 2, 3, 4];
    dashboardCards: any = [];
    products!: any[];
    constructor(
        private OnttopBarService: DashboardService,
        public authservice: AuthService
    ) {}

    ngOnInit(): void {
        const isUserRoleType: any = this.authservice.isLogIntType();

        this.role = isUserRoleType?.usertypecode;
        this.OnGettopBarCard(this.selectedFilter);
    }

    OnGettopBarCard(filerby: string) {
        this.loading = true; // Start Skeleton
        let apibody = {
            p_reporttype: 'CARDS',
            p_warehouse: '',
            p_period: filerby,
            p_category: null,
            p_item: null
        };
        this.OnttopBarService.GettopBarCard(apibody).subscribe({
            next: (res) => {
                const data = res?.data[0];
                this.dashboardCards = [
                    {
                        label: 'Total Item -  Sold & Return',
                        icon: 'pi pi-box',
                        value: data.total_items
                    },
                    {
                        label: 'Purchase',
                        icon: 'pi pi-shopping-cart',
                        value: data.total_purchase
                    },
                    {
                        label: 'Sale',
                        icon: 'pi pi-arrow-down-left',
                        value: data.total_sale
                    },
                    {
                        label: 'Return',
                        icon: 'pi pi-arrow-up',
                        value: data.total_return
                    }
                ];
                this.loading = false; // Stop Skeleton
            },

            error: () => {
                this.loading = false;
            }
        });
    }

    OnGetSales() {
        let apibody = {
            p_reporttype: 'LOWSTOCK',
            p_warehouse: '',
            p_period: '',
            p_category: null,
            p_item: null
        };
        this.OnttopBarService.GettopBarCard(apibody).subscribe({
            next: (res) => {
                console.log(res);
                const data = res.data;
                this.products = data;
                console.log(this.products);
            }
        });
    }
    onFilterChange(event: any) {
        this.OnGettopBarCard(event.value);
    }
}
