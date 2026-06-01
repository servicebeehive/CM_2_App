import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-access-control',
    imports: [CommonModule, FormsModule, DropdownModule, CheckboxModule, ButtonModule, ConfirmDialogModule, TooltipModule],
    templateUrl: './access-control.component.html',
    styleUrl: './access-control.component.scss',
    providers: [ConfirmationService]
})
export class AccessControlComponent {
    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}
    roleOptions: any[] = [];
    selectedRole: any = null;
    allPermissions: any[] = [];
    availablePermissions: any[] = [];
    restrictPermissions: any[] = [];

    ngOnInit() {
        // this.loadDropdown('ACCESSPERMISSION', 'allPermissions', '');
        // this.loadDropdown('ACCESSUSERPROFILE', 'roleOptions', '');
        this.availablePermissions = JSON.parse(JSON.stringify(this.allPermissions));
    }
    // loadDropdown(type: string, key: 'roleOptions' | 'allPermissions' | 'restrictPermissions', value: string) {
    //     const payload: DropdownParamter = {
    //         returnType: type,
    //         returnValue: value,
    //         username: ''
    //     };

    //     this.setupService.onDropdownDetails(payload).subscribe({
    //         next: (res) => {
    //             this[key] = res.data;
    //             if (type === 'ACCESSPERMISSION') {
    //                 this.availablePermissions = this.clonePermissions(this.allPermissions);
    //             }
    //             if (type === 'ACCESSCONTROL') {
    //                 this.restrictPermissions = this.allPermissions.filter((p) => res.data.some((a:any) => a.access_name === p.access_name)).map(p=>({...p, selected:false}));
    //                 this.availablePermissions = this.allPermissions.filter((p)=> !this.restrictPermissions.some((r)=> r.access_name === p.access_name)).map(p=>({...p,selected:false}));
    //             }
    //         }
    //     });
    // }

    onRoleChange() {
        const selectedUser = this.roleOptions.find((r) => r.profileid === this.selectedRole);
        const value = selectedUser?.profilename ?? '';
         this.restrictPermissions = [];
    this.availablePermissions = this.clonePermissions(this.allPermissions);
        // this.loadDropdown('ACCESSCONTROL', 'restrictPermissions', value);
    }

  private clonePermissions(permissions:any[]):any[]{
    return permissions.map(p=>({ ...p,selected:false}))
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
        const payload: any = {
            profileId: this.selectedRole,
            permission: this.restrictPermissions.map(p=>p.permissionid),
            created: 1
        };
        this.showSuccess('Access provided successfully');
        // this.setupService.onSubmitSecurity(payload).subscribe({
        //     next: (res) => {
        //         console.log(res);
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

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
}
