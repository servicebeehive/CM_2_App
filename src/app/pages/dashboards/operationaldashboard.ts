import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-operational-dashboard',
    standalone: true,
    imports: [CommonModule, ChartModule, TableModule, ButtonModule],
    template: `
        <div class="dashboard-shell operational-dashboard">
            <header class="dashboard-header">
                <div class="header-left">
                    <div>
                        <span class="eyebrow">DAY-TO-DAY OPERATIONS</span>
                        <h1>Operational Dashboard</h1>
                        <p>Live purchasing, inventory and transaction monitoring</p>
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
                    <i class="pi pi-clock"></i>
                    <div class="kpi-text"><span>Pending MR</span><strong>7</strong><small>₹ 8,45,200</small></div>
                </article>
                <article class="kpi-card green">
                    <i class="pi pi-shopping-cart"></i>
                    <div class="kpi-text"><span>Pending PO</span><strong>5</strong><small>₹ 12,85,600</small></div>
                </article>
                <article class="kpi-card orange">
                    <i class="pi pi-inbox"></i>
                    <div class="kpi-text"><span>Pending GRN</span><strong>3</strong><small>₹ 6,72,400</small></div>
                </article>
                <article class="kpi-card purple">
                    <i class="pi pi-truck"></i>
                    <div class="kpi-text"><span>Pending Delivery</span><strong>6</strong><small>₹ 9,35,800</small></div>
                </article>
                <article class="kpi-card green">
                    <i class="pi pi-users"></i>
                    <div class="kpi-text"><span>Today's Issues</span><strong>24</strong><small>₹ 3,40,200</small></div>
                </article>
                <article class="kpi-card blue">
                    <i class="pi pi-file-check"></i>
                    <div class="kpi-text"><span>Today's Receipts</span><strong>18</strong><small>₹ 5,12,600</small></div>
                </article>
                <article class="kpi-card red">
                    <i class="pi pi-exclamation-triangle"></i>
                    <div class="kpi-text"><span>Low Stock Items</span><strong>8</strong><small>Needs attention</small></div>
                </article>
                <article class="kpi-card pink">
                    <i class="pi pi-calendar-times"></i>
                    <div class="kpi-text"><span>Items Expiry</span><strong>5</strong><small>Within 30 days</small></div>
                </article>
            </section>

            <!-- ROW 2: line chart beside table -->
            <section class="row-2">
                <div class="panel">
                    <div class="panel-title">
                        <h2>Material Forecast vs Actual</h2>
                        <span>Weekly trend</span>
                    </div>
                    <div class="chart-wrap line-wrap"><p-chart type="line" [data]="forecastData" [options]="lineOptions"></p-chart></div>
                </div>
                <div class="panel">
                    <div class="panel-title">
                        <h2>Recent Transactions</h2>
                        <a>View All</a>
                    </div>
                    <p-table [value]="transactions" styleClass="compact-table">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Reference</th>
                                <th>Amount</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-row>
                            <tr>
                                <td>{{ row.date }}</td>
                                <td>{{ row.type }}</td>
                                <td>{{ row.reference }}</td>
                                <td>₹ {{ row.amount | number }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </section>

            <!-- ROW 3: pie charts + remaining cards, one section, 3 per line -->
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
                        <h2>Stock Summary</h2>
                        <span>₹ 18,72,450</span>
                    </div>
                    <div class="chart-wrap donut-wrap"><p-chart type="doughnut" [data]="stockData" [options]="doughnutOptions"></p-chart></div>
                </div>
                <div class="panel">
                    <div class="panel-title">
                        <h2>Purchase Order Status</h2>
                        <span>32 total</span>
                    </div>
                    <div class="status-list">
                        <div><span>Approved</span><b class="bar approved" style="width:82%"></b><strong>12</strong></div>
                        <div><span>Pending Approval</span><b class="bar pending" style="width:48%"></b><strong>5</strong></div>
                        <div><span>Draft</span><b class="bar draft" style="width:34%"></b><strong>3</strong></div>
                        <div><span>Partially Received</span><b class="bar partial" style="width:60%"></b><strong>6</strong></div>
                        <div><span>Fully Received</span><b class="bar received" style="width:92%"></b><strong>18</strong></div>
                        <div><span>Cancelled</span><b class="bar cancelled" style="width:22%"></b><strong>2</strong></div>
                    </div>
                </div>
                <div class="panel">
                    <div class="panel-title">
                        <h2>Top Vendors by Purchase</h2>
                        <a>View All</a>
                    </div>
                    <div class="vendor-list">
                        <div *ngFor="let vendor of vendors">
                            <span>{{ vendor.name }}</span
                            ><b>{{ vendor.percent }}%</b><strong>₹ {{ vendor.amount | number }}</strong>
                        </div>
                    </div>
                </div>
                <div class="panel">
                    <div class="panel-title">
                        <h2>Stock Alerts</h2>
                        <a>View All</a>
                    </div>
                    <div class="alert-row danger">
                        <i class="pi pi-times-circle"></i><span><b>Low stock - 5 items</b><small>Cement, Paint, Plywood etc.</small></span>
                    </div>
                    <div class="alert-row warning">
                        <i class="pi pi-exclamation-circle"></i><span><b>Zero stock - 3 items</b><small>Glass, Safety Helmets etc.</small></span>
                    </div>
                    <div class="alert-row danger">
                        <i class="pi pi-ban"></i><span><b>Negative stock - 1 item</b><small>Flooring Tiles</small></span>
                    </div>
                </div>
                <div class="panel quick-actions">
                    <div class="panel-title"><h2>Quick Actions</h2></div>
                    <button><i class="pi pi-file-plus"></i>Create MR</button
                    ><button><i class="pi pi-shopping-cart"></i>Create PO</button
                    ><button><i class="pi pi-eye"></i>View Stock</button
                    ><button><i class="pi pi-chart-bar"></i>View Reports</button>
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
                color: #168b9d;
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
                gap: 0.55rem;
                color: #607086;
                font-size: 0.8rem;
            }
            .header-meta i {
                color: #1677df;
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
                min-height: 92px;
            }
            .kpi-card > i {
                display: grid;
                place-items: center;
                width: 2rem;
                height: 2rem;
                border-radius: 8px;
                color: #fff;
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
            }
            .kpi-card small {
                color: #8794a7;
                font-size: 0.62rem;
            }
            .blue i {
                background: #287be0;
            }
            .green i {
                background: #19a66a;
            }
            .orange i {
                background: #f27832;
            }
            .purple i {
                background: #805ad5;
            }
            .red i {
                background: #e34b55;
            }
            .pink i {
                background: #e65383;
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
                margin-bottom: 0.65rem;
            }
            h2 {
                font-size: 0.8rem;
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

            /* ---------- ROW 2: line chart + table ---------- */
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
            .line-wrap {
                height: 320px;
            }
            .donut-wrap {
                height: 200px;
            }
            ::ng-deep .chart-wrap canvas {
                display: block;
                max-width: 100% !important;
                max-height: 100% !important;
            }

            /* ---------- ROW 3: pie charts + cards, 3 per line ---------- */
            .row-3 {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 1rem;
            }

            .status-list > div {
                display: grid;
                grid-template-columns: 7.5rem 1fr 1.5rem;
                gap: 0.45rem;
                align-items: center;
                margin: 0.7rem 0;
                font-size: 0.65rem;
            }
            .status-list span {
                color: #728197;
            }
            .bar {
                height: 8px;
                border-radius: 5px;
                display: block;
                background: #28a86b;
            }
            .pending {
                background: #f2ae16;
            }
            .draft {
                background: #8b5cf6;
            }
            .partial {
                background: #7070de;
            }
            .received {
                background: #17a8cc;
            }
            .cancelled {
                background: #e34b55;
            }
            .status-list strong {
                text-align: right;
            }

            .compact-table {
                font-size: 0.68rem;
            }
            .compact-table th {
                font-size: 0.62rem;
                color: #728197;
            }
            .compact-table td,
            .compact-table th {
                padding: 0.48rem 0.3rem;
            }
            .vendor-list > div {
                display: grid;
                grid-template-columns: 1fr 2rem 5rem;
                gap: 0.35rem;
                padding: 0.58rem 0;
                border-bottom: 1px solid #edf1f5;
                font-size: 0.68rem;
            }
            .vendor-list b {
                color: #2980d9;
            }
            .vendor-list strong {
                text-align: right;
                color: #728197;
                font-size: 0.64rem;
            }
            .alert-row {
                display: flex;
                gap: 0.65rem;
                padding: 0.68rem 0;
                border-bottom: 1px solid #edf1f5;
                font-size: 0.68rem;
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
            .quick-actions button {
                width: 100%;
                border: 1px solid #e3eaf2;
                background: #fff;
                border-radius: 7px;
                text-align: left;
                padding: 0.6rem;
                margin: 0.2rem 0;
                color: #52647a;
                font-size: 0.7rem;
            }
            .quick-actions button i {
                margin-right: 0.55rem;
                color: #287be0;
            }

            @media (max-width: 1300px) {
                .kpi-grid {
                    grid-template-columns: repeat(4, 1fr);
                }
                .row-2 {
                    grid-template-columns: 1fr;
                }
                .row-3 {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            @media (max-width: 900px) {
                .kpi-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                .row-3 {
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
export class OperationalDashboard {
       constructor(private router: Router) {}
    forecastData = {
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
        datasets: [
            { label: 'Budget', borderColor: '#287be0', backgroundColor: '#287be022', fill: true, tension: 0.4, data: [38, 42, 49, 55, 50, 61, 70, 64, 77, 81, 86, 92] },
            { label: 'Actual', borderColor: '#19a66a', backgroundColor: '#19a66a22', fill: true, tension: 0.4, data: [25, 32, 39, 45, 42, 52, 57, 54, 66, 71, 75, 82] }
        ]
    };
    projectData = { labels: ['Project A', 'Project B', 'Project C', 'Project D', 'Others'], datasets: [{ data: [32, 24, 18, 14, 12], backgroundColor: ['#287be0', '#19a66a', '#f2ae16', '#f27832', '#708399'] }] };
    stockData = { labels: ['Available', 'Low Stock', 'Zero Stock', 'Negative Stock', 'Blocked'], datasets: [{ data: [68, 18, 5, 2, 7], backgroundColor: ['#287be0', '#19a66a', '#f2ae16', '#f27832', '#eb5260'] }] };
    lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 8, font: { size: 10 } } } },
        scales: { y: { beginAtZero: true, grid: { color: '#edf1f5' } }, x: { grid: { color: '#edf1f5' } } }
    };
    doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'right', labels: { boxWidth: 8, font: { size: 9 } } } }
    };
    transactions = [
        { date: '30-Sep-2026', type: 'Purchase', reference: 'PO-00024', amount: 1248600 },
        { date: '29-Sep-2026', type: 'Issue', reference: 'MIN-00023', amount: 68400 },
        { date: '29-Sep-2026', type: 'PO', reference: 'PO-00034', amount: 121850 },
        { date: '28-Sep-2026', type: 'GRN', reference: 'GRN-00014', amount: 345200 }
    ];
    vendors = [
        { name: 'ABC Traders', percent: 28, amount: 1466929 },
        { name: 'Global Supplies', percent: 22, amount: 1155721 },
        { name: 'Metro Traders', percent: 18, amount: 943860 },
        { name: 'Sunrise Co.', percent: 16, amount: 839400 },
        { name: 'Others', percent: 16, amount: 841500 }
    ];

    back(): void {
        this.router.navigate(['/layout/dashboard']);
    }
}