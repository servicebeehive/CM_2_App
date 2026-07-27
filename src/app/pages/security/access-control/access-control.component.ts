import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
// import { AccessPermission, AccessUserProfile, DropdownParamter, SubmitSecurity } from '@/core/models/setup.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { UserService } from '@/core/services/user.service';
import { UpsertPermission } from '@/core/models/inventory.model';

@Component({
    selector: 'app-access-control',
    imports: [CommonModule, FormsModule, DropdownModule, CheckboxModule, ButtonModule, ConfirmDialogModule, TooltipModule, RadioButtonModule],
    templateUrl: './access-control.component.html',
    styleUrl: './access-control.component.scss',
    providers: [ConfirmationService]
})
export class AccessControlComponent {
    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private authService: AuthService,
        private inventoryService: InventoryService,
        private userService: UserService
    ) {}
    roleOptions: any[] = [];
    selectedRole: any = null;
    allPermissions:any[] = [];
    availablePermissions: any[] = [];
    restrictPermissions: any[] = [];
    selectedAccess: string = 'M';
    companyId = '';
    industryType = '';

    ngOnInit() {
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.industryType = this.authService.isLogIntType()?.industry_type_id.toString();
        this.loadDropdown('ACCESSPERMISSION', 'allPermissions', this.selectedAccess);
        this.loadDropdown('USERTYPEALL', 'roleOptions', this.industryType);
        this.availablePermissions = JSON.parse(JSON.stringify(this.allPermissions));
    }

    onAccessChange() {
        this.allPermissions = [];
        this.restrictPermissions = [];
        this.availablePermissions = [];
        this.loadDropdown('ACCESSPERMISSION', 'allPermissions', this.selectedAccess);
    }
    loadDropdown(type: string, key: 'roleOptions' | 'allPermissions' | 'restrictPermissions', value: string) {
        const payload: any = {
            p_returntype: type,
            p_returnvalue: value,
            p_username: this.industryType,
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this[key] = res.data;
                if (type === 'ACCESSPERMISSION') {
                    this.availablePermissions = this.clonePermissions(this.allPermissions);
                    if (this.selectedRole) {
                        const selectedUser = this.roleOptions.find((r) => r.usertypeid === this.selectedRole);
                        const value = selectedUser.usertypecode;
                        this.loadDropdown('ACCESSCONTROL', 'restrictPermissions', value);
                    }
                }
                if (type === 'ACCESSCONTROL') {
                    this.restrictPermissions = this.allPermissions.filter((p) => res.data.some((a: any) => a.access_name === p.access_name)).map((p) => ({ ...p, selected: false }));
                    this.availablePermissions = this.allPermissions.filter((p) => !this.restrictPermissions.some((r) => r.permissionid === p.permissionid)).map((p) => ({ ...p, selected: false }));
                }
            }
        });
    }

    onRoleChange() {
        const selectedUser = this.roleOptions.find((r) => r.usertypeid === this.selectedRole);
        const value = selectedUser.usertypecode;
        this.restrictPermissions = [];
        this.availablePermissions = this.clonePermissions(this.allPermissions);
        this.loadDropdown('ACCESSCONTROL', 'restrictPermissions', value);
        console.log('rest',this.restrictPermissions, this.allPermissions)
    }

    private clonePermissions(permissions: any[]): any[] {
        return permissions.map((p) => ({ ...p, selected: false }));
    }

    moveSelectedToRight() {
        const selected = this.availablePermissions.filter((p) => p.selected);
        this.restrictPermissions.push(...selected.map((x) => ({ ...x, selected: false })));
        this.availablePermissions = this.availablePermissions.filter((p) => !p.selected);
    }

    moveSelectedToLeft() {
        const selected = this.restrictPermissions.filter((p) => p.selected);
        this.availablePermissions.push(...selected.map((x) => ({ ...x, selected: false })));
        this.restrictPermissions = this.restrictPermissions.filter((p) => !p.selected);
    }

    moveAllToRight() {
        this.restrictPermissions.push(...this.availablePermissions.map((x) => ({ ...x, selected: false })));
        this.availablePermissions = [];
    }

    moveAllToLeft() {
        this.availablePermissions.push(...this.restrictPermissions.map((x) => ({ ...x, selected: false })));
        this.restrictPermissions = [];
    }

    onSecuirtyPermission() {
        const userid = this.authService.isLogIntType()?.userid;
        const payload: UpsertPermission = {
            p_companyid: this.companyId,
            p_profileid: this.selectedRole,
            p_permissions: this.restrictPermissions.map((p) => p.permissionid),
            p_type: this.selectedAccess,
            p_created_by: userid
        };

        this.userService.upsertPofilepermission(payload).subscribe({
            next: (res) => {
                let severity, summary;
                if (res.data.status) {
                    severity = res.data.status;
                    summary = 'Success';
                } else {
                    severity = res.data.status;
                    summary = 'failed';
                }
                this.showSuccess(severity, summary, res.data.message);
            }
        });
    }

    submit() {
        this.confirmationService.confirm({
            header: 'Confirmation',
            message: 'Are you sure you want to assign this?',
            accept: () => {
                this.onSecuirtyPermission();
            }
        });
    }

    reset() {
        this.selectedRole = null;
        this.restrictPermissions = [];
        this.availablePermissions = this.clonePermissions(this.allPermissions);
    }

    showSuccess(severity: string, summary: string, message: string) {
        this.messageService.add({ severity: severity, summary: summary, detail: message });
    }
}
