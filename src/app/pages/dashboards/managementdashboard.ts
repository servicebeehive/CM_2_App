import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-management-dashboard',
    standalone: true,
    imports: [CommonModule, ChartModule, TableModule, TagModule, ButtonModule],
    template: `
        <div class="dashboard-shell management-dashboard">
            <header class="dashboard-header">
                <div class="header-left">
                    <div>
                        <span class="eyebrow">EXECUTIVE OVERVIEW</span>
                        <h1>Management Dashboard</h1>
                        <p>Portfolio performance and purchasing intelligence</p>
                    </div>
                </div>
                 <div class="header-right">
        <div class="header-meta">
            <i class="pi pi-calendar"></i><span>Date Range<br /><strong>01 Sep - 30 Sep 2026</strong></span
            ><i class="pi pi-user"></i><span>Site Manager<br /><strong>Operations</strong></span>
        </div>
        <button pButton type="button" icon="pi pi-arrow-left" label="Back" class="p-button-warning back-btn" (click)="back()"></button>
    </div>
            </header>

            <!-- ROW 1: all 8 KPI cards in one line -->
            <section class="kpi-grid">
                <article class="kpi-card blue">
                    <i class="pi pi-chart-line"></i>
                    <div class="kpi-text">
                        <span>Total Sites</span>
                        <strong>12</strong>
                        <small><b>+2</b> new</small>
                    </div>
                </article>
                <article class="kpi-card green">
                    <i class="pi pi-building"></i>
                    <div class="kpi-text">
                        <span>Total Projects</span>
                        <strong>8</strong>
                        <small><b>+1</b> new</small>
                    </div>
                </article>
                <article class="kpi-card purple">
                    <i class="pi pi-users"></i>
                    <div class="kpi-text">
                        <span>Total Vendors</span>
                        <strong>24</strong>
                        <small><b>+3</b> new</small>
                    </div>
                </article>
                <article class="kpi-card orange">
                    <i class="pi pi-wallet"></i>
                    <div class="kpi-text">
                        <span>Purchase Value</span>
                        <strong>₹ 52.48L</strong>
                        <small><b>+18%</b> MoM</small>
                    </div>
                </article>
                <article class="kpi-card cyan">
                    <i class="pi pi-box"></i>
                    <div class="kpi-text">
                        <span>Material Forecast</span>
                        <strong>₹ 75,000</strong>
                        <small>Budget</small>
                    </div>
                </article>
                <article class="kpi-card teal">
                    <i class="pi pi-shopping-cart"></i>
                    <div class="kpi-text">
                        <span>Actual Purchased</span>
                        <strong>₹ 68.40L</strong>
                        <small>91% of budget</small>
                    </div>
                </article>
                <article class="kpi-card amber">
                    <i class="pi pi-clock"></i>
                    <div class="kpi-text">
                        <span>Outstanding PO</span>
                        <strong>₹ 12.85L</strong>
                        <small>Needs attention</small>
                    </div>
                </article>
                <article class="kpi-card slate">
                    <i class="pi pi-database"></i>
                    <div class="kpi-text">
                        <span>Stock Value</span>
                        <strong>₹ 18.72L</strong>
                        <small>Current</small>
                    </div>
                </article>
            </section>

            <!-- ROW 2: bar chart beside table -->
            <section class="row-2">
                <div class="panel">
                    <div class="panel-title">
                        <h2>Material Forecast vs Actual</h2>
                        <span>Budget <b class="dot blue-dot"></b> Actual <b class="dot green-dot"></b></span>
                    </div>
                    <div class="chart-wrap bar-wrap"><p-chart type="bar" [data]="forecastData" [options]="barOptions"></p-chart></div>
                </div>
                <div class="panel">
                    <div class="panel-title">
                        <h2>Top 5 Purchased Items</h2>
                        <a>View All</a>
                    </div>
                    <p-table [value]="items" styleClass="compact-table" class="p-datatable-gridlines">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Item</th>
                                <th>Category</th>
                                <th>Qty</th>
                                <th>Amount</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-row>
                            <tr>
                                <td>{{ row.item }}</td>
                                <td>{{ row.category }}</td>
                                <td>{{ row.qty | number }}</td>
                                <td>₹ {{ row.amount | number }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </section>

            <!-- ROW 3: 3 doughnuts + 2 cards in one line -->
            <section class="row-3">
                <div class="panel">
                    <div class="panel-title">
                        <h2>Purchase by Project</h2>
                        <span>₹ 52,48,730</span>
                    </div>
                    <div class="chart-wrap donut-wrap"><p-chart type="doughnut" [data]="projectData" [options]="doughnutOptions"></p-chart></div>
                </div>
                <div class="panel">
                    <div class="panel-title">
                        <h2>Purchase by Vendor</h2>
                        <span>Monthly split</span>
                    </div>
                    <div class="chart-wrap donut-wrap"><p-chart type="doughnut" [data]="vendorData" [options]="doughnutOptions"></p-chart></div>
                </div>
                <div class="panel">
                    <div class="panel-title">
                        <h2>Stock Status</h2>
                        <span>₹ 18,72,450</span>
                    </div>
                    <div class="chart-wrap donut-wrap"><p-chart type="doughnut" [data]="stockData" [options]="doughnutOptions"></p-chart></div>
                </div>

                <div class="panel">
                    <div class="panel-title">
                        <h2>Pending Approvals</h2>
                        <a>View All</a>
                    </div>
                    <div class="approval-list">
                        <div *ngFor="let approval of approvals">
                            <i class="pi" [ngClass]="approval.icon"></i><span>{{ approval.label }}</span
                            ><strong>{{ approval.count }}</strong
                            ><b>₹ {{ approval.amount | number }}</b>
                        </div>
                    </div>
                </div>
                <div class="panel alerts">
                    <div class="panel-title">
                        <h2>Alerts & Highlights</h2>
                        <a>View All</a>
                    </div>
                    <div class="alert-row danger">
                        <i class="pi pi-exclamation-circle"></i><span><b>POs overdue for delivery</b><small>2 POs delayed this month</small></span>
                    </div>
                    <div class="alert-row warning">
                        <i class="pi pi-exclamation-triangle"></i><span><b>Items below minimum stock</b><small>5 requisitions need review</small></span>
                    </div>
                    <div class="alert-row info">
                        <i class="pi pi-info-circle"></i><span><b>Stock value increased by 10%</b><small>Compared with last month</small></span>
                    </div>
                </div>
            </section>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
            }
            .dashboard-shell {
                color: #26364a;
            }
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1.25rem;
            }
            .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;   
    margin-top: 45px;
}
            .header-left {
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
            }
            .back-btn {
                margin-top: 0.15rem;
                color: #52647a;
                white-space: nowrap;
            }
            .eyebrow {
                color: #3b82f6;
                font-size: 0.68rem;
                font-weight: 800;
                letter-spacing: 0.12em;
            }
            h1 {
                margin: 0.25rem 0 0.15rem;
                font-size: 1.75rem;
                font-weight: 800;
            }
            .dashboard-header p {
                margin: 0;
                color: #718096;
            }
            .header-meta {
                display: flex;
                align-items: center;
                gap: 0.55rem;
                color: #607086;
                font-size: 0.7rem;
                text-align: left;
            }
            .header-meta i {
                color: #1d5fd1;
                font-size: 1rem;
                margin-left: 0.8rem;
            }
            .header-meta strong {
                color: #26364a;
            }

            /* ---------- ROW 1: KPI cards, all 8 in one line ---------- */
            .kpi-grid {
                display: grid;
                grid-template-columns: repeat(8, 1fr);
                gap: 0.7rem;
                margin-bottom: 1rem;
            }
            .kpi-card {
                padding: 0.85rem 0.75rem;
                border: 1px solid #e3eaf2;
                border-radius: 10px;
                background: #fff;
                box-shadow: 0 4px 16px #20344d08;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
                min-height: 100px;
            }
            .kpi-card > i {
                display: grid;
                place-items: center;
                width: 2rem;
                height: 2rem;
                border-radius: 8px;
                color: white;
                flex-shrink: 0;
            }
            .kpi-text {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .kpi-card span {
                display: block;
                font-size: 0.63rem;
                color: #6b7a90;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .kpi-card strong {
                display: block;
                margin: 0.15rem 0;
                font-size: 1.05rem;
                color: #24344b;
                white-space: nowrap;
            }
            .kpi-card small {
                color: #8794a7;
                font-size: 0.62rem;
            }
            .kpi-card small b {
                color: #18a66a;
            }
            .blue i,
            .blue-dot {
                background: #1677df;
            }
            .green i {
                background: #19a66a;
            }
            .purple i {
                background: #8b5cf6;
            }
            .orange i {
                background: #f97316;
            }
            .cyan i {
                background: #159bd0;
            }
            .teal i {
                background: #0d9488;
            }
            .amber i {
                background: #ed9b15;
            }
            .slate i {
                background: #536b83;
            }

            /* ---------- shared panel look ---------- */
            .panel {
                background: #fff;
                border: 1px solid #e3eaf2;
                border-radius: 10px;
                padding: 1rem;
                box-shadow: 0 4px 16px #20344d08;
                min-width: 0;
                overflow: hidden;
            }
            .panel-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            h2 {
                font-size: 0.82rem;
                margin: 0;
                color: #34465d;
            }
            .panel-title span,
            .panel-title a {
                color: #728197;
                font-size: 0.65rem;
            }
            .panel-title a {
                color: #2672d8;
                font-weight: 700;
            }
            .dot {
                display: inline-block;
                width: 7px;
                height: 7px;
                border-radius: 50%;
                margin: 0 0.2rem 0 0.45rem;
            }
            .green-dot {
                background: #19a66a;
            }

            /* ---------- ROW 2: bar chart + table ---------- */
            .row-2 {
                display: grid;
                grid-template-columns: 1.4fr 1fr;
                gap: 1rem;
                margin-bottom: 1rem;
                align-items: stretch;
            }
            .chart-wrap {
                position: relative;
                width: 100%;
            }
            .bar-wrap {
                height: 250px;
            }
            .donut-wrap {
                height: 220px;
            }
            ::ng-deep .chart-wrap canvas {
                display: block;
                max-width: 100% !important;
                max-height: 100% !important;
            }

            /* ---------- ROW 3: 3 doughnuts + 2 cards in one line ---------- */
            .row-3 {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .compact-table {
                font-size: 0.7rem;
            }
            .compact-table th {
                color: #728197;
                font-size: 0.64rem;
            }
            .compact-table td,
            .compact-table th {
                padding: 0.5rem 0.35rem;
            }
            .approval-list > div {
                display: grid;
                grid-template-columns: 1.5rem 1fr 2rem 5rem;
                gap: 0.4rem;
                align-items: center;
                padding: 0.62rem 0;
                border-bottom: 1px solid #edf1f5;
                font-size: 0.7rem;
            }
            .approval-list i {
                color: #2c7bdc;
            }
            .approval-list strong {
                color: #35465c;
            }
            .approval-list b {
                text-align: right;
                font-size: 0.65rem;
                color: #728197;
            }
            .alert-row {
                display: flex;
                gap: 0.65rem;
                padding: 0.7rem 0;
                border-bottom: 1px solid #edf1f5;
                font-size: 0.7rem;
            }
            .alert-row i {
                font-size: 1rem;
            }
            .alert-row span {
                display: grid;
                gap: 0.15rem;
            }
            .alert-row small {
                color: #8491a3;
            }
            .danger i {
                color: #e34b55;
            }
            .warning i {
                color: #ed9b15;
            }
            .info i {
                color: #2780d9;
            }

            @media (max-width: 1300px) {
                .kpi-grid {
                    grid-template-columns: repeat(4, 1fr);
                }
                .row-2 {
                    grid-template-columns: 1fr;
                }
            }
            @media (max-width: 900px) {
                .kpi-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                .row-3,
                .row-4 {
                    grid-template-columns: 1fr;
                }
            }
            @media (max-width: 700px) {
                .dashboard-header {
                    display: block;
                }
                .header-meta {
                    margin-top: 1rem;
                    flex-wrap: wrap;
                }
                .kpi-grid {
                    grid-template-columns: 1fr;
                }
            }
        `
    ]
})
export class ManagementDashboard {
    
