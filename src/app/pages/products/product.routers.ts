import { Routes } from '@angular/router';
import { ProductlistComponent } from './productlist/productlist.component';

export default [
    {path:'list',component:ProductlistComponent},
    { path: '**', redirectTo: '/notfound' }
] as Routes;
