import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-user-management',
  standalone: true,
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    TableModule,
    CheckboxModule,
    DialogModule,
    ConfirmDialogModule,
    RippleModule,
  ],
  providers: [ConfirmationService],
})
export class UserManagementComponent {
  userForm!: FormGroup;
  visibleDialog = false;
  showPassword = false;
  showConfirmPassword = false;
  filteredProducts: any[] = [];
  editMode = false;
  selectedUser: any = null;
  globalFilter: string = '';

  userRoleOptions = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Front Desk', value: 'Front Desk' },
    { label: 'Help Desk', value: 'Help Desk' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Operation Desk', value: 'Operation Desk' },
  ];

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.userForm = this.fb.group(
      {
        userRole: ['', Validators.required],
        userName: ['', [Validators.required,Validators.maxLength(20)]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(4),
            Validators.pattern(
              '^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{4,}$'
            ),
          ],
        ],
        conPassword: ['', Validators.required],
        mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        email: ['', [Validators.required, Validators.email,Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),Validators.maxLength(50)]],
        checked: [true],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirm = group.get('conPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };

  /** ✳️ Add User Dialog **/
  openUserDialog() {
    this.visibleDialog = true;
    this.editMode = false;
    this.userForm.reset({ checked: true });
  }

  openEditDialog(user: any) {
    this.visibleDialog = true;
    this.editMode = true;
    this.selectedUser = user;
    this.userForm.patchValue(user);
  }

  closeDialog() {
    this.visibleDialog = false;
  }

  /** ✅ Submit Form **/
  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched() ;
      return;
    }

    const formValue = this.userForm.value  ;
    const newUser = {
      id: this.editMode && this.selectedUser ? this.selectedUser.id : Date.now(),
      userRole: formValue.userRole,
      userName: formValue.userName,
      mobile: formValue.mobile,
      email: formValue.email,
      active: formValue.checked ? 'Yes' : 'No',
    };

    if (this.editMode) {
      const index = this.filteredProducts.findIndex(
        (u) => u.id === this.selectedUser.id
      );
      if (index !== -1) this.filteredProducts[index] = newUser;
    } else {
      this.filteredProducts.push(newUser);
    }

    this.visibleDialog = false;

    this.confirmationService.confirm({
      message: this.editMode
        ? 'User updated successfully!'
        : 'User added successfully!',
      header: 'Success',
      icon: 'pi pi-check-circle',
      acceptLabel: 'OK',
      rejectVisible: false,
    });
  }

  /** 🧮 Allow only digits **/
  allowOnlyDigits(event: KeyboardEvent) {
    const char = event.key;
    if (!/[0-9]/.test(char)) {
      event.preventDefault();
    }
  }

  /** 🧹 Delete user **/
  deleteItem(user: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${user.userName}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.filteredProducts = this.filteredProducts.filter(
          (u) => u.id !== user.id
        );
      },
    });
  }

  /** 🔍 Global Filter **/
  applyGlobalFilter(event: any) {
    const value = event.target.value.toLowerCase();
    this.globalFilter = value;

    this.filteredProducts = this.filteredProducts.filter((user) => {
      return (
        user.userName.toLowerCase().includes(value) ||
        user.userRole.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value) ||
        user.mobile.toString().includes(value)
      );
    });
  }

  /** 🔁 Reset Filter **/
  clearGlobalFilter(input: HTMLInputElement) {
    input.value = '';
    this.globalFilter = '';
  }
}
