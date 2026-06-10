import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-category-formate',
    standalone: true,
    templateUrl: './category-formate.component.html',
    styleUrls: ['./category-formate.component.scss'],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, CheckboxModule, DialogModule, ConfirmDialogModule, RippleModule, GlobalFilterComponent],
    providers: [ConfirmationService]
})
export class CategoryFormateComponent {
    masterForm!: FormGroup;
    visibleDialog = false;
    showPassword = false;
    showConfirmPassword = false;
    user: any[] = [];
    filterMaster: any[] = [];
    userRoleOptions: any[] = [];
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;

    masterDetails: [] = [];
    loggedInUserName: string = '';
    loggedInUserRole: string = '';
    pageTitle = 'Category Master';
    addButtonLabel = 'Add Category';
    tableColumns: any[] = [];
    selectedMaster!: string;
    dialogTitle = '';
    // masterOption = [
    //     { label: 'Configuration', value: 'advance' },
    //     { label: 'Category Master', value: 'categorymaster' },
    //     { label: 'Customer Master', value: 'customermaster' },
    //     { label: 'Tax Master', value: 'taxmaster' },
    //     { label: 'UOM Master', value: 'uommaster' },
    //     { label: 'User Master', value: 'usertype' },
    //     { label: 'Supplier Master', value: 'suppliermaster' }
    // ];

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private authService: AuthService,
        private inventoryService: InventoryService,
        private userService: UserService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.initForm();

