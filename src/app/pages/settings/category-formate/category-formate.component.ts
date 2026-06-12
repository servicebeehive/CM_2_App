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
import { ConfirmationService, MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { UserService } from '@/core/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { state } from '@angular/animations';
import { Subject, switchMap } from 'rxjs';

export function gstNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    return gstRegex.test(control.value.toUpperCase()) ? null : { invalidGst: true };
}
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
    countries: any[] = [];
    states: any[] = [];
    cities: any[] = [];
    public getUserDetails = {};
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;

    masterDetails: [] = [];
    loggedInUserRole: string = '';
    pageTitle = 'Category Master';
    addButtonLabel = 'Add Category';
    tableColumns: any[] = [];
    selectedMaster!: string;
    dialogTitle = '';

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private authService: AuthService,
        private inventoryService: InventoryService,
        private userService: UserService,
        private route: ActivatedRoute,
        private messageService: MessageService
    ) {}

private routeChange$ = new Subject<string>();

   ngOnInit() {
    this.initForm();
    this.onGetCountry();
    this.loggedInUserRole = this.authService.isLogIntType().usertypename;
    this.routeChange$.pipe(
        switchMap((master) => {
            this.masterDetails = [];
            this.filterMaster = [];
            this.masterForm.get('master')?.setValue(master);
            this.updateTitleMaster(master);
            this.tableColumns = this.tableConfig[master];

            const payloadType = master === 'customermaster' ? 'CUSTOMERALL' : 'VENDORALL';
            const payload = this.createDropdownPayload(payloadType);
            return this.inventoryService.getdropdowndetails(payload);
        })
    ).subscribe({
        next: (res) => {
            this.masterDetails = res.data || [];
            this.filterMaster = [...this.masterDetails];
        }
    });

    this.route.paramMap.subscribe((params) => {
        const master = params.get('master') || 'categorymaster';
        this.routeChange$.next(master);
    });
}

    initForm() {
        this.masterForm = this.fb.group({
            master: ['categorymaster'],
            checked: [true]
        });
    }

    allowOnlyDigits(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char)) {
            event.preventDefault();
        }
    }

    updateTitleMaster(master: string) {
        switch (master) {
            case 'customermaster':
                this.pageTitle = 'Customer Master';
                this.addButtonLabel = 'Add Customer';
                break;

            case 'suppliermaster':
                this.pageTitle = 'Supplier Master';
                this.addButtonLabel = 'Add Supplier';
                break;
        }
    }

    masterPayloadMap: Record<string, string> = {
        customermaster: 'CUSTOMERMASTER',
        suppliermaster: 'SUPPLIERMASTER'
    };

    tableConfig: Record<string, any[]> = {
        customermaster: [
            { field: 'customername', header: 'Name', width: '300px' },
            { field: 'customerphone', header: 'Phone' },
            { field: 'customergstno', header: 'Gst No' },
            { field: 'customercity', header: 'City' },
            { field: 'isactive', header: 'Active', width: '80px' }
        ],
        suppliermaster: [
            { field: 'suppliername', header: 'Name', width: '300px' },
            { field: 'supplierphone', header: 'Phone' },
            { field: 'suppliergstno', header: 'Gst No' },
            { field: 'suppliercity', header: 'City' },
            { field: 'isactive', header: 'Active', width: '80px' }
        ]
    };
    /** ✳️ Add User Dialog **/
    openUserDialog() {
        if (!this.masterForm) return;
        this.selectedMaster = this.masterForm.get('master')?.value ?? 'categorymaster';
        this.addControlsByMaster(this.selectedMaster);
        this.editMode = false;
        this.selectedUser = null;
        const dialogTitleMap: Record<string, string> = {
            customermaster: 'Add Customer',
            suppliermaster: 'Add Supplier'
        };
        this.dialogTitle = dialogTitleMap[this.selectedMaster] ?? 'Add';
        this.visibleDialog = true;
    }
    addControlsByMaster(master: string) {
        Object.keys(this.masterForm.controls).forEach((key) => {
            if (key !== 'master' && key !== 'checked') {
                this.masterForm.removeControl(key);
            }
        });

        if (master === 'customermaster') {
            this.masterForm.addControl('customername', this.fb.control('', Validators.required));
            this.masterForm.addControl('customeraddress', this.fb.control('', Validators.required));
            this.masterForm.addControl('countryforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('stateforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('cityforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('customerpincode', this.fb.control('', Validators.required));
            this.masterForm.addControl('customerphone', this.fb.control('', [Validators.required,Validators.pattern(/^[6-9]\d{9}$/)]));
            this.masterForm.addControl('customeremail', this.fb.control(''));
            this.masterForm.addControl('customergstno', this.fb.control('', [gstNumberValidator]));
            this.masterForm.addControl('customercontactname', this.fb.control(''));
            this.masterForm.addControl('customercontactphone', this.fb.control('', Validators.pattern(/^[6-9]\d{9}$/)));
            this.masterForm.addControl('customercontactemail', this.fb.control('', [Validators.email]));
        }

        if (master === 'suppliermaster') {
            this.masterForm.addControl('suppliername', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplieraddress', this.fb.control('', Validators.required));
            this.masterForm.addControl('countryforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('stateforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('cityforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplierpincode', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplierphone', this.fb.control('', [Validators.required,Validators.pattern(/^[6-9]\d{9}$/)]));
            this.masterForm.addControl('supplieremail', this.fb.control('', [Validators.email]));
            this.masterForm.addControl('suppliergstno', this.fb.control('', [gstNumberValidator]));
            this.masterForm.addControl('suppliercontactname', this.fb.control(''));
            this.masterForm.addControl('suppliercontactphone', this.fb.control('', Validators.pattern(/^[6-9]\d{9}$/)));
            this.masterForm.addControl('suppliercontactemail', this.fb.control('', [Validators.email]));
        }
        this.masterForm.updateValueAndValidity();
    }
    resetFormByMaster(master: string) {
        this.masterForm.reset({ checked: true });
        switch (master) {
            case 'customermaster':
                break;

            case 'suppliermaster':
                break;
        }
    }

    openEditDialog(row: any) {
        const master = this.masterForm.get('master')?.value;
        this.selectedMaster = master;
        this.addControlsByMaster(master);
        this.visibleDialog = true;
        this.editMode = true;
        this.selectedUser = row;

        if (master === 'customermaster') {
            this.masterForm.patchValue({
                customername: row.customername,
                customeraddress: row.customeraddress,
                customerpincode: row.customerpincode,
                customerphone: row.customerphone,
                customeremail: row.customeremail,
                customergstno: row.customergstno,
                customercontactname: row.customercontactperson,
                customercontactphone: row.customercontactphone,
                customercontactemail: row.customercontactemail,
                checked: row.isactive === 'Y'
            });
             const country = this.countries.find(c =>
            c.country_name?.toLowerCase() === row.customercountry?.toLowerCase()
        );
        if (country) {
            this.masterForm.patchValue({ countryforall: country.country_id });
            this.onGetStateForEdit(country.country_id, row.customerstate, row.customercity);
        }
        
        } else if (master === 'suppliermaster') {
            this.masterForm.patchValue({
                suppliername: row.suppliername,
                supplieraddress: row.supplieraddress,
                supplierpincode: row.supplierpincode,
                supplierphone: row.supplierphone,
                supplieremail: row.supplieremail,
                suppliergstno: row.suppliergstno,
                suppliercontactname: row.suppliercontactperson,
                suppliercontactphone: row.suppliercontactphone,
                suppliercontactemail: row.suppliercontactemail,
                checked: row.isactive === 'Y'
            });
             const country = this.countries.find(c =>
            c.country_name?.toLowerCase() === row.suppliercountry?.toLowerCase()
        );
        if (country) {
            this.masterForm.patchValue({ countryforall: country.country_id });
            this.onGetStateForEdit(country.country_id, row.supplierstate, row.suppliercity);
        }
        }
    }

removeItem(row: any) {
        console.log('row', row);  
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            accept: () => {
                const master = this.masterForm.get('master')?.value;
                const username = this.authService.isLogIntType().username;
                let api$;
                if(master === 'customermaster'){
                     const payload = {
                    p_type: "CUSTOMER",
                    p_transaction_id: row.customerid,
                    p_username: username
                };
                api$ = this.inventoryService.deletetransaction(payload);
                }else{
                    const payload = {
                    p_type: "SUPPLIER",
                    p_transaction_id: row.supplierid,
                    p_username: username
                };
                api$ = this.inventoryService.deletetransaction(payload);
                }
                api$.subscribe({
                    next: (res) => {
                        this.showSuccess(res.data.message);
                        this.onGetDataList();
                    }
                });
            },
            reject: () => {}
        });
    }

    closeDialog() {
        this.visibleDialog = false;
        this.editMode = false;
        this.selectedUser = null;
    }
   
    loadMasterData(masterKey: string) {
        const payloadType = this.masterPayloadMap[masterKey];
        if (!payloadType) return;
        const payload = this.createDropdownPayload(payloadType);
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                this.masterDetails = res.data || [];
                this.filterMaster = [...this.masterDetails];
            },
            error: (err) => console.log(err)
        });
    }
    onUserCreation(data: any) {
        const username = this.authService.isLogIntType().username;
        const master = this.masterForm.get('master')?.value;
        const countryName = this.countries.find(c=> c.country_id === data.countryforall)?.country_name ?? '';
        const stateName = this.states.find(s=> s.state_id === data.stateforall)?.state_name ?? '';
        const cityName = this.cities.find(c=> c.city_id === data.cityforall)?.city_name ?? '';

        let apicall$;
        if (master === 'customermaster') {
            const payload = {
                p_customerid: this.editMode ? this.selectedUser.customerid : 0,
                p_customername: data.customername,
                p_customeraddress: data.customeraddress,
                p_customercountry: countryName,
                p_customerstate: stateName,
                p_customercity: cityName,
                p_customerpincode: data.customerpincode,
                p_customerphone: data.customerphone,
                p_customeremail: data.customeremail,
                p_customergstno: data.customergstno,
                p_customercontactperson: data.customercontactname,
                p_customercontactphone: data.customercontactphone,
                p_customercontactemail: data.customercontactemail,
                p_isactive: data.checked ? 'Y' : 'N',
                p_username: username
            };
            apicall$ = this.inventoryService.upsertcustomermaster(payload);
        } else if (master === 'suppliermaster') {
            const payload: any = {
                p_supplierid: this.editMode ? this.selectedUser.supplierid : 0,
                p_suppliername: data.suppliername,
                p_supplieraddress: data.supplieraddress,
                p_suppliercountry: countryName,
                p_supplierstate: stateName,
                p_suppliercity: cityName,
                p_supplierpincode: data.supplierpincode,
                p_supplierphone: data.supplierphone,
                p_supplieremail: data.supplieremail,
                p_suppliergstno: data.suppliergstno,
                p_suppliercontactperson: data.suppliercontactname,
                p_suppliercontactphone: data.suppliercontactphone,
                p_suppliercontactemail: data.suppliercontactemail,
                p_isactive: data.checked ? 'Y' : 'N',
                p_username: username
            };
            apicall$ = this.inventoryService.upsertsuppliermaster(payload);
        } else {
            return;
        }
        apicall$.subscribe({
            next: (res) => {
                this.visibleDialog = false;
                this.showSuccess(res.data.message);
                this.onGetDataList();
            },
            error: (err) => {
                console.error('API error', err);
            }
        });
    }

    onGetDataList() {
        const master = this.masterForm.get('master')?.value;
        
         this.masterDetails = [];
    this.filterMaster = [];

        let apicall$;
        if (master === 'customermaster') {
            const payload = this.createDropdownPayload('CUSTOMERALL');
            apicall$ = this.inventoryService.getdropdowndetails(payload);
        } else if (master === 'suppliermaster') {
            const payload = this.createDropdownPayload('VENDORALL');
            apicall$ = this.inventoryService.getdropdowndetails(payload);
        } else {
            return;
        }
        apicall$.subscribe({
            next: (res) => {
                this.masterDetails = res.data || [];
                this.filterMaster=[...this.masterDetails];
            },
            error: (err) => console.log(err)
        });
    }

    onGetCountry() {
        const payload = this.createDropdownPayload('COUNTRY');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                this.countries = res.data || [];
            },
            error: (err) => console.log(err)
        });
    }

