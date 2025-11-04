import { Routes } from "@angular/router";
import { ItemReportComponent } from "./item-report/item-report.component";
import { SalesReportComponent } from "./sales-report/sales-report.component";

export default[
    {path:'item-report',component:ItemReportComponent},
    {path:'sales-report',component:SalesReportComponent},
    {path:'**',redirectTo:'/notfound'}
] as Routes;
