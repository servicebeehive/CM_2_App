import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '@/layout/service/layout.service';
import { DashboardService } from '@/core/services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-sales-by-category-widget',
    imports: [ChartModule],
    template: `
        <div class="card h-full">
            <div class="flex items-start justify-between mb-4">
                <span class="text-surface-900 dark:text-surface-0 text-xl font-semibold">
                    Sale Trend
                </span>
            </div>

            <p-chart
                type="bar"
                height="300"
                [data]="barData"
                [options]="barOptions">
            </p-chart>
        </div>
    `,
})
export class SalesByCategoryWidget implements OnInit, OnDestroy {

    barData: any;
    barOptions: any;

    months: string[] = [];
    revenues: number[] = [];
    profits: number[] = [];

    subscription!: Subscription;

    constructor(
        private layoutService: LayoutService,
        private dashboardService: DashboardService
    ) {
        this.subscription = this.layoutService.configUpdate$
            .pipe(debounceTime(50))
            .subscribe(() => {
                this.initChart();
            });
    }

    ngOnInit(): void {
        this.getGraphData();
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    // 🔹 API CALL
    getGraphData(): void {
        const apiBody = {
            p_reporttype: 'GRAPH',
            p_warehouse: '',
            p_period: '',
            p_category: null,
            p_item: null,
        };

        this.dashboardService.GettopBarCard(apiBody).subscribe({
            next: (res: any) => {
                const data = res?.data ?? [];

                // 🔹 Transform API response
                this.months = data.map((item: any) =>
                    new Date(item.month + '-01').toLocaleString('en', { month: 'short' })
                );

                this.revenues = data.map((item: any) => item.revenue ?? 0);
                this.profits = data.map((item: any) => item.profit ?? 0);

                this.initChart();
            },
            error: (err) => {
                console.error('Graph API error', err);
            },
        });
    }

    // 🔹 CHART CONFIG
    initChart(): void {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.barData = {
            labels: this.months,
            datasets: [
                {
                    label: 'Revenue',
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                    borderRadius: 10,
                    barThickness: 14,
                    data: this.revenues,
                },
                {
                    label: 'Profit',
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                    borderRadius: 10,
                    barThickness: 14,
                    data: this.profits,
                },
            ],
        };

        this.barOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        font: {
                            weight: 'bold',
                        },
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) =>
                            `${context.dataset.label}: ₹${context.raw}`,
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        display: false,
                    },
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        color: surfaceBorder,
                    },
                },
            },
        };
    }
}
