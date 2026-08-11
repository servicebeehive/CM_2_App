import { Routes } from '@angular/router';
import { AddinventoryComponent } from './addinventory/addinventory.component';
import { StockAdjustmentComponent } from './stock-adjustment/stock-adjustment.component';
import { TransactionComponent } from './transaction/transaction.component';
import { GrnComponent } from './grn/grn.component';
import { ProjectComponent } from './project/project.component';
import { StockInComponent } from './stock-in/stock-in.component';
import { AddItemConsComponent } from './add-item-cons/add-item-cons.component';

export default [
    { path: 'stock-in', component: StockInComponent },
    { path: 'addinventory', component: AddinventoryComponent },
    { path: 'add-item-cons', component: AddItemConsComponent },
    { path: 'stock-adjustment', component: StockAdjustmentComponent },
    { path: 'transaction', component: TransactionComponent },  
    { path: 'grn', component: GrnComponent },
    { path: 'project', component: ProjectComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
