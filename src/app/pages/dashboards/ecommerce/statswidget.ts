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
    imports: [CommonModule, KnobModule, FormsModule, RouterModule, SkeletonModule],
    template: `
        <div class="col-span-12">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

                <ng-container *ngFor="let card of loading ? skeletonItems : dashboardCards">
                    <div class="col-span-1" [routerLink]="!loading ? card.routerLink : null">
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
                                <div class="mt-4">
                                    <span class="text-4xl font-bold"
                                          [ngClass]="(card.value ?? 0) < 0 ? 'text-red-600' : 'text-surface-900 dark:text-surface-0'">
                                        ₹{{ (card.value ?? 0) | number:'1.0-0' }}
                                    </span>
                                </div>
                            </ng-template>

                        </div>
                    </div>
                </ng-container>

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
    skeletonItems = [1, 2, 3, 4, 5];
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
        this.loading = true;
        const apibody = {
            p_reporttype: 'CARDS',
            p_warehouse: '',
            p_period: filerby,
            p_category: null,
            p_item: null
        };
        this.OnttopBarService.GettopBarCard(apibody).subscribe({
            next: (res) => {
                const data = res.data[0];
                this.dashboardCards = [
                    {
                        label: 'Total Cost',
                        icon: 'pi pi-box',
                        value: data.totalpurchase ?? 0
                    },
                    {
                        label: 'Total Sale',
                        icon: 'pi pi-shopping-cart',
                        value: data.totalsale ?? 0
                    },
                    {
                        label: 'Total Return',
                        icon: 'pi pi-arrow-down-left',
                        value: data.totalreturn ?? 0
                    },
                    {
                        label: 'Misc / Write-off',
                        icon: 'pi pi-file-edit',
                        value: data.totalmiscwrite ?? 0
                    },
                    {
                        label: 'Total Profit',
                        icon: 'pi pi-arrow-up',
                        value: data.profit ?? 0
                    }
                ];
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }
}