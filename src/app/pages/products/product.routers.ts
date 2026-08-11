import { Routes } from '@angular/router';
import { ProductlistComponent } from './productlist/productlist.component';
import { ProductListConsComponent } from './product-list-cons/product-list-cons.component';

export default [
    {path:'productlist',component:ProductlistComponent},
    {path: 'product-list-cons', component: ProductListConsComponent},
    { path: '**', redirectTo: '/notfound' }
] as Routes;
