import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';

@Component({
    selector: 'app-rule-detail',
    standalone: true,
    templateUrl: './rule-detail.component.html',
    styleUrls: ['./rule-detail.component.scss'],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, CheckboxModule, DialogModule, ConfirmDialogModule, GlobalFilterComponent],
    providers: [ConfirmationService]
})
export class RuleDetailComponent {
    ruleForm!: FormGroup;
    visibleDialog = false;
    user: any[] = [];
    filteredUser: any[] = [];
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;
    levels: any[] = [];
    ruleOptions: any[] = [];
    usernameOptions: any[] = [];
    expandedIds: Set<number> = new Set();
    primaryRows: any[] = [];
    allGroupedRows: Map<number, any[]> = new Map();
    selectedUserRow: any = null;
    isActiveChecked: boolean = false;
    industryTypeId: string = '';

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private authService: AuthService,
        private messageService: MessageService,
        private inventoryService: InventoryService
    ) {}

    ngOnInit() {
        this.initForm();
        this.industryTypeId = this.authService.isLogIntType().industry_type_id.toString();
        this.onGetDropdown();
        this.filteredUser = [...this.user];
    }

    initForm() {
        this.ruleForm = this.fb.group({
            p_rule: ['', [Validators.required]],
            checked: [true]
        });
    }

    createDropdownPayload(returnType: string, username:string) {
        return {
            p_username: username,
            p_returntype: returnType
        };
    }

    onGetDropdown() {
         this.onGetApproval();
        this.onGetRuleName();
        this.onGetUserProfile();
    }

    onGetApproval() {
        const payload = {
            p_returntype: 'APPROVALLEVEL' ,
            p_returnvalue: this.authService.isLogIntType()?.companyid.toString(),
            p_username: this.authService.isLogIntType()?.userid.toString()
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.user = res.data || [];
                this.buildDisplayRows();
            },
            error: (err) => console.log(err)
        });
    }

    onGetRuleName() {
        const payload = this.createDropdownPayload('RULENAME', this.industryTypeId);
        this.inventoryService.getdropdowndetailsPublic(payload).subscribe({
            next: (res) => (this.ruleOptions = res.data || []),
            error: (err) => console.log(err)
        });
    }

    onGetUserProfile() {
        const payload = this.createDropdownPayload('APPUSERTYPE', this.industryTypeId);
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.usernameOptions = res.data || []),
            error: (err) => console.log(err)
        });
    }

    loadDropdown(type: string, key: 'user' | 'selectedUser', value: string) {
        const loggedInUserName = this.authService.isLogIntType().usertype;
        const payload = {
            returnType: type,
            returnValue: value,
            username: loggedInUserName
        };
    }

    // onChangeActive(event: any) {
    //     if (this.isActiveChecked) {
    //         this.filteredUser = this.user.filter((item: any) => item.is_active === 'Y');
    //     } else {
    //         this.filteredUser = [...this.user];
    //     }
    // }

    /** ✳️ Add User Dialog **/
    openUserDialog() {
        this.visibleDialog = true;
        this.editMode = false;
        this.levels = [];
        this.ruleForm.reset({
            checked: true
        });
    }

    openEditDialog(user: any) {
        console.log('dd', user);
        this.selectedUserRow = user;
        this.visibleDialog = true;
        this.editMode = true;
        this.levels = [];
        const ruleObj = this.ruleOptions.find((r) => r.rule_id === user.rule_id);
        this.ruleForm.patchValue({
            p_rule: ruleObj?.rule_id ?? null,
            checked: user.is_active === 'Y'
        });
        console.log('da', ruleObj);
        this.ruleForm.updateValueAndValidity();

        const payload = {
            p_returntype: 'GETAPPROVALLEVEL',
            p_returnvalue: user.rule_creation_id
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                const data = res.data || [];
                this.levels = data.map((l: any) => ({
                    level_no: l.level_no,
                    pusername: l.profile_id
                }));
                 this.onGetApproval();
            },
            error: (err) => console.log(err)
        });
       
    }

    closeDialog() {
        this.visibleDialog = false;
    }

    onUserCreation(data: any) {
        console.log(data);
        const loggedInUserId = this.authService.isLogIntType().userid;
        const ruleCreationId = this.editMode ? this.selectedUserRow?.rule_creation_id : 0;
        const payload: any = {
            p_rule_id: data.p_rule,
            p_rule_creation_id: ruleCreationId,
            p_levels: (this.levels || [])
                .filter((x: any) => x.level_no)
                .map((x: any) => ({
                    level_no: x.level_no,
                    profile_id: x.pusername
                })),
            p_created_by: loggedInUserId
        };

        this.inventoryService.manageapprovalrulelevels(payload).subscribe({
            next: (res: any) => {
                const ruleObj = this.ruleOptions.find((r) => r.rule_id === data.p_rule);
                const firstLevel = this.levels?.[0];
                const profileObj = this.usernameOptions.find((u: any) => u.fieldid === firstLevel?.pusername);
                const newRule = {
                    profilename: profileObj?.fieldname ?? '',
                    rule_name: ruleObj?.rule_name,
                    is_active: data.checked ? 'Y' : 'N',
                    levels: [...this.levels]
                };
                if (this.editMode && this.selectedUserRow) {
                    const index = this.user.indexOf(this.selectedUserRow);
                    if (index !== -1) {
                        this.user[index] = {
                            ...this.user[index],
                            ...newRule
                        };
                    }
                } else {
                    this.user.push(newRule);
                }
                let severity, summary;
                if (res.data.status) {
                    severity = 'success';
                    summary = 'Success';
                } else {
                    severity = 'error';
                    summary = 'Failed';
                }
                this.showMessage(severity, summary, res.data.message);
                this.buildDisplayRows();
                this.visibleDialog = false;
                this.selectedUserRow = null;
                this.selectedUser = null;
                 this.onGetApproval();
            },
            error: (err) => {
                console.log('Error', err);
            }
        });
    }

    deleteRow(data: any) {
        this.confirmationService.confirm({
            header: 'Confirm',
            message: 'Are you sure you want to delete this profile?',
            accept: () => {
                const username = this.authService.isLogIntType().userid;
                const payload: any = {
                    returnType: 'REMOVERULE',
                    returnValue: data.rule_creation_id,
                    username: username
                };
                // this.setupService.onDeleteData(payload).subscribe({
                //     next:(res)=>{
                //        let severity, summary;
                //         if (res.data.status === 'FAILED') {
                //             severity = 'error';
                //             summary = 'failed';
                //              this.showMessage(severity, summary, res.data.message);
                //         } else {
                //             severity = 'success';
                //             summary = 'Success';
                //              this.showMessage(severity, summary, res.data.message);
                //              this.user = this.user.filter(
                //             (row) => row.rule_creation_id !== data.rule_creation_id
                //         );
                //         }
                //         this.buildDisplayRows();
                //     }
                // });
            }
        });
    }

    /** ✅ Submit Form **/
    onSubmit() {
        if (this.ruleForm.invalid) {
            this.ruleForm.markAllAsTouched();
            return;
        }
        this.onUserCreation(this.ruleForm.getRawValue());
    }

    isSubmitDisabled(): boolean {
        if (!this.levels || this.levels.length === 0) return false;
        return this.levels.some((level: any) => !level.pusername);
    }

    /** 🔍 Global Filter **/
    applyGlobalFilter() {
        this.applyGlobalFilterManual();
    }
    applyGlobalFilterManual() {
        const value = this.globalFilter;
        if (!value) {
            this.filteredUser = [...this.user];
            return;
        }
        this.filteredUser = this.user.filter((user) => Object.values(user).some((v) => String(v).toLowerCase().includes(value)));
    }

    addRow() {
        const nextLevel = (this.levels?.length || 0) + 1;
        this.levels.push({
            level_no: nextLevel,
            pusername: null
        });
    }

    removeRow(index: number) {
        this.levels.splice(index, 1);
    }

  buildDisplayRows(activeOnly: boolean = false) {
    const source = activeOnly ? this.user.filter(r => r.is_active === 'Y') : this.user;

    this.allGroupedRows = new Map();
    for (const row of source) {
        const id = row.rule_creation_id;
        if (!this.allGroupedRows.has(id)) {
            this.allGroupedRows.set(id, []);
        }
        this.allGroupedRows.get(id)!.push(row);
    }

    const seen = new Set();
    this.filteredUser = source.filter((row) => {
        if (seen.has(row.rule_creation_id)) return false;
        seen.add(row.rule_creation_id);
        return true;
    });
}

onChangeActive(event: any) {
    this.buildDisplayRows(this.isActiveChecked);
}

    getGroupCount(id: number): number {
        return this.allGroupedRows.get(id)?.length ?? 0;
    }

    isExpanded(id: number): boolean {
        return this.expandedIds.has(id);
    }

    toggleExpand(id: number) {
        if (this.expandedIds.has(id)) {
            this.expandedIds.delete(id);
        } else {
            this.expandedIds.add(id);
        }
    }

    getSubRows(id: number, primaryRow: any): any[] {
        const group = this.allGroupedRows.get(id) ?? [];
        return group.filter((r) => r !== primaryRow);
    }

    showMessage(severity: string, summary: string, message: string) {
        this.messageService.add({ severity: severity, summary: summary, detail: message });
    }
}
