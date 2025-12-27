import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardService } from '@/core/services/dashboard.service';
import { AuthService } from '@/core/services/auth.service';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [
        CommonModule,
        KnobModule,
        FormsModule,
        RouterModule,
        SkeletonModule
    ],
    template: `
    <div 
        class="col-span-12 md:col-span-6 xl:col-span-3"
        *ngFor="let card of (loading ? skeletonItems : dashboardCards)"
        [routerLink]="!loading ? card.routerLink : null"
        style="cursor: pointer;"
    >
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
                        <span 
                            class="text-4xl font-bold"
                            [ngClass]="card.value < 0 ? 'text-red-600' : 'text-surface-900 dark:text-surface-0'"
                        >
                            ₹{{ card.value }}
                        </span>
                    </div>
                </div>
            </ng-template>

        </div>
    </div>
    `,
    host: {
        '[style.display]': '"contents"'
    }
})
export class StatsWidget implements OnInit, OnChanges {

    @Input() filerby: any;

    public authService = inject(AuthService);

    loading = true;

    skeletonItems = [1, 2, 3, 4];

    dashboardCards: any = [];

    constructor(private OnttopBarService: DashboardService) {}

    ngOnInit(): void {
        this.OnGettopBarCard(this.filerby);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['filerby']) {
            const period = changes['filerby'].currentValue;
            this.OnGettopBarCard(period);
        }
    }

    OnGettopBarCard(filerby: string) {

        this.loading = true; // Start Skeleton

        let apibody = {
            p_reporttype: "CARDS",
            p_warehouse: "",
            p_period: filerby,
            p_category: null,
            p_item: null,
        };

        this.OnttopBarService.GettopBarCard(apibody).subscribe({
            next: (res) => {
                const data = res.data[0];

                this.dashboardCards = [
                    {
                        label: 'Total Cost',
                        icon: 'pi pi-box',
                        value: data.totalpurchase,
                    },
                    {
                        label: 'Total Sale',
                        icon: 'pi pi-shopping-cart',
                        value: data.totalsale,
                    },
                    {
                        label: 'Total Return',
                        icon: 'pi pi-arrow-down-left',
                        value: data.totalreturn,
                    },
                    {
                        label: 'Total Profit',
                        icon: 'pi pi-arrow-up',
                        value: data.profit,
                    },
                ];

                this.loading = false; // Stop Skeleton
            },

            error: () => {
                this.loading = false;
            }
        });
    }
}
