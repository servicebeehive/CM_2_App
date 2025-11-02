import { Routes } from "@angular/router";
import { UserManagementComponent } from "./user-management/user-management.component";
import { UserCreate } from "../user-management/usercreate";
import { NewPassword } from "../user-management/changepassword";


export default[
    {path:'user-management' , component:UserManagementComponent},
    {path:'profile' , component:UserCreate},
     {path:'changepassword', component:NewPassword},
    {path:'**' , redirectTo:'/notfound'}
] as Routes;
