import { Routes } from '@angular/router';
import { ItemReportComponent } from './item-report/item-report.component';
import { TransactionReportComponent } from './transaction-report/transaction-report.component';
import { CreditNoteComponent } from '../pos/credit-note/credit-note.component';
import { BalanceSheetComponent } from './balance-sheet/balance-sheet.component';

export default [
    { path: 'item-report', component: ItemReportComponent },
    { path: 'transaction-report', component: TransactionReportComponent },
    { path: 'balance-sheet', component: BalanceSheetComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