onGetStateForEdit(countryId: any, stateName: string, cityName: string) {
    const payload = {
        p_returntype: 'STATE',
        p_returnvalue: countryId
    };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res) => {
            this.states = res.data || [];

            // ✅ Match state by name
            const state = this.states.find(s =>
                s.state_name?.toLowerCase() === stateName?.toLowerCase()
            );
            if (state) {
                this.masterForm.patchValue({ stateforall: state.state_id });
                this.onGetCityForEdit(state.state_id, cityName);
            } else {
                console.log('State not found for:', stateName);
            }
        },
        error: (err) => console.log(err)
    });
}

onGetCityForEdit(stateId: any, cityName: string) {
    const payload = {
        p_returntype: 'CITY',
        p_returnvalue: stateId
    };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res) => {
            this.cities = res.data || [];

            // ✅ Match city by name
            const city = this.cities.find(c =>
                c.city_name?.toLowerCase() === cityName?.toLowerCase()
            );
            if (city) {
                this.masterForm.patchValue({ cityforall: city.city_id });
            } else {
                console.log('City not found for:', cityName);
            }
        },
        error: (err) => console.log(err)
    });
}

    onGetStateChange(data: any) {
        const stateId = data.value;
        this.masterForm.patchValue({
            cityforall: ''
        });
        this.cities = [];

        if (!stateId) {
            return;
        }

        const payload = {
            ...this.getUserDetails,
            p_returntype: 'CITY',
            p_returnvalue: stateId
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    this.cities = res.data;
                    this.masterForm.patchValue({
                        cityforall: res.data[0].city_id
                    });
                }
            },
            error: (err) => console.log(err)
        });
    }

    onCountryChange(event: any) {
        const countryId = event.value;
        const payload = {
            p_returntype: 'STATE',
            p_returnvalue: countryId
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    this.states = res.data;
                }
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
        const value = this.globalFilter?.toLowerCase().trim();
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

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}

