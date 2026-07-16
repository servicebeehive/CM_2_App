import { AppConfigurator } from '@/layout/components/app.configurator';
import { LayoutService } from '@/layout/service/layout.service';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { ShareService } from '@/core/services/shared.service';
import { MessageService } from 'primeng/api';
import { act } from '@ngrx/effects';
import { authLogin } from '@/core/models/authmodel/auth.model';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  styleUrl: './login.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    AppConfigurator,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    CheckboxModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
    MessageModule,
    ProgressSpinnerModule
  ]
})
export class LoginComponent implements OnInit {
  LayoutService = inject(LayoutService);
  isDarkTheme = computed(() => this.LayoutService.isDarkTheme());
  loginForm!: FormGroup;
  showPassword: boolean = false;
  isCheckingExternalAuth = true;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private authservice: AuthService,
    private sharedService: ShareService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
     this.loginForm = this.fb.group({
      pwd: [null, [Validators.required, Validators.minLength(6)]],
      usercode: [null, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      rememberMe: [false],
    });

    this.activatedRoute.queryParams.subscribe(params=>{
    const incomingClientcode = params['clientcode'];
    const incomingPwd = params['pwd'];
  
     if (incomingClientcode && incomingPwd) {
      this.handleExternalCredentials(incomingClientcode, incomingPwd);
      return;
    }
    this.isCheckingExternalAuth = false;
    });

    this.loadRememberedCredentials();
  }

allowOnlyDigits(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char)) {
            event.preventDefault();
        }
    }

  forgetPassword() {
    this.route.navigate(['/forgotpassword']);
  }

handleExternalCredentials(clientcode: string, pwd: string) {
  this.sharedService.setClientCode(clientcode);
const loginBody = { usercode: clientcode, pwd } as authLogin;

  this.authservice.isLoggedIn(loginBody).subscribe({
    next: (res: any) => {
      if (res.status === 'success') {
        this.authservice.setToken(res.data?.usertoken);
        this.route.navigate(['/layout']);
      } else {
        this.errorSuccess(res.data.msg);
      }
    },
    error: () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Could not verify session.'
      });
    }
  });
}
  
  loadRememberedCredentials() {
    try {
      const remembered = localStorage.getItem('rememberMe');
      if (remembered === 'true') {
        const savedMobileno = localStorage.getItem('savedMobileno');
        const savedPassword = localStorage.getItem('savedPassword');
        // const savedPassword = localStorage.getItem('savedPassword');

        if (savedMobileno && savedPassword) {
          this.loginForm.patchValue({
            usercode: savedMobileno,
            pwd: savedPassword || '',
            rememberMe: true
          });
        }
      }
    } catch (error) {
      this.clearSavedCredentials();
    }
  }

  saveCredentials(usercode: string, pwd: string) {
    try {
      const rememberMe = this.loginForm.get('rememberMe')?.value;

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedMobileno', usercode);
        localStorage.setItem('savedPassword', pwd);
      } else {
        this.clearSavedCredentials();
      }
    } catch (error) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Could not save credentials to browser storage'
      });
    }
  }

  clearSavedCredentials() {
    try {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedMobileno');
      localStorage.removeItem('savedPassword');
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { usercode, pwd, rememberMe } = this.loginForm.value;
      this.sharedService.setClientCode(usercode);
      
      this.saveCredentials(usercode, pwd);

      this.authservice.isLoggedIn(this.loginForm.value).subscribe({
        next: (res: any) => {
          if (res.status === 'success' && res.data.userid) {
            this.authservice.setToken(res.data?.usertoken);
            if (rememberMe) {
              sessionStorage.setItem('currentUser', JSON.stringify({
                usercode,pwd
              }));
            }
            
            this.route.navigate(['/layout']);
          } else {
            this.errorSuccess(res.data.msg);
          }
        },
        error: (res) => {
          this.errorSuccess(res.error.message);
        }
      });
    } else {
      this.loginForm.markAllAsTouched()
    }
  }

   togglePassword() {
        this.showPassword = !this.showPassword;
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

  errorSuccess(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}