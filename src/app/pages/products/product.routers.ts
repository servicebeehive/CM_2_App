import { Routes } from '@angular/router';
import { CreateproductComponent } from './createproduct/createproduct.component';
import { ProductcategoriesComponent } from './productcategories/productcategories.component';
import { ProductlistComponent } from './productlist/productlist.component';

export default [
    {path:'create',component:CreateproductComponent},
    {path:'list',component:ProductlistComponent},
    {path:'category',component:ProductcategoriesComponent},


    // {path:''}
    // { path: 'documentation', component: Documentation },
    // { path: 'crud', component: Crud },

    // { path: 'empty', component: Empty },
    // { path: 'invoice', component: Invoice },
    // { path: 'aboutus', component: AboutUs },
    // { path: 'help', component: Help },
    // { path: 'faq', component: Faq},
    // { path: 'contact', component: ContactUs},
    { path: '**', redirectTo: '/notfound' }
] as Routes;
