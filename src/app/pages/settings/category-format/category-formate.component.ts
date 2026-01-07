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
  masterForm!: FormGroup;
  visibleDialog = false;
  showPassword = false;
  showConfirmPassword = false;
  user:any[]=[];
  filterMaster: any[] = [];
  userRoleOptions:any[]=[];
  editMode = false;
  selectedUser: any = null;
  globalFilter: string = '';
  showGlobalSearch:boolean=true;

  masterDetails:[] = [];
  loggedInUserName:string = '';
  loggedInUserRole:string=''; 
  pageTitle = 'Category Master';
  addButtonLabel='Add Category';
  tableColumns:any[]=[];
  selectedMaster !:string;
  dialogTitle='';
    masterOption=[
    {label:'Configuration', value:'advance'},
    {label:'Category Master', value:'categorymaster'},
    {label:'Customer Master', value:'customermaster'},
     {label:'Tax Master', value:'taxmaster'},
    {label:'UOM Master', value:'uommaster'},
    {label:'User Master',value:'usermaster'},
    {label:'Supplier Master', value:'suppliermaster'}
  ];
 
  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private authService: AuthService,
    private inventoryService: InventoryService,
    private userService:UserService
  ) {}

  ngOnInit() {
    this.initForm();
    const defaultMaster='categorymaster';
    this.updateTitleMaster(defaultMaster);
    this.tableColumns=this.tableConfig[defaultMaster];
    this.loadMasterData(defaultMaster);
    this.filterMaster=[...this.masterDetails];
    // this.onGetUserList();
    this.loggedInUserName=this.authService.isLogIntType().username;
    this.loggedInUserRole=this.authService.isLogIntType().usertypename;
  }

  initForm() {
    this.masterForm = this.fb.group(
      { master:['categorymaster'],
        // Category
        p_categoryname: ['', Validators.required],
        p_categorydesc: ['', [Validators.required,Validators.maxLength(20)]],
        // Customer
        customername:[''],
         customeraddress:[''],
        customerphone:[''],
        customercity:[''],
        customerstate:[''],
        customercountry:[''],
         customerpincode:[''],
customeremail:[''],
customergstno:[''],
customercontactname:[''],
customercontactphone:[''],
customercontactemail:[''],
// Configuration
rulename:[''],
ruledesc:[''],
rulevalue:[''],
// UOM
uomname:[''],
uomdesc:[''],
chiduomname:[''],
// Tax
taxname:[''],
taxdesc:[''],
taxtype:[''],
taxpercentage:[''],
// Supplier
suppliername:[''],
supplieraddress:[''],
suppliercity:[''],
supplierstate:[''],
suppliercountry:[''],
supplierpincode:[''],
supplierphone:[''],
supplieremail:[''],
suppliergst:[''],
suppliercontactname:[''],
suppliercontactphone:[''],
suppliercontactemail:[''],
//User Type
 p_utypeid: ['', Validators.required],
                p_uname: ['', [Validators.required, Validators.maxLength(20)]],
                p_ufullname: ['', [Validators.required, Validators.maxLength(50)]],
                p_pwd: ['', [Validators.required, Validators.minLength(4), Validators.pattern('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{4,}$')]],
                conPassword: ['', Validators.required],
                p_phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
                p_email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(50)]],

        checked: [true],
      }
    );
    this.masterForm.get('master')?.valueChanges.subscribe(value=>{
      this.updateTitleMaster(value);
      this.loadMasterData(value);
      this.tableColumns=this.tableConfig[value];
    })
  }

 allowOnlyDigits(event: KeyboardEvent) {
    const char = event.key;
    if (!/[0-9]/.test(char)) {
      event.preventDefault();
    }
  }

updateTitleMaster(master:string){
switch(master){
case 'advance':
    this.pageTitle='Configuration';
    this.addButtonLabel='Add Configuration';
    break;


  case 'categorymaster':
    this.pageTitle='Category Master';
    this.addButtonLabel='Add Category';
    break;

    case 'customermaster':
     this.pageTitle='Customer Master';
    this.addButtonLabel='Add Customer';
    break;

    case 'uommaster':
     this.pageTitle='UOM Master';
    this.addButtonLabel='Add UOM';
    break;

    case 'usermaster':
     this.pageTitle='User Master';
    this.addButtonLabel='Add User';
    break;
    
    case 'taxmaster':
     this.pageTitle='Tax Master';
    this.addButtonLabel='Add Tax';
    break;

    case 'suppliermaster':
     this.pageTitle='Supplier Master';
    this.addButtonLabel='Add Supplier';
    break;

    default:
      this.pageTitle='Master';
      this.addButtonLabel='Add'
}
}

masterPayloadMap:Record<string,string>={
  advance:'ADVANCE',
  categorymaster:'CATEGORYMASTER',
  customermaster:'CUSTOMERMASTER',
  taxmaster:'TAXMASTER',
  uommaster:'UOMMASTER',
  usermaster:'USERTYPE',
  suppliermatser:'SUPPLIERMASTER'
}

 commonMasterColumns = [
  { field: 'fieldname', header: 'Name' },
  { field: 'fielddesc', header: 'Description' },
  { field: 'isactive', header: 'Active' }
];

