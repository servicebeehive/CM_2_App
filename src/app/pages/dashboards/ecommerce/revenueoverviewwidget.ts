import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '@/layout/service/layout.service';

interface Week {
    label: string;
    value: number;
    data: number[][];
}

@Component({
    standalone: true,
    selector: 'app-revenue-overview-widget',
    imports: [SelectModule, ChartModule, FormsModule],
    template: ` <div class="card h-full">
        <div class="flex items-start justify-between mb-12">
            <span
                class="text-surface-900 dark:text-surface-0 text-xl font-semibold"
                >Trend Sale</span
            >
            <p-select
                [options]="month"
                [(ngModel)]="selectedMonth"
                class="w-40"
                optionLabel="label"
                (onChange)="onWeekChange()"
            ></p-select>
        </div>
        <p-chart
            type="bar"
            height="300"
            [data]="barData"
            [options]="barOptions"
        ></p-chart>
    </div>`,
})
export class RevenueOverViewWidget {
    month: Week[] = [
        {
            label: 'Last Month',
            value: 0,
            data: [
                [65, 59, 80, 81, 56, 55, 40],
                [28, 48, 40, 19, 86, 27, 90],
            ],
        },
        {
            label: 'This Month',
            value: 1,
            data: [
                [35, 19, 40, 61, 16, 55, 30],
                [48, 78, 10, 29, 76, 77, 10],
            ],
        },
    ];

    selectedMonth: Week = this.month[0];

    barData: any;

    barOptions: any;

    subscription: Subscription;

    constructor(private layoutService: LayoutService) {
        this.subscription = this.layoutService.configUpdate$
            .pipe(debounceTime(50))
            .subscribe(() => {
                this.initChart();
            });
    }

    ngOnInit() {
        this.initChart();
        this.selectedMonth = this.month[0];
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue(
            '--text-color-secondary',
        );
        const surfaceBorder =
            documentStyle.getPropertyValue('--surface-border');

        this.barData = {
            labels: ['JAN','FEB','MAR','JUN','JULY','AUG','SEP','OCT','NOV','DEC'],
            datasets: [
                {
                    label: 'Revenue',
                    backgroundColor:
                        documentStyle.getPropertyValue('--p-primary-500'),
                    barThickness: 12,
                    borderRadius: 12,
                    data: this.selectedMonth?.data[0],
                },
                {
                    label: 'Profit',
                    backgroundColor:
                        documentStyle.getPropertyValue('--p-primary-200'),
                    barThickness: 12,
                    borderRadius: 12,
                    data: this.selectedMonth?.data[1],
                },
            ],
        };

        this.barOptions = {
            animation: {
                duration: 0,
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        font: {
                            weight: 700,
                        },
                        padding: 28,
                    },
                    position: 'bottom',
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            weight: 500,
                        },
                    },
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false,
                    },
                },
            },
        };
    }

    onWeekChange() {
        let newBarData = { ...this.barData };
        newBarData.datasets[0].data = this.selectedMonth.data[0];
        newBarData.datasets[1].data = this.selectedMonth.data[1];
        this.barData = newBarData;
        this.initChart();
    }
}
