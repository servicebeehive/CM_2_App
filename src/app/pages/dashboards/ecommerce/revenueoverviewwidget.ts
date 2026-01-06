import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputIconModule } from 'primeng/inputicon';
import { FilterMatchMode } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { AuthService } from '@/core/services/auth.service';
import { DashboardService } from '@/core/services/dashboard.service';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';

interface Week {
    label: string;
    value: number;
    data: number[][];
}

@Component({
    standalone: true,
    selector: 'app-revenue-overview-widget',
    imports: [CommonModule, FormsModule, CardModule, TableModule, TagModule, PaginatorModule, IconFieldModule, InputIconModule],

    template: `
        <p-card class="mb-4 min-h-[444px]">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4 md:mb-0">Low Stock</div>
                <div class="inline-flex items-center"></div>
            </div>

            <div class="min-h-[400px]">
                <p-table #dt [rows]="5" [value]="products" [paginator]="true" responsiveLayout="scroll">
                    <ng-template #header>
                        <tr>
                            <th>Item</th>
                            <th>Category</th>
                            <th>Current Stock</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-product>
                        <tr>
                            <td style="width: 50%; min-width: 7rem;">
                                {{ product.itemcombine }}
                            </td>
                            <td style="width: 40%; min-width: 7rem;">
                                {{ product.categoryname }}
                            </td>
                            <td style="width:10%; min-width: 7rem;">
                                {{ product.currentstock }}
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </p-card>
    `
})
export class RevenueOverViewWidget implements OnInit {
    public authService = inject(AuthService);
    products!: any[];
    filterOptions: any[] = [{ label: 'Out of Stock' }, { label: 'Low of Stock' }, { label: 'Most Salable' }, { label: 'Non-Active' }];
    filter: string = '';
    @ViewChild('dt') dt!: Table;
    constructor(public OnttopBarService: DashboardService) {}
    ngOnInit() {
        this.OnGetSales();
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
}
