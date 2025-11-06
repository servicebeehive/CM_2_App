import { Routes } from "@angular/router";
import { ItemReportComponent } from "./item-report/item-report.component";
import { TransactionReportComponent } from "./transaction-report/transaction-report.component";
import { CreditNoteComponent } from "./credit-note/credit-note.component";

export default[
    {path:'item-report',component:ItemReportComponent},
    {path:'transaction-report',component:TransactionReportComponent},
    {path:'credit-note', component:CreditNoteComponent},
    {path:'**',redirectTo:'/notfound'}
] as Routes;
