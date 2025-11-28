import { Routes } from "@angular/router";
import { SalesComponent } from "./sales/sales.component";
import { ReturnComponent } from "./return/return.component";
import { ReplaceComponent } from "./replace/replace.component";
import { CreditNoteComponent } from "./credit-note/credit-note.component";

export default[
{path: 'sales', component:SalesComponent},
{path:'return', component:ReturnComponent},
{path:'replace', component:ReplaceComponent},
{path:'credit-note', component:CreditNoteComponent},
 { path: '**', redirectTo: '/notfound' }
] as Routes;