import { Routes } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { UserCreate } from '../user-management/usercreate';
import { NewPassword } from '../user-management/changepassword';
import { CategoryFormateComponent } from './category-formate/category-formate.component';
import { MyApprovalComponent } from './my-approval/my-approval.component';
import { MiscChargesComponent } from './misc-charges/misc-charges.component';
import { AccessControlComponent } from './access-control/access-control.component';

export default [
    { path: 'access-control', component: AccessControlComponent },
    { path: 'user-management', component: UserManagementComponent },
    { path: 'category-formate/:master', component: CategoryFormateComponent },
    { path: 'my-approval', component: MyApprovalComponent },
    { path: 'misc-charges', component: MiscChargesComponent },
    { path: 'profile', component: UserCreate },
    { path: 'changepassword', component: NewPassword },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
