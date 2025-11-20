import { Routes } from "@angular/router";
import { ItemReportComponent } from "./item-report/item-report.component";
import { TransactionReportComponent } from "./transaction-report/transaction-report.component";
import { CreditNoteComponent } from "../pos/credit-note/credit-note.component";

export default[
    {path:'item-report',component:ItemReportComponent},
    {path:'transaction-report',component:TransactionReportComponent},
    {path:'**',redirectTo:'/notfound'}
] as Routes;
