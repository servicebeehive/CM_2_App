import { AppConfigurator } from '@/layout/components/app.configurator';
import { LayoutService } from '@/layout/service/layout.service';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@/core/services/auth.service';
import { Select } from "primeng/select";
@Component({
  selector: 'app-login',
    templateUrl: './login.component.html',
    standalone:true,
    styleUrl: './login.component.scss',
    imports: [CommonModule,
    FormsModule,
    AppConfigurator,
    ReactiveFormsModule,
    RouterModule,
    // PrimeNG
    InputTextModule,
    CheckboxModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
    MessageModule]
})
export class LoginComponent  implements OnInit{
 public   loginTypes = [
  { label: 'Admin', value: 'admin' },
  { label: 'Employee', value: 'employee' },
  { label: 'Manager', value: 'manager' },
];

     rememberMe: boolean = false;

    LayoutService = inject(LayoutService);

    isDarkTheme = computed(() => this.LayoutService.isDarkTheme());
 loginForm!: FormGroup;
constructor(private fb: FormBuilder,private route:Router, private authservice:AuthService) {

}

     ngOnInit() {
    this.loginForm = this.fb.group({
      // usercode: ['admin', [Validators.required,Validators.minLength(4)]],   // email as loginId
      // pwd: ['admin', [Validators.required,Validators.minLength(4)]],
      // logintype:[''],
      // clientcode:['CG01-SE',[Validators.required]]
      usercode: [null, [Validators.required,Validators.minLength(4)]],   // email as loginId
       pwd: [null, [Validators.required,Validators.minLength(4)]],
      logintype:[null],
      clientcode:['CG01-SE',[Validators.required]]


    });
  }

forgetPassword(){
  this.route.navigate(['/forgotpassword']);
}

  onSubmit() {
    if (this.loginForm.valid) {
        //  this.route.navigate(['/layout']);
        this.authservice.isLoggedIn(this.loginForm.value).subscribe({
            next:(res:any)=>{
                if(res.success==true){
                    this.authservice.setToken(res.data?.usertoken)
                    this.route.navigate(['/layout']);
                }
            },
          error:(res)=>{
            console.log(res)
          }

        })
      console.log('Form Submitted:', this.loginForm.value);

    } else {
      this.loginForm.markAllAsTouched();
    }
  }

}
