import { Routes } from '@angular/router';
import { StockInComponent } from './stock-in/stock-in.component';
import { AddinventoryComponent } from './addinventory/addinventory.component';
import { StockAdjustmentComponent } from './stock-adjustment/stock-adjustment.component';
import { TransactionComponent } from './transaction/transaction.component';
import { IndentComponent } from './indent/indent.component';

export default [
    { path: 'stock-in', component: StockInComponent },
    { path: 'addinventory', component: AddinventoryComponent },
    { path: 'stock-adjustment', component: StockAdjustmentComponent },
    { path: 'indent', component: IndentComponent },
    { path: 'transaction', component: TransactionComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
