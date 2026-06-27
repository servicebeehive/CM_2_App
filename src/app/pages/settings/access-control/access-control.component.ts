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
        private authService: AuthService
    ) {}
    roleOptions: any[] = [];
    selectedRole: any = null;
    allPermissions:any[] = [];
    availablePermissions: any[] = [];
    restrictPermissions: any[] = [];
    selectedAccess: string = 'M';
    companyId = '';

    ngOnInit() {
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('ACCESSPERMISSION', 'allPermissions', this.selectedAccess);
        this.loadDropdown('ACCESSUSERPROFILE', 'roleOptions', '');
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
            returnType: type,
            returnValue: value,
            username: '',
            option1: this.companyId,
            option2: ''
        };

        // this.setupService.onDropdownDetails(payload).subscribe({
        //     next: (res) => {
        //         this[key] = res.data;
        //         if (type === 'ACCESSPERMISSION') {
        //             this.availablePermissions = this.clonePermissions(this.allPermissions);
        //             if (this.selectedRole) {
        //                 const selectedUser = this.roleOptions.find((r) => r.profileid === this.selectedRole);
        //                 const value = selectedUser?.profilename ?? '';
        //                 this.loadDropdown('ACCESSCONTROL', 'restrictPermissions', value);
        //             }
        //         }
        //         if (type === 'ACCESSCONTROL') {
        //             this.restrictPermissions = this.allPermissions.filter((p) => res.data.some((a: any) => a.access_name === p.access_name)).map((p) => ({ ...p, selected: false }));
        //             this.availablePermissions = this.allPermissions.filter((p) => !this.restrictPermissions.some((r) => r.access_name === p.access_name)).map((p) => ({ ...p, selected: false }));
        //         }
        //     }
        // });
    }

    onRoleChange() {
        const selectedUser = this.roleOptions.find((r) => r.profileid === this.selectedRole);
        const value = selectedUser?.profilename ?? '';
        this.restrictPermissions = [];
        this.availablePermissions = this.clonePermissions(this.allPermissions);
        this.loadDropdown('ACCESSCONTROL', 'restrictPermissions', value);
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
        const payload: any = {
            companyId: this.companyId,
            profileId: this.selectedRole,
            permission: this.restrictPermissions.map((p) => p.permissionid),
            pType: this.selectedAccess,
            created: userid
        };

        // this.setupService.onSubmitSecurity(payload).subscribe({
        //     next: (res) => {
        //         let severity, summary;
        //         if (res.data.status) {
        //             severity = 'success';
        //             summary = 'Success';
        //         } else {
        //             severity = 'error';
        //             summary = 'failed';
        //         }
        //         this.showSuccess(severity, summary, res.data.message);
        //     }
        // });
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
