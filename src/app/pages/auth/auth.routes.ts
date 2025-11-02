import { Routes } from '@angular/router';
import { Access } from './access';
import { Error } from './error';
import { Register } from './register';
import { ForgotPassword } from './forgotpassword';
import { NewPassword } from './newpassword';
import { Verification } from './verification';
import { LockScreen } from './lockscreen';
import { LoginComponent } from './login/login.component';

export default[
    { path: 'access', component: Access, },
    { path: 'error', component: Error },
    { path: '', component: LoginComponent, },
     { path: 'login', component: LoginComponent, },
    { path: 'register', component: Register },
    { path: 'forgotpassword', component: ForgotPassword },
    // { path: 'newpassword', component: NewPassword },
    { path: 'verification', component: Verification },
    { path: 'lockscreen', component: LockScreen }
] as Routes;
