import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '@/layout/service/layout.service';
import { AppConfigurator } from '@/layout/components/app.configurator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { UserService } from '@/core/services/user.service';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [
    ButtonModule,
    RouterModule,
    AppConfigurator,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PasswordModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule
  ],
  template: `
  <div class="flex justify-center items-center min-h-screen bg-surface-50 dark:bg-surface-900">
    <div class="card border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 rounded-lg p-8 w-full md:w-[450px] shadow-lg">
      <h2 class="text-surface-900 dark:text-surface-0 text-2xl font-semibold mb-6 text-center">Change Password</h2>

      <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
        <!-- Old Password -->
        <div>
          <p-iconfield class="w-full">
            <p-inputicon class="pi pi-lock z-20" />
            <p-password
              formControlName="oldPassword"
              placeholder="Old Password"
              styleClass="w-full"
              [inputStyle]="{ paddingLeft: '2.5rem' }"
              inputStyleClass="w-full"
              [feedback]="false"
              [toggleMask]="true"
            ></p-password>
          </p-iconfield>
          <small class="text-red-500 ms-3 mt-2" *ngIf="isInvalid('oldPassword')">
            Old password is required
          </small>
        </div>

        <!-- New Password -->
        <div>
          <p-iconfield class="w-full">
            <p-inputicon class="pi pi-lock z-20" />
            <p-password
              formControlName="newPassword"
              placeholder="New Password"
              styleClass="w-full"
              [inputStyle]="{ paddingLeft: '2.5rem' }"
              inputStyleClass="w-full"
              [toggleMask]="true"
              [feedback]="true"
            ></p-password>
          </p-iconfield>
          <small class="text-red-500 ms-3 mt-2" *ngIf="isInvalid('newPassword')">
            New password is required
          </small>
        </div>

        <!-- Confirm Password -->
        <div>
          <p-iconfield class="w-full">
            <p-inputicon class="pi pi-lock z-20" />
            <p-password
              formControlName="confirmPassword"
              placeholder="Confirm New Password"
              styleClass="w-full"
              [inputStyle]="{ paddingLeft: '2.5rem' }"
              inputStyleClass="w-full"
              [toggleMask]="true"
              [feedback]="false"
            ></p-password>
          </p-iconfield>
          <small class="text-red-500 ms-3 mt-2" *ngIf="passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched">
            Passwords do not match
          </small>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 justify-between mt-4">
          <!-- <button
            pButton
            pRipple
            label="Cancel"
            class="flex-1"
            outlined
            [routerLink]="['/']"
            type="button"
          ></button> -->
          <button
            pButton
            pRipple
            label="Submit"
            class="flex-1"
            type="submit"
            [disabled]="passwordForm.invalid"
          ></button>
        </div>
      </form>
    </div>

    <app-configurator [simple]="true" />
  </div>
  `
})
export class NewPassword {
  LayoutService = inject(LayoutService);
  constructor(private autherService:AuthService, private userService:UserService){}
  fb = inject(FormBuilder);
  isDarkTheme = computed(() => this.LayoutService.isDarkTheme());

  passwordForm: FormGroup = this.fb.group(
    {
      oldPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: this.passwordMismatchValidator
    }
  );

  passwordMismatchValidator(form: AbstractControl) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  isInvalid(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control?.touched && control?.hasError('required'));
  }

changePassword(data:any){
const payload:any={
     
    "p_ufullname":"",
    "p_uname":data.p_uname,
    "p_pwd": data.p_pwd,
    "p_active": "",
    "p_operationtype": "CHANGE",
    "p_phone": "",
    "p_utypeid": data.p_utypeid,
    "p_email": "",
    "p_oldpwd": data.oldPassword,
};
this.userService.OnUserHeaderCreate(payload).subscribe({
  next:(res)=>{
    console.log('result:',res);
  },
  error:(err)=>{
    console.error(err);
  }
})
}

  onSubmit() {
    if (this.passwordForm.invalid) return;
    console.log('Password changed successfully:', this.passwordForm.value);
    
    this.changePassword(this.passwordForm.value);
  }
}
