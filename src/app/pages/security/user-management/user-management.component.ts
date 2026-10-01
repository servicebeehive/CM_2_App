import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { UserService } from '@/core/services/user.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { GetUserDetail, RemovedParamterBased } from '@/core/models/inventory.model';
import { WorkService } from '@/core/services/work.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-user-management',
    standalone: true,
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.scss'],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, CheckboxModule, DialogModule, ConfirmDialogModule, RippleModule, MultiSelectModule, TooltipModule],
    providers: [ConfirmationService]
})
export class UserManagementComponent {
    @ViewChildren('filterInput') filterInputs!: QueryList<ElementRef<HTMLInputElement>>;

    userForm!: FormGroup;
    visibleDialog = false;
    showPassword = false;
    showConfirmPassword = false;
    user: any[] = [];
    filteredUser: any[] = [];
    projectOptions: any[] = [];
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;
    userRoleOptions: any[] = [];
    loggedInUserName: string = '';
    loggedInUserRole: string = '';
    industryType: string = '';

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private authService: AuthService,
        private inventoryService: InventoryService,
        private userService: UserService,
        private messageService: MessageService,
        private workService: WorkService
    ) {}

    ngOnInit() {
        this.initForm();
        this.industryType = this.authService.isLogIntType()?.industry_type_id.toString();
        this.onGetUserRole();
        this.onGetProjectList();
        this.filteredUser = [...this.user];
        this.onGetUserList();
        this.loggedInUserName = this.authService.isLogIntType().username;
        this.loggedInUserRole = this.authService.isLogIntType().usertypecode;
    }

    initForm() {
        this.userForm = this.fb.group(
            {
                p_utypeid: ['', Validators.required],
                p_uname: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
                p_ufullname: ['', [Validators.required, Validators.maxLength(50)]],
                p_pwd: ['', [Validators.required, Validators.minLength(4), Validators.pattern('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{4,}$')]],
                conPassword: ['', Validators.required],
                // p_phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
                p_projectid: [[], Validators.required],
                p_email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(50)]],
                checked: [true]
            },
            { validators: this.passwordMatchValidator }
        );
    }

    passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        const password = group.get('p_pwd')?.value;
        const confirm = group.get('conPassword')?.value;
        return password === confirm ? null : { passwordMismatch: true };
    };

    onGetProjectList() {
         const companyId = this.authService.isLogIntType().companyid.toString();
        const userId = this.authService.isLogIntType().userid.toString();
        const payload = {
            p_companyid: companyId,
            p_userid: userId,
            p_isactive: null
        };
        this.workService.getProjectListRbac(payload).subscribe({
            next: (res) => {
                this.projectOptions = res.data.data;
            },
            error: (err) => console.error(err)
        });
    }

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

        this.userForm.get('p_pwd')?.disable();
        this.userForm.get('conPassword')?.disable();
        this.userForm.get('p_uname')?.disable();
        const matchedType = this.userRoleOptions.find((u) => u.fieldname === user.usertypename);
        const utypeidValue = matchedType ? matchedType.fieldid : user.usertypeid;

        this.userForm.patchValue({
            p_utypeid: utypeidValue,
            p_uname: user.username,
            p_ufullname: user.fullname,
            p_phone: user.phone,
           p_projectid: (user.projects || []).map((p: any) => p.project_id),
            p_email: user.emailid,
            checked: user.isactive === 'Y'
        });

        if (user.username === 'ADMINISTRATOR') {
            this.userForm.get('p_utypeid')?.disable();
            this.userForm.get('checked')?.disable();
        } else if (user.username !== 'ADMINISTRATOR' && user.usertypename === 'ADMINISTRATOR') {
            this.userForm.get('p_utypeid')?.enable();
            this.userForm.get('checked')?.enable();
        } else if (this.loggedInUserRole == 'ADMINISTRATOR' && user.username !== 'ADMINISTRATOR') {
            this.userForm.get('p_utypeid')?.enable();
            this.userForm.get('checked')?.enable();
        } else if (user.usertypename !== 'ADMINISTRATOR') {
            this.userForm.get('p_utypeid')?.disable();
            this.userForm.get('checked')?.disable();
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
    onGetUserList() {
        const username = this.authService.isLogIntType().username.toString();

        const payload: GetUserDetail = {
            p_ufullname: '',
            p_uname: username,
            p_pwd: '',
            p_active: '',
            p_operationtype: 'GETUSER',
            p_phone: '',
            p_utypeid: '',
            p_email: '',
            p_oldpwd: '',
            p_companyid: this.authService.isLogIntType()?.companyid,
            p_projects: []
        };
        this.userService.OnUserHeaderCreate(payload).subscribe({
            next: (res) => {
                this.user = res.data || [];
                if (this.loggedInUserRole === 'ADMINISTRATOR' || this.loggedInUserRole === 'ADMINISTRATOR') {
                    this.filteredUser = [...this.user];
                } else {
                    this.filteredUser = this.user.filter((u) => u.username === this.loggedInUserName);
                }
            },
            error: (err) => {
                console.error(err);
            }
        });
    }
    onUserCreation(data: any) {
        console.log(data);
        const companyId = this.authService.isLogIntType().companyid;
        const payload: GetUserDetail = {
            p_operationtype: this.editMode ? 'UPDATE' : 'INSERT',
            p_ufullname: data.p_ufullname,
            p_uname: data.p_uname,
            p_pwd: data.p_pwd,
            p_active: data.checked ? 'Y' : 'N',
            p_phone: '',
            p_utypeid: data.p_utypeid.toString(),
            p_email: data.p_email,
            p_oldpwd: '',
            p_companyid: companyId,
            p_projects: (data.p_projectid || []).map((id:number)=>({project_id:id}))
        };

        this.userService.OnUserHeaderCreate(payload).subscribe({
            next: (res) => {
                this.showSuccess(res.data.msg);
                this.visibleDialog = false;
                this.onGetUserList();
            },
            error: (err) => {
                console.error('API error', err);
            }
        });
    }

    removeItem(row: any) {
        console.log('row', row);
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            accept: () => {
                const payload: RemovedParamterBased = {
                    p_returntype: 'USER',
                    p_returnvalue: row.userid,
                    p_username: '',
                    p_companyid: this.authService.isLogIntType().companyid.toString()
                };
                this.userService.removeDataParameter(payload).subscribe({
                    next: (res) => {
                        this.showSuccess(res.data.message);
                        this.onGetUserList();
                    }
                });
            },
            reject: () => {}
        });
    }

    /** ✅ Submit Form **/
    onSubmit() {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
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

    createDropdownPayload(returnType: string, returnValue: string = ''){
        const username = this.authService.isLogIntType()?.userid.toString();
        return {
            p_returntype: returnType,
            p_returnvalue: returnValue,
            p_username: username
        };
    }
    onGetUserRole() {
        const payload = this.createDropdownPayload('USERTYPEALL', this.industryType);
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => (this.userRoleOptions = res.data),
            error: (err) => console.log(err)
        });
    }

    resetTable(table: any): void {
        table.reset();
        this.filterInputs.forEach((input) => (input.nativeElement.value = ''));
        this.globalFilter = '';
        this.filteredUser = this.getVisibleUsers();
    }

    private getVisibleUsers(): any[] {
        return this.loggedInUserRole === 'ADMINISTRATOR' ? [...this.user] : this.user.filter((user) => user.username === this.loggedInUserName);
    }

    /** 🔁 Reset Filter **/
    clearGlobalFilter(input: HTMLInputElement) {
        input.value = '';
        this.globalFilter = '';
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
}
