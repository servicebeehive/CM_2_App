import { Routes } from '@angular/router';
import { UserManagementComponent } from '../security/user-management/user-management.component';
import { UserCreate } from '../user-management/usercreate';
import { NewPassword } from '../user-management/changepassword';
import { CategoryFormateComponent } from './category-format/category-formate.component';
import { BulkUploadComponent } from './bulk-upload/bulk-upload.component';
import { MiscChargesComponent } from './misc-charges/misc-charges.component';
import { MyApprovalComponent } from './my-approval/my-approval.component';

export default [
    { path: 'category-formate/:master', component: CategoryFormateComponent },
     { path: 'my-approval', component: MyApprovalComponent },
    { path: 'misc-charges', component: MiscChargesComponent },
    { path: 'profile', component: UserCreate },
    { path: 'changepassword', component: NewPassword },
    {path:'bulk-upload',component:BulkUploadComponent},
    { path: '**', redirectTo: '/notfound' }
] as Routes;
