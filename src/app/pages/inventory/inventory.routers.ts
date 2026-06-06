import { Routes } from '@angular/router';
import { StockInComponent } from './stock-in/stock-in.component';
import { AddinventoryComponent } from './addinventory/addinventory.component';
import { StockAdjustmentComponent } from './stock-adjustment/stock-adjustment.component';
import { TransactionComponent } from './transaction/transaction.component';
import { IndentComponent } from './indent/indent.component';
import { MaterialForcastingComponent } from './material-forcasting/material-forcasting.component';
import { WorkComponent } from './work/work.component';
import { PurchaseOrderComponent } from './purchase-order/purchase-order.component';
import { GrnComponent } from './grn/grn.component';

export default [
    { path: 'stock-in', component: StockInComponent },
    { path: 'addinventory', component: AddinventoryComponent },
    { path: 'stock-adjustment', component: StockAdjustmentComponent },
    { path: 'indent', component: IndentComponent },
    { path: 'transaction', component: TransactionComponent },
    { path: 'material-forcasting', component: MaterialForcastingComponent },
    { path: 'work', component: WorkComponent },
    { path: 'purchase-order', component: PurchaseOrderComponent },
    { path: 'grn', component: GrnComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
