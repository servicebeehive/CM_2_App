import { Routes } from '@angular/router';
import { AddinventoryComponent } from './addinventory/addinventory.component';
import { StockAdjustmentComponent } from './stock-adjustment/stock-adjustment.component';
import { TransactionComponent } from './transaction/transaction.component';
import { MaterialForcastingComponent } from './material-forcasting/material-forcasting.component';
import { WorkComponent } from './work/work.component';
import { PurchaseOrderComponent } from './purchase-order/purchase-order.component';
import { GrnComponent } from './grn/grn.component';
import { QualityInspectionComponent } from './quality-inspection/quality-inspection.component';
import { MaterialIssueComponent } from './material-issue/material-issue.component';
import { MaterialReturnComponent } from './material-return/material-return.component';
import { ProjectComponent } from './project/project.component';
import { StockInComponent } from './stock-in/stock-in.component';
import { AddItemConsComponent } from './add-item-cons/add-item-cons.component';

export default [
    { path: 'stock-in', component: StockInComponent },
    { path: 'addinventory', component: AddinventoryComponent },
    { path: 'add-item-cons', component: AddItemConsComponent },
    { path: 'stock-adjustment', component: StockAdjustmentComponent },
    { path: 'transaction', component: TransactionComponent },
    { path: 'material-forcasting', component: MaterialForcastingComponent },
    { path: 'work', component: WorkComponent },
    { path: 'purchase-order', component: PurchaseOrderComponent },
    { path: 'grn', component: GrnComponent },
    { path: 'quality-inspection', component: QualityInspectionComponent },
    { path: 'material-issue', component: MaterialIssueComponent },
    { path: 'material-return', component: MaterialReturnComponent },
    { path: 'project', component: ProjectComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
