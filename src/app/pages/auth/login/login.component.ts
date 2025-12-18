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
import { ShareService } from '@/core/services/shared.service';
import { MessageService } from 'primeng/api';

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
    MessageModule
  ]
})
export class LoginComponent implements OnInit {
  public loginTypes = [
    { label: 'Admin', value: 'admin' },
    { label: 'Employee', value: 'employee' },
    { label: 'Manager', value: 'manager' },
  ];

  LayoutService = inject(LayoutService);
  isDarkTheme = computed(() => this.LayoutService.isDarkTheme());
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private authservice: AuthService,
    private sharedService: ShareService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    // First create the form with default values
    this.loginForm = this.fb.group({
      usercode: [null, [Validators.required, Validators.minLength(4)]],
      pwd: [null, [Validators.required, Validators.minLength(4)]],
      logintype: [null],
      clientcode: [null, [Validators.required]],
      rememberMe: [false]
    });

    // Then try to load remembered credentials
    this.loadRememberedCredentials();
  }

  forgetPassword() {
    this.route.navigate(['/forgotpassword']);
  }

  loadRememberedCredentials() {
    try {
      const remembered = localStorage.getItem('rememberMe');
      
      if (remembered === 'true') {
        const savedClientCode = localStorage.getItem('savedClientCode');
        const savedUserCode = localStorage.getItem('savedUserCode');
        const savedPassword = localStorage.getItem('savedPassword');

        if (savedClientCode && savedUserCode) {
          this.loginForm.patchValue({
            usercode: savedUserCode,
            pwd: savedPassword || '',
            clientcode: savedClientCode,
            rememberMe: true
          });
        }
      }
    } catch (error) {
      console.error('Error loading remembered credentials:', error);
      this.clearSavedCredentials();
    }
  }

  saveCredentials(clientcode: string, usercode: string, password: string) {
    try {
      const rememberMe = this.loginForm.get('rememberMe')?.value;

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedClientCode', clientcode);
        localStorage.setItem('savedUserCode', usercode);
        localStorage.setItem('savedPassword', password);

        console.log('✅ Credentials saved to localStorage');
      } else {
        this.clearSavedCredentials();
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
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
      localStorage.removeItem('savedClientCode');
      localStorage.removeItem('savedUserCode');
      localStorage.removeItem('savedPassword');
      console.log('Credentials cleared from localStorage');
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { clientcode, usercode, pwd, rememberMe } = this.loginForm.value;
      
      console.log('Submitting form with:', { clientcode, usercode, rememberMe });

      this.sharedService.setClientCode(clientcode);
      this.loginForm.controls['logintype'].setValue(usercode);

      // Save credentials BEFORE API call
      this.saveCredentials(clientcode, usercode, pwd);

      this.authservice.isLoggedIn(this.loginForm.value).subscribe({
        next: (res: any) => {
          if (res.success == true) {
            this.authservice.setToken(res.data?.usertoken);
            
            // Additional save for session management (optional)
            if (rememberMe) {
              // Store in sessionStorage for current session
              sessionStorage.setItem('currentUser', JSON.stringify({
                clientcode,
                usercode
              }));
            }
            
            this.route.navigate(['/layout']);
          } else {
            let message = 'Wrong UserId Or Password!!';
            this.errorSuccess(message);
          }
        },
        error: (res) => {
          console.error('Login API error:', res);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Login failed. Please try again.'
          });
        }
      });

      console.log('Form Submitted:', this.loginForm.value);
    } else {
      this.loginForm.markAllAsTouched();
      // // Log each control's errors
      // Object.keys(this.loginForm.controls).forEach(key => {
      //   const control = this.loginForm.get(key);
      //   if (control?.errors) {
      //     console.log(`Control ${key} errors:`, control.errors);
      //   }
      // });
    }
  }

  errorSuccess(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}