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
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { UserService } from '@/core/services/user.service';

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
    GlobalFilterComponent,
    ],
  providers: [ConfirmationService],
})
export class UserManagementComponent {
  userForm!: FormGroup;
  visibleDialog = false;
  showPassword = false;
  showConfirmPassword = false;
  user:any[]=[];
  filteredUser: any[] = [];

  editMode = false;
  selectedUser: any = null;
  globalFilter: string = '';
  showGlobalSearch:boolean=true;

  userRoleOptions = [];

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private authService: AuthService,
    private inventoryService: InventoryService,
    private userService:UserService
  ) {}

  ngOnInit() {
    this.initForm();
    this.onGetUserRole();
    this.filteredUser=[...this.user];
    this.onGetUserList();
  }

  initForm() {
    this.userForm = this.fb.group(
      {
        p_utypeid: ['', Validators.required],
        p_uname: ['', [Validators.required,Validators.maxLength(20)]],
        p_ufullname: ['', [Validators.required,Validators.maxLength(50)]],
        p_pwd: [
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
        p_phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        p_email: ['', [Validators.required, Validators.email,Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),Validators.maxLength(50)]],
        checked: [true],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const password = group.get('p_pwd')?.value;
    const confirm = group.get('conPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };

  /** ✳️ Add User Dialog **/
  openUserDialog() {
    this.visibleDialog = true;
    this.editMode = false;
    this.userForm.reset({ checked: true });
   this.userForm.get('p_uname')?.enable();
  this.userForm.get('p_pwd')?.enable();
  this.userForm.get('conPassword')?.enable();
  this.userForm.get('p_utypeid')?.enable();
  this.userForm.get('checked')?.enable();
  }

  openEditDialog(user: any) {
    this.visibleDialog = true;
    this.editMode = true;
    this.selectedUser = user;
  
 // Clear password validators for edit mode
  this.userForm.get('p_pwd')?.disable();
  this.userForm.get('conPassword')?.disable();
  this.userForm.get('p_uname')?.disable();
  
console.log('user role', user.usertypename)
    this.userForm.patchValue({  
    p_utypeid: user.usertypeid,
    p_uname: user.username,
    p_ufullname: user.fullname,
    p_phone: user.phone,
    p_email: user.email,
    checked:(user.isactive) === 'Y' 
    });
    if(user.username === 'admin' || user.username === 'Admin'){
     this.userForm.get('p_utypeid')?.disable(); 
    this.userForm.get('checked')?.disable();
  }
   else {
    this.userForm.get('p_utypeid')?.enable();
    this.userForm.get('checked')?.enable();
  }
    this.userForm.get('p_pwd')?.setValue('');
  this.userForm.get('conPassword')?.setValue('');

  this.userForm.updateValueAndValidity();
  }
  valueReturnToString(value: any) {
  return value != null ? value.toString() : null;
}
  closeDialog() {
    this.visibleDialog = false;
  }
 onGetUserList(){
   const payload:any = {
    "p_ufullname": "",
    "p_uname":"admin",
    "p_pwd": "",
    "p_active": "",
    "p_operationtype": "GETUSER",
    "p_phone": "",
    "p_utypeid": "",
    "p_email": "",
    "p_oldpwd": "",
   };
   this.userService.OnUserHeaderCreate(payload).subscribe({
    next:(res)=>{
      console.log('res:',res);
      this.user=res.data || [];
      this.filteredUser=[...this.user];
    },
    error:(err)=>{
      console.error(err);
    }
   });
 }
 onUserCreation(data: any) {
 
  console.log('user role:',data.p_utypeid);
  const payload: any = {
    "p_operationtype": this.editMode ? "UPDATE" : "INSERT",
    "p_ufullname": data.p_ufullname,
    "p_uname": data.p_uname,
    "p_pwd": data.p_pwd,
    "p_active": data.checked ? "Y" : "N",
    "p_phone": data.p_phone,
    "p_utypeid": (data.p_utypeid).toString(),
    "p_email": data.p_email,
    "p_oldpwd": "",
  };
 
  this.userService.OnUserHeaderCreate(payload).subscribe({
    next: (res) => {
      console.log('Create/Update response:', res);
      // Close dialog
      this.visibleDialog = false;
       this.onGetUserList();
    },
    error: (err) => {
      console.error('API error', err);
    }
  });
}
  /** ✅ Submit Form **/
  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched() ;
      return;
    }
    this.onUserCreation(this.userForm.getRawValue());
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
      message: `Are you sure you want to delete <b>${user.userName || user.p_uname}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
      this.user=this.user.filter((u)=>u.id !==user.id);
      this.applyGlobalFilterManual();
      },
    });
  }
  createDropdownPayload(returnType: string) {
  return {
    p_username: "admin",
    p_returntype: returnType,
  };
}
onGetUserRole(){
const payload = this.createDropdownPayload("USERTYPE");
    this.inventoryService.getdropdowndetails(payload).subscribe({
      next: (res) => 
         this.userRoleOptions = res.data,
      error: (err) => console.log(err)
    });
}
  /** 🔍 Global Filter **/
  applyGlobalFilter() {
    this.applyGlobalFilterManual();
  }
  applyGlobalFilterManual(){
    const value=this.globalFilter;
     if(!value){
      this.filteredUser=[...this.user];
      return;
     }
     this.filteredUser=this.user.filter((user)=>Object.values(user).some((v)=>String(v).toLowerCase().includes(value)));
  }

  /** 🔁 Reset Filter **/
  clearGlobalFilter(input: HTMLInputElement) {
    input.value = '';
    this.globalFilter = '';
  }
}
