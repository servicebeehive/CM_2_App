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
  selector: 'app-category-formate',
  standalone: true,
  templateUrl: './category-formate.component.html',
  styleUrls: ['./category-formate.component.scss'],
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
export class CategoryFormateComponent {
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
  loggedInUserName:string = '';
  loggedInUserRole:string=''; 

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
    this.loggedInUserName=this.authService.isLogIntType().username;
    this.loggedInUserRole=this.authService.isLogIntType().usertypename;
  }

  initForm() {
    this.userForm = this.fb.group(
      {
        p_categoryname: ['', Validators.required],
        p_categorydesc: ['', [Validators.required,Validators.maxLength(20)]],
        checked: [true],
      }
    );
  }
  /** ✳️ Add User Dialog **/
  openUserDialog() {
    this.visibleDialog = true;
    this.editMode = false;
    this.userForm.reset({ checked: true });
   this.userForm.get('p_categoryname')?.enable();
  this.userForm.get('p_categorydesc')?.enable();
  this.userForm.get('checked')?.enable();
  }

  openEditDialog(user: any) {
    this.visibleDialog = true;
    this.editMode = true;
    this.selectedUser = user;
  
console.log('user role', user.usertypename)
    this.userForm.patchValue({  
    p_categorydesc: user.usertypeid,
    p_categoryname: user.username,
    checked:(user.isactive) === 'Y' 
    });
  }
 
  closeDialog() {
    this.visibleDialog = false;
  }
 onGetUserList(){
   const payload:any = {
    "p_ufullname": "",
    "p_categoryname":"admin",
    "p_pwd": "",
    "p_active": "",
    "p_operationtype": "GETUSER",
    "p_phone": "",
    "p_categorydesc": "",
    "p_email": "",
    "p_oldpwd": "",
   };
   this.userService.OnUserHeaderCreate(payload).subscribe({
    next:(res)=>{
      console.log('res:',res);
      this.user=res.data || [];
      if(this.loggedInUserRole ==='Admin' || this.loggedInUserRole==='admin'){
          this.filteredUser=[...this.user];
      }
      else{
        this.filteredUser=this.user.filter(u=>u.username === this.loggedInUserName);
      }
      
    },
    error:(err)=>{
      console.error(err);
    }
   });
 }
 onUserCreation(data: any) {
 
  console.log('user role:',data.p_categorydesc);
  const payload: any = {
    "p_operationtype": this.editMode ? "UPDATE" : "INSERT",
    "p_ufullname": data.p_ufullname,
    "p_categoryname": data.p_categoryname,
    "p_pwd": data.p_pwd,
    "p_active": data.checked ? "Y" : "N",
    "p_phone": data.p_phone,
    "p_categorydesc": (data.p_categorydesc).toString(),
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
