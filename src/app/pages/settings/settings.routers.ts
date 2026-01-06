import { Routes } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { UserCreate } from '../user-management/usercreate';
import { NewPassword } from '../user-management/changepassword';
import { CategoryFormateComponent } from './category-format/category-formate.component';
import { CustomerFormComponent } from './customer-form/customer-form.component';
import { TaxFormComponent } from './tax-form/tax-form.component';
import { UomMasterComponent } from './uom-master/uom-master.component';
import { SupplierMasterComponent } from './supplier-master/supplier-master.component';
import { ConfigurationComponent } from './configuration/configuration.component';

export default [
    { path: 'user-management', component: UserManagementComponent },
    { path: 'category-formate', component: CategoryFormateComponent },
    { path: 'customer-form', component: CustomerFormComponent },
    { path: 'tax-form', component: TaxFormComponent },
    { path: 'profile', component: UserCreate },
    { path: 'changepassword', component: NewPassword },
    { path: 'uom-master', component: UomMasterComponent },
    { path: 'supplier-master', component: SupplierMasterComponent },
    { path: 'configuration', component: ConfigurationComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