    constructor(private router: Router) {}
    forecastData = {
        labels: ['Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26'],
        datasets: [
            { label: 'Budget', backgroundColor: '#287be0', data: [62, 70, 66, 61, 78, 82] },
            { label: 'Actual', backgroundColor: '#27a86b', data: [48, 59, 54, 57, 64, 68] }
        ]
    };
    projectData = { labels: ['Project A', 'Project B', 'Project C', 'Project D', 'Others'], datasets: [{ data: [32, 24, 18, 14, 12], backgroundColor: ['#287be0', '#27a86b', '#f2ae16', '#f27832', '#708399'] }] };
    vendorData = { labels: ['ABC Traders', 'Global Supplies', 'Metro Traders', 'Sunrise Co.', 'Others'], datasets: [{ data: [28, 22, 18, 16, 16], backgroundColor: ['#287be0', '#27a86b', '#f2ae16', '#805ad5', '#708399'] }] };
    stockData = { labels: ['Available', 'Low Stock', 'Zero Stock', 'Negative Stock', 'Blocked'], datasets: [{ data: [68, 18, 5, 2, 7], backgroundColor: ['#287be0', '#27a86b', '#f2ae16', '#f27832', '#eb5260'] }] };
    barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 8, font: { size: 10 } } } },
        scales: { y: { beginAtZero: true, grid: { color: '#edf1f5' } }, x: { grid: { display: false } } }
    };

    doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        layout: { padding: 0 },
        plugins: { legend: { position: 'right', labels: { boxWidth: 8, font: { size: 9 } } } }
    };
    items = [
        { rank: 1, item: 'Cement', category: 'Building Material', qty: 5200, amount: 1248600 },
        { rank: 2, item: 'Steel Rod', category: 'Steel', qty: 3450, amount: 1032500 },
        { rank: 3, item: 'Tiles', category: 'Finishing', qty: 2800, amount: 896400 },
        { rank: 4, item: 'Paint', category: 'Finishing', qty: 1200, amount: 576300 },
        { rank: 5, item: 'Electrical Cable', category: 'Electrical', qty: 1000, amount: 421850 }
    ];
    approvals = [
        { label: 'Purchase Requests', count: 3, amount: 846500, icon: 'pi-file-edit' },
        { label: 'MR / Indent', count: 5, amount: 1260350, icon: 'pi-file' },
        { label: 'PO', count: 2, amount: 628900, icon: 'pi-shopping-cart' },
        { label: 'Vendor Comparison', count: 4, amount: 915600, icon: 'pi-users' },
        { label: 'GRN', count: 1, amount: 340200, icon: 'pi-inbox' }
    ];

    back(): void {
        this.router.navigate(['/layout/dashboard']);
    }
}