tableConfig: Record<string,any[]>={
  advance:[
    {field:'fieldname',header:'Name'},
    {field:'fielddesc',header:'Description'},
    {field:'fieldvalue',header:'Value'},
    {field:'isactive',header:'Active'}
  ],
  categorymaster : this.commonMasterColumns,
  customermaster: [
  {field:'customername', header:'Name'},
   {field:'customerphone', header:'Phone'},
 {field:'customercity', header:'City'},
 {field:'isactive', header:'Active'},
  ],
  suppliermaster:[
     {field:'suppliername', header:'Name'},
      {field:'supplierphone', header:'Phone'},
       {field:'suppliercity', header:'City'},
        {field:'isactive', header:'Active'},
  ],
  taxmaster:this.commonMasterColumns,
  uommaster: this.commonMasterColumns,
  usermaster: this.commonMasterColumns,
}
  /** ✳️ Add User Dialog **/
  openUserDialog() {
    this.selectedMaster=this.masterForm.get('master')?.value;
    const  dialogTitleMap:Record<string,string>={
      advance:'Add Advance',
  categorymaster:'Add Category',
  customermaster:'Add Customer',
  taxmaster:'Add Tax',
  uommaster:'Add UOM',
  usermaster:'Add User',
  suppliermatser:'Add Supplier'
    }
    this.dialogTitle=dialogTitleMap[this.selectedMaster];
    // this.resetFormByMaster(this.selectedMaster);
    this.visibleDialog = true;
    
  //   this.editMode = false;
  //   this.masterForm.reset({ checked: true });
  //  this.masterForm.get('p_categoryname')?.enable();
  // this.masterForm.get('p_categorydesc')?.enable();
  // this.masterForm.get('checked')?.enable();
  }

 resetFormByMaster(master:string){
  this.masterForm.reset({checked:true});
switch(master){
case 'advance':
    
    break;

  case 'categorymaster':
   
    break;

    case 'customermaster':
     
    break;

    case 'uommaster':
    
    break;

    case 'usermaster':
    
    break;
    
    case 'taxmaster':
    
    break;

    case 'suppliermaster':
    
    break;

}
 }

  openEditDialog(user: any) {
    this.visibleDialog = true;
    this.editMode = true;
    this.selectedUser = user;
  
console.log('user role', user.usertypename)
    this.masterForm.patchValue({  
    p_categorydesc: user.usertypeid,
    p_categoryname: user.username,
    checked:(user.isactive) === 'Y' 
    });
  }
 
  closeDialog() {
    this.visibleDialog = false;
  }
//  onGetUserList(){
//    const payload:any = {
//     "p_ufullname": "",
//     "p_categoryname":"admin",
//     "p_pwd": "",
//     "p_active": "",
//     "p_operationtype": "GETUSER",
//     "p_phone": "",
//     "p_categorydesc": "",
//     "p_email": "",
//     "p_oldpwd": "",
//    };
//    this.userService.OnUserHeaderCreate(payload).subscribe({
//     next:(res)=>{
//       console.log('res:',res);
//       this.user=res.data || [];
//       if(this.loggedInUserRole ==='Admin' || this.loggedInUserRole==='admin'){
//           this.filterMaster=[...this.user];
//       }
//       else{
//         this.filterMaster=this.user.filter(u=>u.username === this.loggedInUserName);
//       }
      
//     },
//     error:(err)=>{
//       console.error(err);
//     }
//    });
//  }
 loadMasterData(masterKey:string){
  const payloadType=this.masterPayloadMap[masterKey]
const payload = this.createDropdownPayload(payloadType);
    this.inventoryService.getdropdowndetails(payload).subscribe({
      next: (res) => 
       {  this.masterDetails = res.data || [],
      console.log(this.masterDetails);
      this.filterMaster=[...this.masterDetails]
    },
      error: (err) => console.log(err)
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
      //  this.onGetUserList();
    },
    error: (err) => {
      console.error('API error', err);
    }
  });
}
  /** ✅ Submit Form **/
  onSubmit() {
    if (this.masterForm.invalid) {
      this.masterForm.markAllAsTouched() ;
      return;
    }
    this.onUserCreation(this.masterForm.getRawValue());
  }

  createDropdownPayload(returnType: string) {
  return {
    p_username: "admin",
    p_returntype: returnType,
  };
}

  /** 🔍 Global Filter **/
  applyGlobalFilter() {
    this.applyGlobalFilterManual();
  }
  applyGlobalFilterManual(){
    const value=this.globalFilter;
     if(!value){
      this.filterMaster=[...this.masterDetails];
      return;
     }
     this.filterMaster=this.masterDetails.filter((user)=>Object.values(user).some((v)=>String(v).toLowerCase().includes(value)));
  }

  /** 🔁 Reset Filter **/
  clearGlobalFilter(input: HTMLInputElement) {
    input.value = '';
    this.globalFilter = '';
  }
}
