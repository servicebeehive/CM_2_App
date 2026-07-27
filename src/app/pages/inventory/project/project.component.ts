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
import { SelectModule } from 'primeng/select';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';

@Component({
    selector: 'app-project',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, CheckboxModule, DialogModule, ConfirmDialogModule, SelectModule, GlobalFilterComponent],
    templateUrl: './project.component.html',
    styleUrl: './project.component.scss',
    providers: [ConfirmationService]
})
export class ProjectComponent {
    projectForm!: FormGroup;
    visibleDialog = false;
    project: any[] = [];
    filteredUser: any[] = [];
    filterValue = '';
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;
    siteIncharge: any[] = [];
    projectInchargeOptions: any[] = [];
    mobileOptions: any[] = [];
    companyId = '';

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private authService: AuthService,
        private inventoryService: InventoryService
    ) {}

    ngOnInit() {
        this.initForm();
        this.filteredUser = [...this.project];
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.onGetProjectList();
        this.loadDropdown('PROJECTINCHARGE', 'projectInchargeOptions');
        this.loadDropdown('SITEADMIN', 'mobileOptions');
    }

    initForm() {
        this.projectForm = this.fb.group({
            p_pname: ['', [Validators.required, Validators.maxLength(100)]],
            p_plocation: ['', Validators.required],
            p_deliverylocation: ['', Validators.required],
            p_pincharge: [''],
            p_cordinates: ['', Validators.pattern(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/)],
            p_range: ['', [Validators.pattern(/^[0-9]{1,4}$/)]],
            p_admincharges: [''],
            checked: [true]
        });
    }

    loadDropdown(type: string, key: 'projectInchargeOptions' | 'mobileOptions' | 'siteIncharge') {
        const payload = {
            returnType: type,
            returnValue: '',
            username: '',
            option1: this.companyId,
            option2: ''
        };

        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                this[key] = res.data;
            }
        });
    }

    onRangeInput(event: any) {
        let value = event.target.value;
        value = value.replace(/[^0-9]/g, '');
        value = value.substring(0, 3);
        event.target.value = value;
        this.projectForm.get('p_range')?.setValue(value);
    }

    openUserDialog() {
        this.visibleDialog = true;
        this.editMode = false;
        this.siteIncharge = [];
        this.loadDropdown('PROJECTINCHARGE', 'projectInchargeOptions');
        this.loadDropdown('SITEADMIN', 'mobileOptions');
        this.projectForm.reset({ checked: true });
        this.projectForm.get('p_pname')?.enable();
        this.projectForm.get('checked')?.enable();
    }

    openEditDialog(user: any) {
        console.log('user', user);
        this.visibleDialog = true;
        this.editMode = true;
        this.selectedUser = user;
        this.siteIncharge = [];
        const loginId = this.authService.isLogIntType().userid;
        const payload = {
            returnType: 'PROJECTINCHARGE',
            returnValue: '',
            username: '',
            option1: this.companyId,
            option2: ''
        };
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                this.projectInchargeOptions = res.data;
                if (user.project_id) {
                    const alreadyInList = this.projectInchargeOptions.some((x) => x.userid === user.project_incharge_id);
                    if (!alreadyInList) {
                        this.projectInchargeOptions = [
                            {
                                userid: user.project_incharge_id,
                                fullname: user.project_incharge_name,
                                mobileno: user.mobileno
                            },
                            ...this.projectInchargeOptions
                        ];
                    }
                }
            }
        });
        this.loadDropdown('SITEADMIN', 'mobileOptions');
        const sitePayload = {
            returnType: 'PROJECTSITEADMIN',
            returnValue: this.selectedUser.project_id,
            username: loginId,
            option1: this.companyId,
            option2: ''
        };
        this.inventoryService.getdropdowndetails(sitePayload).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    this.siteIncharge = res.data.map((item: any) => ({
                        userid: item.staff_id,
                        psiteinchargename: item.staff_name,
                        psiteinchargemobile: item.staff_mobile
                    }));

                    setTimeout(() => {
                        res.data.forEach((item: any) => {
                            const alreadyExists = this.mobileOptions.some((m: any) => m.userid === item.staff_id);
                            if (!alreadyExists) {
                                this.mobileOptions = [
                                    ...this.mobileOptions,
                                    {
                                        userid: item.staff_id,
                                        fullname: item.staff_name,
                                        mobileno: item.staff_mobile
                                    }
                                ];
                            }
                        });
                    }, 100);
                } else {
                    this.siteIncharge = [];
                }
            }
        });

        this.projectForm.patchValue({
            p_pname: user.project_name,
            p_plocation: user.location,
            p_deliverylocation: user.delivery_location,
            p_pincharge: user.project_incharge_id,
            p_cordinates: user.project_coordinates,
            p_range: user.range,
            p_admincharges: user.admin_charge,
            checked: user.is_active === 'Y'
        });
        this.projectForm.updateValueAndValidity();
    }

    getAvailableMobileOptions(currentRow: any) {
        const selectedIds = this.siteIncharge.filter((row: any) => row !== currentRow && row.userid != null).map((row: any) => row.userid);
        return this.mobileOptions.filter((option: any) => !selectedIds.includes(option.userid));
    }

    closeDialog() {
        this.visibleDialog = false;
        this.editMode = false;
        this.selectedUser = null;
        this.loadDropdown('PROJECTINCHARGE', 'projectInchargeOptions');
        this.loadDropdown('SITEADMIN', 'mobileOptions');
    }

    onGetProjectList() {
        const payload = {
            isActive: '',
            companyId: this.companyId
        };
        this.inventoryService.getProjectList(payload).subscribe({
            next: (res) => {
                this.project = Array.isArray(res?.data.data) ? res.data.data : [];
                this.filteredUser = [...this.project];
            },
            error: (err) => {
                console.error(err);
            }
        });
    }

    onUserCreation(data: any) {
        const payload = {
            companyId: this.companyId,
            projectId: this.editMode ? this.selectedUser.project_id : 0,
            projectName: data.p_pname,
            location: data.p_plocation,
            deliveryLocation: data.p_deliverylocation,
            isActive: data.checked ? 'Y' : 'N',
            projectRange: data.p_range,
            projectInchargeId: data.p_pincharge,
            adminCharges: data.p_admincharges,
            projectOrdinates: data.p_cordinates,
            userId: 1,
            staffJson: (this.siteIncharge || [])
                .filter((x: any) => x.userid)
                .map((x: any) => ({
                    userid: x.userid,
                    psiteinchargename: x.fullname,
                    psiteinchargemobile: x.mobileno
                }))
        };
        this.inventoryService.upsertProject(payload).subscribe({
            next: (res: any) => {
                const newProject = {
                    project_name: data.p_pname,
                    location: data.p_plocation,
                    project_incharge_id: data.p_pincharge,
                    is_active: data.checked ? 'Y' : 'N'
                };

                if (this.editMode && this.selectedUser) {
                    const index = this.project.indexOf(this.selectedUser);
                    if (index !== -1) {
                        this.project[index] = {
                            ...this.project[index],
                            ...newProject
                        };
                    }
                } else {
                    this.project.push(newProject);
                }
                let severity, summary;
                if (res.data.success === true) {
                    severity = 'success';
                    summary = 'Success';
                } else {
                    severity = 'error';
                    summary = 'failed';
                }
                this.showMessage(severity, summary, res.data.msg);
                this.filteredUser = [...this.project];
                this.visibleDialog = false;
                this.selectedUser = null;
                this.onGetProjectList();
            },
            error: (err) => {
                console.log('Error', err);
            }
        });
    }

    deleteRow(data: any) {
        this.confirmationService.confirm({
            header: 'Confirm',
            message: 'Are you sure you want to delete this project?',
            accept: () => {
                const username = this.authService.isLogIntType().userid;
                const payload = {
                    returnType: 'REMOVEPROJECT',
                    returnValue: data.project_id,
                    username: username,
                    companyId: this.companyId
                };
                // this.setupService.onDeleteData(payload).subscribe({
                //     next: (res) => {
                //         let severity, summary;
                //         if (res.data.status === 'FAILED') {
                //             severity = 'error';
                //             summary = 'failed';
                //             this.showMessage(severity, summary, res.data.message);
                //         } else {
                //             severity = 'success';
                //             summary = 'Success';
                //         }
                //             this.showMessage(severity, summary, res.data.message);
                //             const index = this.project.indexOf(data);
                //             if (index !== -1) {
                //                 this.project.splice(index, 1);
                //                 this.filteredUser = [...this.project];
                //         }
                //     }
                // });
            }
        });
    }

    onMobileSelect(event: any, l: any) {
        const selection = this.mobileOptions.find((m: any) => m.userid === event.value);
        if (selection) {
            l.userid = selection.userid;
            l.psiteinchargename = selection.fullname;
            l.psiteinchargemobile = selection.mobileno;
        }
    }

    addSiteInchargeMobile(row: any) {
        const mobile = this.filterValue.trim();
        if (mobile.length !== 10) return;
        const exists = this.mobileOptions.some((x: any) => x.fieldname === mobile);
        if (exists) return;
        const newItem = {
            fieldid: mobile,
            fieldname: mobile
        };
        row.psiteinchargemobile = newItem.fieldid;
        this.filterValue = '';
    }

    isSubmitDisabled(): boolean {
        if (!this.siteIncharge || this.siteIncharge.length === 0) return false;
        return this.siteIncharge.some((incharge: any) => !incharge.userid);
    }

    onSubmit() {
        if (this.projectForm.invalid) {
            this.projectForm.markAllAsTouched();
            return;
        }
        this.onUserCreation(this.projectForm.getRawValue());
    }

    addRow() {
        this.siteIncharge.push({ userid: null, psiteinchargename: null, psiteinchargemobile: null });
    }

    removeRow(index: number) {
        this.siteIncharge.splice(index, 1);
    }

    applyGlobalFilter() {
        this.applyGlobalFilterManual();
    }

    applyGlobalFilterManual() {
        const value = this.globalFilter.toLowerCase();
        if (!value) {
            this.filteredUser = [...this.project];
            return;
        }
        this.filteredUser = this.project.filter((project) => Object.values(project).some((v) => String(v).toLowerCase().includes(value)));
    }

    clearGlobalFilter(input: HTMLInputElement) {
        input.value = '';
        this.globalFilter = '';
    }

    showMessage(severity: string, summary: string, message: string) {
        this.messageService.add({ severity: severity, summary: summary, detail: message });
    }
}