        this.route.paramMap.subscribe((params) => {
            const master = params.get('master') || 'categorymaster';
            this.masterForm.get('master')?.setValue(master);
            this.updateTitleMaster(master);
            this.tableColumns = this.tableConfig[master];
            this.loadMasterData(master);
        });
        this.filterMaster = [...this.masterDetails];
        // this.onGetUserList();
        this.loggedInUserName = this.authService.isLogIntType().username;
        this.loggedInUserRole = this.authService.isLogIntType().usertypename;
    }

    initForm() {
        this.masterForm = this.fb.group({
          master:['categorymaster'],
            checked: [true]
        });
        // this.masterForm.get('master')?.valueChanges.subscribe((value) => {
        //     this.updateTitleMaster(value);
        //     this.loadMasterData(value);
        //     this.tableColumns = this.tableConfig[value];
        // });
    }

    allowOnlyDigits(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char)) {
            event.preventDefault();
        }
    }

    updateTitleMaster(master: string) {
        switch (master) {
            case 'advance':
                this.pageTitle = 'Configuration';
                this.addButtonLabel = 'Add Configuration';
                break;

            case 'categorymaster':
                this.pageTitle = 'Category Master';
                this.addButtonLabel = 'Add Category';
                break;

            case 'customermaster':
                this.pageTitle = 'Customer Master';
                this.addButtonLabel = 'Add Customer';
                break;

            case 'uommaster':
                this.pageTitle = 'UOM Master';
                this.addButtonLabel = 'Add UOM';
                break;

            case 'usertype':
                this.pageTitle = 'User Type';
                this.addButtonLabel = 'Add User';
                break;

            case 'taxmaster':
                this.pageTitle = 'Tax Master';
                this.addButtonLabel = 'Add Tax';
                break;

            case 'suppliermaster':
                this.pageTitle = 'Supplier Master';
                this.addButtonLabel = 'Add Supplier';
                break;

            default:
                this.pageTitle = 'Master';
                this.addButtonLabel = 'Add';
        }
    }

    masterPayloadMap: Record<string, string> = {
        advance: 'ADVANCE',
        categorymaster: 'CATEGORYMASTER',
        customermaster: 'CUSTOMERMASTER',
        taxmaster: 'TAXMASTER',
        uommaster: 'UOMMASTER',
        usertype: 'USERTYPE',
        suppliermaster: 'SUPPLIERMASTER'
    };

    commonMasterColumns = [
        { field: 'fieldname', header: 'Name', width:'300px' },
        { field: 'fielddesc', header: 'Description'},
        { field: 'isactive', header: 'Active', width:'80px' }
    ];

    tableConfig: Record<string, any[]> = {
        advance: [
            { field: 'fieldname', header: 'Name',width:'300px' },
            { field: 'fielddesc', header: 'Description',width:'500px' },
            { field: 'fieldvalue', header: 'Value' },
            { field: 'isactive', header: 'Active', width:'80px' }
        ],
        categorymaster: this.commonMasterColumns,
        customermaster: [
            { field: 'customername', header: 'Name',width:'300px' },
            { field: 'customerphone', header: 'Phone' },
            { field: 'customercity', header: 'City' },
            { field: 'isactive', header: 'Active', width:'80px' }
        ],
        suppliermaster: [
            { field: 'suppliername', header: 'Name',width:'300px' },
            { field: 'supplierphone', header: 'Phone' },
            { field: 'suppliercity', header: 'City' },
            { field: 'isactive', header: 'Active', width:'80px' }
        ],
        taxmaster: this.commonMasterColumns,
        uommaster: this.commonMasterColumns,
        usertype: this.commonMasterColumns
    };
    /** ✳️ Add User Dialog **/
    openUserDialog() {
        if (!this.masterForm) return;
        this.selectedMaster = this.masterForm.get('master')?.value ?? 'categorymaster';
        this.addControlsByMaster(this.selectedMaster);
        const dialogTitleMap: Record<string, string> = {
            advance: 'Add Advance',
            categorymaster: 'Add Category',
            customermaster: 'Add Customer',
            taxmaster: 'Add Tax',
            uommaster: 'Add UOM',
            usertype: 'Add User',
            suppliermaster: 'Add Supplier'
        };
        this.dialogTitle = dialogTitleMap[this.selectedMaster] ?? 'Add';
        console.log('master', this.selectedMaster, dialogTitleMap);
        // this.resetFormByMaster(this.selectedMaster);
        this.visibleDialog = true;

        //   this.editMode = false;
        //   this.masterForm.reset({ checked: true });
        //  this.masterForm.get('p_categoryname')?.enable();
        // this.masterForm.get('p_categorydesc')?.enable();
        // this.masterForm.get('checked')?.enable();
    }
    addControlsByMaster(master: string) {
        Object.keys(this.masterForm.controls).forEach((key) => {
            if (key !== 'master' && key!=='checked') {
                this.masterForm.removeControl(key);
            }
        });
        if (master === 'categorymaster') {
            this.masterForm.addControl('p_categoryname', this.fb.control('', Validators.required));
            this.masterForm.addControl('p_categorydesc', this.fb.control('', Validators.required));
        }
        if (master === 'customermaster') {
            this.masterForm.addControl('customername', this.fb.control('', Validators.required));
            this.masterForm.addControl('customeraddress', this.fb.control('', Validators.required));
            this.masterForm.addControl('customercountry', this.fb.control('', Validators.required));
            this.masterForm.addControl('customerstate', this.fb.control('', Validators.required));
            this.masterForm.addControl('customercity', this.fb.control('', Validators.required));
            this.masterForm.addControl('customerpincode', this.fb.control('', Validators.required));
            this.masterForm.addControl('customerphone', this.fb.control('', Validators.required));
            this.masterForm.addControl('customeremail', this.fb.control('', [Validators.required, Validators.email]));
            this.masterForm.addControl('customergstno', this.fb.control('', Validators.required));
            this.masterForm.addControl('customercontactname', this.fb.control('', Validators.required));
            this.masterForm.addControl('customercontactphone', this.fb.control('', Validators.required));
            this.masterForm.addControl('customercontactemail', this.fb.control('', [Validators.required, Validators.email]));
        }
        if (master === 'advance') {
            this.masterForm.addControl('rulename', this.fb.control('', Validators.required));
            this.masterForm.addControl('ruledesc', this.fb.control('', Validators.required));
            this.masterForm.addControl('rulevalue', this.fb.control('', Validators.required));
        }
        if (master === 'suppliermaster') {
            this.masterForm.addControl('suppliername', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplieraddress', this.fb.control('', Validators.required));
            this.masterForm.addControl('suppliercountry', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplierstate', this.fb.control('', Validators.required));
            this.masterForm.addControl('suppliercity', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplierpincode', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplierphone', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplieremail', this.fb.control('', [Validators.required, Validators.email]));
            this.masterForm.addControl('suppliergstno', this.fb.control('', Validators.required));
            this.masterForm.addControl('suppliercontactname', this.fb.control('', Validators.required));
            this.masterForm.addControl('suppliercontactphone', this.fb.control('', Validators.required));
            this.masterForm.addControl('suppliercontactemail', this.fb.control('', [Validators.required, Validators.email]));
        }
        if (master === 'taxmaster') {
            this.masterForm.addControl('taxname', this.fb.control('', Validators.required));
            this.masterForm.addControl('taxdesc', this.fb.control('', Validators.required));
            this.masterForm.addControl('taxtype', this.fb.control('', Validators.required));
            this.masterForm.addControl('taxpercentage', this.fb.control('', Validators.required));
        }
        if (master === 'uommaster') {
            this.masterForm.addControl('uomname', this.fb.control('', Validators.required));
            this.masterForm.addControl('uomdesc', this.fb.control('', Validators.required));
            this.masterForm.addControl('childuomname', this.fb.control('', Validators.required));
        }
        if(master==='usertype'){
            this.masterForm.addControl('p_uname', this.fb.control('', Validators.required));
            this.masterForm.addControl('p_utypeid', this.fb.control('', [Validators.required,Validators.maxLength(20)]));
            this.masterForm.addControl('p_ufullname', this.fb.control('', Validators.required));
            this.masterForm.addControl('p_pwd', this.fb.control('', Validators.required));
            this.masterForm.addControl('conPassword', this.fb.control('', Validators.required));
            this.masterForm.addControl('p_phone', this.fb.control('', Validators.required));
            this.masterForm.addControl('p_email', this.fb.control('', Validators.required));
        }
    }
    resetFormByMaster(master: string) {
        this.masterForm.reset({ checked: true });
        switch (master) {
            case 'advance':
                break;

            case 'categorymaster':
                break;

            case 'customermaster':
                break;

            case 'uommaster':
                break;

            case 'usertype':
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

        console.log('user role', user.usertypename);
        this.masterForm.patchValue({
            p_categorydesc: user.usertypeid,
            p_categoryname: user.username,
            checked: user.isactive === 'Y'
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
    loadMasterData(masterKey: string) {
        const payloadType = this.masterPayloadMap[masterKey];
        if (!payloadType) return;
        const payload = this.createDropdownPayload(payloadType);
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                ((this.masterDetails = res.data || []), console.log(this.masterDetails));
                this.filterMaster = [...this.masterDetails];
            },
            error: (err) => console.log(err)
        });
    }
    onUserCreation(data: any) {
        console.log('user role:', data.p_categorydesc);
        const payload: any = {
            p_operationtype: this.editMode ? 'UPDATE' : 'INSERT',
            p_ufullname: data.p_ufullname,
            p_categoryname: data.p_categoryname,
            p_pwd: data.p_pwd,
            p_active: data.checked ? 'Y' : 'N',
            p_phone: data.p_phone,
            p_categorydesc: data.p_categorydesc.toString(),
            p_email: data.p_email,
            p_oldpwd: ''
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
            this.masterForm.markAllAsTouched();
            return;
        }
        this.onUserCreation(this.masterForm.getRawValue());
    }

    createDropdownPayload(returnType: string) {
        return {
            p_username: 'admin',
            p_returntype: returnType
        };
    }

    /** 🔍 Global Filter **/
    applyGlobalFilter() {
        this.applyGlobalFilterManual();
    }
    applyGlobalFilterManual() {
        const value = this.globalFilter;
        if (!value) {
            this.filterMaster = [...this.masterDetails];
            return;
        }
        this.filterMaster = this.masterDetails.filter((user) => Object.values(user).some((v) => String(v).toLowerCase().includes(value)));
    }

    /** 🔁 Reset Filter **/
    clearGlobalFilter(input: HTMLInputElement) {
        input.value = '';
        this.globalFilter = '';
    }
}
