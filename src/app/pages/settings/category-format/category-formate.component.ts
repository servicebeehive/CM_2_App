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
import { Subject, switchMap, of } from 'rxjs';
import { RemovedParamterBased } from '@/core/models/inventory.model';
import { MultiSelectModule } from 'primeng/multiselect';

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
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, CheckboxModule, DialogModule, ConfirmDialogModule, RippleModule, GlobalFilterComponent, MultiSelectModule],
    providers: [ConfirmationService]
})
export class CategoryFormateComponent {
    masterForm!: FormGroup;
    visibleDialog = false;
    user: any[] = [];
    filterMaster: any[] = [];
    userRoleOptions: any[] = [];
    countries: any[] = [];
    states: any[] = [];
    cities: any[] = [];
    categoryOptions: any[] = [];
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;

    masterDetails: [] = [];
    pageTitle = 'Category Master';
    addButtonLabel = 'Add Category';
    tableColumns: any[] = [];
    selectedMaster!: string;
    dialogTitle = '';
    paymentOptions: any[] = [
        { label: '15 Days', value: '15 Days' },
        { label: '30 Days', value: '30 Days' },
        { label: '45 Days', value: '45 Days' },
        { label: '60 Days', value: '60 Days' },
        { label: '90 Days', value: '90 Days' }
    ];

    products: { batchid: number; childUOM: any; conversion: number | null }[] = [];
    ChilduomOptions: any[] = [];
    uomTableDisabled = false;
    childUomError = '';

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
        this.onGetCategory();
        this.routeChange$
            .pipe(
                switchMap((master: any) => {
                    this.masterDetails = [];
                    this.filterMaster = [];
                    this.masterForm.get('master')?.setValue(master);
                    this.updateTitleMaster(master);
                    this.tableColumns = this.tableConfig[master];
                    this.loadMasterData(master);
                    this.onGetDataList();

                    if (master === 'customermaster' || master === 'suppliermaster') {
                        const payloadType = master === 'customermaster' ? 'CUSTOMERALL' : 'VENDORALL';
                        const payload = this.createDropdownPayload(payloadType);
                        return this.inventoryService.getdropdowndetails(payload);
                    }
                    return of(null);
                })
            )
            .subscribe({
                next: (res: any) => {
                    if (res) {
                        this.masterDetails = res.data || [];
                        this.filterMaster = [...this.masterDetails];
                    }
                }
            });

        this.route.paramMap.subscribe((params) => {
            const master = params.get('master') || 'categorymaster';
            this.routeChange$.next(master);
        });
        this.loadChildUomOptions();
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
                this.addButtonLabel = 'Add User Type';
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
        categorymaster: 'CATEGORYDETAILS',
        customermaster: 'CUSTOMERALL',
        taxmaster: 'TAXDETAILS',
        uommaster: 'UOM',
        usertype: 'USERTYPEALL',
        suppliermaster: 'SUPPLIERMASTER'
    };

    commonMasterColumns = [
        { field: 'fieldname', header: 'Name', width: '300px' },
        { field: 'fielddesc', header: 'Description' },
        { field: 'isactive', header: 'Active', width: '80px' }
    ];

    tableConfig: Record<string, any[]> = {
        advance: [
            { field: 'fieldname', header: 'Name', width: '300px' },
            { field: 'fielddesc', header: 'Description', width: '500px' },
            { field: 'fieldvalue', header: 'Value' },
            { field: 'isactive', header: 'Active', width: '80px' }
        ],
        categorymaster: [
            { field: 'categoryname', header: 'Name', width: '300px' },
            { field: 'categorydesc', header: 'Description' },
            { field: 'isactive', header: 'Active', width: '80px' }
        ],
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
            { field: 'paymentterm', header: 'Payment Terms' },
            { field: 'prefferedvendor', header: 'Preferred' },
            { field: 'isactive', header: 'Active', width: '80px' }
        ],
        taxmaster: [
            { field: 'taxname', header: 'Name' },
            { field: 'taxtype', header: 'Type', width: '300px' },
            { field: 'taxdesc', header: 'Description' },
            { field: 'taxpercentage', header: 'Percentage' },
            { field: 'isactive', header: 'Active', width: '80px' }
        ],
        uommaster: [
            { field: 'fieldname', header: 'Name', width: '300px' },
            { field: 'uomdesc', header: 'Description' },
            { field: 'isactive', header: 'Active', width: '80px' }
        ],
        usertype: [
            { field: 'usertypename', header: 'Name', width: '300px' },
            { field: 'web_access', header: 'Web Access', width: '80px' },
            { field: 'isactive', header: 'Active', width: '80px' }
        ]
    };
    /** ✳️ Add User Dialog **/
    openUserDialog() {
        if (!this.masterForm) return;
        this.masterForm.enable();
        this.selectedMaster = this.masterForm.get('master')?.value ?? 'categorymaster';
        this.addControlsByMaster(this.selectedMaster);
        this.editMode = false;
        this.selectedUser = null;
        const dialogTitleMap: Record<string, string> = {
            advance: 'Add Advance',
            categorymaster: 'Add Category',
            customermaster: 'Add Customer',
            taxmaster: 'Add Tax',
            uommaster: 'Add UOM',
            usertype: 'Add User Type',
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
            this.masterForm.addControl('customerphone', this.fb.control('', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]));
            this.masterForm.addControl('customeremail', this.fb.control(''));
            this.masterForm.addControl('customergstno', this.fb.control('', [gstNumberValidator]));
            this.masterForm.addControl('customercontactname', this.fb.control(''));
            this.masterForm.addControl('customercontactphone', this.fb.control('', Validators.pattern(/^[6-9]\d{9}$/)));
            this.masterForm.addControl('customercontactemail', this.fb.control('', [Validators.email]));
        }
        if (master === 'advance') {
            this.masterForm.addControl('rulename', this.fb.control('', Validators.required));
            this.masterForm.addControl('ruledesc', this.fb.control('', Validators.required));
            this.masterForm.addControl('rulevalue', this.fb.control('', Validators.required));
        }
        if (master === 'suppliermaster') {
            this.masterForm.addControl('suppliername', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplieraddress', this.fb.control('', Validators.required));
            this.masterForm.addControl('countryforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('stateforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('cityforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('categories', this.fb.control([], Validators.required));
            this.masterForm.addControl('supplierpincode', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplierphone', this.fb.control('', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]));
            this.masterForm.addControl('supplieremail', this.fb.control('', [Validators.email]));
            this.masterForm.addControl('suppliergst', this.fb.control('', [gstNumberValidator]));
            this.masterForm.addControl('suppliercontactname', this.fb.control(''));
            this.masterForm.addControl('suppliercontactphone', this.fb.control('', Validators.pattern(/^[6-9]\d{9}$/)));
            this.masterForm.addControl('suppliercontactemail', this.fb.control('', [Validators.email]));
            this.masterForm.addControl('payment_term', this.fb.control('', Validators.required));
            this.masterForm.addControl('preferred_vendor', this.fb.control(true, Validators.required));
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
        }
        if (master === 'categorymaster') {
            this.masterForm.addControl('p_categoryname', this.fb.control('', Validators.required));
            this.masterForm.addControl('p_categorydesc', this.fb.control('', Validators.required));
        }
        if (master === 'usertype') {
            this.masterForm.addControl('p_usertype', this.fb.control('', Validators.required));
            this.masterForm.addControl('is_approval', this.fb.control(true));
            this.masterForm.addControl('web_access', this.fb.control(true));
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

    openEditDialog(row: any) {
        const master = this.masterForm.get('master')?.value;
        this.selectedMaster = master;
        this.addControlsByMaster(master);
        this.visibleDialog = true;
        this.editMode = true;
        this.selectedUser = row;
        console.log(row);
        const patchMap: Record<string, any> = {
            categorymaster: {
                p_categoryname: row.categoryname,
                p_categorydesc: row.categorydesc,
                checked: row.isactive === 'Y'
            },
            customermaster: {
                customername: row.customername,
                customeraddress: row.customeraddress,
                countryforall: row.customercountry,
                stateforall: row.customerstate,
                cityforall: row.customercity,
                customerpincode: row.customerpincode,
                customerphone: row.customerphone,
                customeremail: row.customeremail,
                customergstno: row.customergstno,
                customercontactname: row.customercontactperson,
                customercontactphone: row.customercontactphone,
                customercontactemail: row.customercontactemail,
                checked: row.isactive === 'Y'
            },
            suppliermaster: {
                suppliername: row.suppliername,
                supplieraddress: row.supplieraddress,
                countryforall: row.suppliercountry,
                stateforall: row.supplierstate,
                cityforall: row.suppliercity,
                supplierpincode: row.supplierpincode,
                supplierphone: row.supplierphone,
                supplieremail: row.supplieremail,
                suppliergst: row.suppliergstno,
                suppliercontactname: row.suppliercontactperson,
                suppliercontactphone: row.suppliercontactphone,
                suppliercontactemail: row.suppliercontactemail,
                payment_term: row.paymentterm,
                categories: (row.categories || []).map((c:any)=> c.categoryid),                preferred_vendor: row.prefferedvendor === 'Y',
                checked: row.isactive === 'Y'
            },
            taxmaster: {
                taxname: row.fieldname,
                taxdesc: row.fielddesc,
                taxtype: row.taxtype,
                taxpercentage: row.taxpercentage,
                checked: row.isactive === 'Y'
            },
            uommaster: {
                uomname: row.fieldname,
                uomdesc: row.uomdesc,
                checked: row.isactive === 'Y'
            },
            usertype: {
                p_usertype: row.usertypename,
                checked: row.isactive === 'Y',
                web_access: row.web_access === 'Y',
                is_approval: row.is_approval === 'Y'
            },
            advance: {
                rulename: row.fieldname,
                ruledesc: row.fielddesc,
                rulevalue: row.fieldvalue,
                checked: row.isactive === 'Y'
            }
        };

        const patch = patchMap[this.selectedMaster];
        if (patch) {
            this.masterForm.patchValue(patch);

            if (master === 'customermaster' || master === 'suppliermaster') {
                const countryName = master === 'customermaster' ? row.customercountry : row.suppliercountry;
                const stateName = master === 'customermaster' ? row.customerstate : row.supplierstate;
                const cityName = master === 'customermaster' ? row.customercity : row.suppliercity;
                this.patchLocationDropdowns(countryName, stateName, cityName);
            }

            if(master === 'usertype') {
                const lockedFields = ['p_usertype', 'is_approval', 'checked'];
                if(row.is_deleted === 'N'){
                    lockedFields.forEach(field => this.masterForm.get(field)?.disable());
                    this.masterForm.get('web_access')?.enable();
                }
                else if (row.is_deleted === 'Y') {
                    lockedFields.forEach(field => this.masterForm.get(field)?.enable());
                    this.masterForm.get('web_access')?.enable();
                }
            }
        }
    }

    private patchLocationDropdowns(countryName: string, stateName: string, cityName: string) {
        const country = this.countries.find((c) => c.country_name?.toLowerCase() === countryName?.toLowerCase());
        if (!country) return;
        this.masterForm.patchValue({ countryforall: country.country_id });

        const statePayload = this.createParameterBased('STATE', country.country_id);
        this.inventoryService.getparameterbased(statePayload).subscribe({
            next: (res) => {
                this.states = res.data || [];
                const state = this.states.find((s: any) => s.state_name?.toLowerCase() === stateName?.toLowerCase());
                if (!state) return;
                this.masterForm.patchValue({ stateforall: state.state_id });

                const cityPayload = this.createParameterBased('CITY', state.state_id);
                this.inventoryService.getparameterbased(cityPayload).subscribe({
                    next: (cres) => {
                        this.cities = cres.data || [];
                        const city = this.cities.find((c: any) => c.city_name?.toLowerCase() === cityName?.toLowerCase());
                        if (city) {
                            this.masterForm.patchValue({ cityforall: city.city_id });
                        }
                    }
                });
            }
        });
    }

    createPayloadRemoved(returnType: string, returnValue: string) {
        return {
            p_returntype: returnType,
            p_returnvalue: returnValue,
            p_username: '',
            p_companyid: this.authService.isLogIntType()?.companyid.toString()
        };
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
                let payload: any;
                let returnType = '';
                let returnValue = '';
                if (master === 'customermaster') {
                    returnType = 'CUSTOMER';
                    returnValue = row.customerid;
                } else if (master === 'usertype') {
                    returnType = 'REMOVEUSERTYPE';
                    returnValue = row.usertypeid;
                } else {
                    returnType = 'ADVANCE';
                    returnValue = row.id;
                }
                payload = this.createPayloadRemoved(returnType, returnValue);

                const api$ = this.userService.removeDataParameter(payload);

                api$.subscribe({
                    next: (res) => {
                        this.showSuccess(res.data.message);
                        this.loadMasterData(master);
                    }
                });
            },
            reject: () => {}
        });
    }

    closeDialog() {
        this.masterForm.enable();
        this.visibleDialog = false;
        this.editMode = false;
        this.selectedUser = null;
    }

    loadChildUomOptions() {
        const payload = {
            p_returntype: 'UOM',
            p_username: this.authService.isLogIntType()?.industry_type_id.toString()
        };
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.ChilduomOptions = res.data || [];
            },
            error: (err) => console.log(err)
        });
    }

    addRow() {
        this.products.push({ batchid: 0, childUOM: null, conversion: null });
    }

    removeRow(index: number) {
        this.products.splice(index, 1);
        this.isChildUOMValid();
    }

    isChildUOMValid(): boolean {
        this.childUomError = '';

        // no empty child UOM or conversion
        const hasIncomplete = this.products.some((p) => !p.childUOM || !p.conversion || p.conversion <= 0);
        if (hasIncomplete) {
            this.childUomError = 'Each row needs a Child UOM and a valid conversion value';
            return false;
        }

        // no duplicate child UOM selected twice
        const ids = this.products.map((p) => p.childUOM);
        const hasDuplicates = new Set(ids).size !== ids.length;
        if (hasDuplicates) {
            this.childUomError = 'Duplicate Child UOM selected';
            return false;
        }

        return true;
    }

    loadMasterData(masterKey: string) {
        const payloadType = this.masterPayloadMap[masterKey];
        let api$;
        if (!payloadType) return;

        if (masterKey === 'usertype') {
            const payload = {
                p_returntype: 'USERTYPEALL',
                p_returnvalue: this.authService.isLogIntType()?.industry_type_id.toString(),
                p_username: this.authService.isLogIntType()?.companyid.toString()
            };
            api$ = this.inventoryService.Getreturndropdowndetails(payload);
        } else if (masterKey === 'categorymaster') {
            const payload = {
                p_returntype: 'CATEGORYDETAILS',
                p_returnvalue: this.authService.isLogIntType()?.industry_type_id.toString(),
                p_username: ''
            };
            api$ = this.inventoryService.Getreturndropdowndetails(payload);
        } else if (masterKey === 'uommaster') {
            const payload = {
                p_returntype: 'UOM',
                p_username: this.authService.isLogIntType()?.industry_type_id.toString()
            };
            api$ = this.inventoryService.getdropdowndetails(payload);
        } else if (masterKey === 'taxmaster') {
            const payload = {
                p_returntype: 'TAXDETAILS',
                p_returnvalue: this.authService.isLogIntType()?.industry_type_id.toString(),
                p_username: ''
            };
            api$ = this.inventoryService.Getreturndropdowndetails(payload);
        } else {
            return;
        }
        api$.subscribe({
            next: (res) => {
                this.masterDetails = res.data || [];
                this.filterMaster = [...this.masterDetails];
            },
            error: (err) => console.log(err)
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
            next: (res: any) => {
                this.masterDetails = res.data || [];
                this.filterMaster = [...this.masterDetails];
            },
            error: (err) => console.log(err)
        });
    }

    onGetCategory() {
        const payload = {
            p_returntype: 'CATEGORY',
            p_username: this.authService.isLogIntType()?.industry_type_id.toString()
        };
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                this.categoryOptions = res.data || [];
            },
            error: (err) => console.log(err)
        });
    }

    onGetCountry() {
        const payload = this.createParameterBased('COUNTRY', '');
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                this.countries = res.data || [];
            },
            error: (err) => console.log(err)
        });
    }

    onCountryChange(event: any) {
        const payload = this.createParameterBased('STATE', event.value);
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    this.states = res.data;
                }
            }
        });
    }

    onGetStateChange(data: any) {
        const payload = this.createParameterBased('CITY', data.value);
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    this.cities = res.data;
                }
            }
        });
    }

    onSubmit() {
        if (this.masterForm.invalid) {
            this.masterForm.markAllAsTouched();
            return;
        }
        this.saveMasterData(this.masterForm.getRawValue());
    }

    saveMasterData(data: any) {
        const master = this.selectedMaster;
        const username = this.authService.isLogIntType().userid.toString();
        const userId = this.authService.isLogIntType()?.userid?.toString();
        const industryTypeId = this.authService.isLogIntType()?.industry_type_id;

        let apicall$;

        if (master === 'customermaster') {
            const countryName = this.countries.find((c) => c.country_id === data.countryforall)?.country_name ?? '';
            const stateName = this.states.find((s) => s.state_id === data.stateforall)?.state_name ?? '';
            const cityName = this.cities.find((c) => c.city_id === data.cityforall)?.city_name ?? '';
            const payload = {
                p_companyid: this.authService.isLogIntType().companyid,
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
            const countryName = this.countries.find((c) => c.country_id === data.countryforall)?.country_name ?? '';
            const stateName = this.states.find((s) => s.state_id === data.stateforall)?.state_name ?? '';
            const cityName = this.cities.find((c) => c.city_id === data.cityforall)?.city_name ?? '';
            const payload: any = {
                p_companyid: this.authService.isLogIntType().companyid,
                p_supplierid: this.editMode ? this.selectedUser.supplierid : 0,
                p_suppliername: data.suppliername,
                p_supplieraddress: data.supplieraddress,
                p_suppliercountry: countryName,
                p_supplierstate: stateName,
                p_suppliercity: cityName,
                p_supplierpincode: data.supplierpincode,
                p_supplierphone: data.supplierphone,
                p_supplieremail: data.supplieremail,
                p_suppliergstno: data.suppliergst,
                p_suppliercontactperson: data.suppliercontactname,
                p_suppliercontactphone: data.suppliercontactphone,
                p_suppliercontactemail: data.suppliercontactemail,
                p_isactive: data.checked ? 'Y' : 'N',
                p_username: username,
                p_paymentterm: data.payment_term,
                p_prefferedvendor: data.preferred_vendor ? 'Y' : 'N',
                p_categories: data.categories.map((id: number) => ({
                    categoryid: id
                }))
            };
            apicall$ = this.inventoryService.upsertsuppliermaster(payload);
        } else if (master === 'categorymaster') {
            const payload = {
                p_companyid: this.authService.isLogIntType().companyid,
                p_categoryid: this.editMode ? this.selectedUser.categoryid : 0,
                p_categoryname: data.p_categoryname,
                p_categorydesc: data.p_categorydesc,
                p_isactive: data.checked ? 'Y' : 'N',
                p_createdby: userId,
                p_industry_type_id: industryTypeId
            };
            apicall$ = this.inventoryService.upsertcategorymaster(payload);
        } else if (master === 'uommaster') {
            if (this.products.length && !this.isChildUOMValid()) {
                this.errorSuccess(this.childUomError || 'Please fix Child UOM rows before saving');
                return;
            }

            const conversionJson = this.products.length
                ? this.products.map((p) => ({
                      batchid: p.batchid || 0,
                      uomchildid: p.childUOM,
                      conversionunit: p.conversion
                  }))
                : null;

            const payload = {
                p_companyid: this.authService.isLogIntType().companyid,
                p_uomid: this.editMode ? this.selectedUser.fieldid : 0,
                p_uomname: data.uomname,
                p_uomdesc: data.uomdesc,
                p_isactive: data.checked ? 'Y' : 'N',
                p_createdby: userId,
                p_industry_type_id: industryTypeId,
                p_conversion_json: conversionJson
            };
            apicall$ = this.inventoryService.upsertuommaster(payload);
        } else if (master === 'usertype') {
            const payload = {
                p_usertypeid: this.editMode ? this.selectedUser?.usertypeid : 0,
                p_usertypename: data.p_usertype,
                p_isactive: data.checked ? 'Y' : 'N',
                p_loginuser: userId,
                p_companyid: this.authService.isLogIntType()?.companyid,
                p_industrytype: industryTypeId,
                p_isapproval: data.is_approval ? 'Y' : 'N',
                p_webaccess: data.web_access ? 'Y' : 'N'
            };
            apicall$ = this.userService.upsertUserType(payload);
        }
        // else if (master === 'taxmaster') {
        //     const payload = {
        //         p_taxid: this.editMode ? this.selectedUser?.taxid : 0,
        //         p_taxname: data.taxname,
        //         p_taxdesc: data.taxdesc,
        //         p_taxtype: data.taxtype,
        //         p_taxpercentage: data.taxpercentage,
        //         p_isactive: data.checked ? 'Y' : 'N',
        //         p_createdby: userId,
        //         p_industry_type_id: industryTypeId
        //     };
        //     apicall$ = this.inventoryService.upsertaxmaster(payload); // ⚠️ confirm actual method name
        // } else if (master === 'advance') {
        //     const payload = {
        //         p_id: this.editMode ? this.selectedUser?.id : 0,
        //         p_fieldname: data.rulename,
        //         p_fielddesc: data.ruledesc,
        //         p_fieldvalue: data.rulevalue,
        //         p_isactive: data.checked ? 'Y' : 'N',
        //         p_createdby: userId,
        //         p_industry_type_id: industryTypeId
        //     };
        //     apicall$ = this.inventoryService.upsertadvance(payload); // ⚠️ confirm actual method name
        // }
        else {
            return;
        }

        apicall$.subscribe({
            next: (res: any) => {
                this.visibleDialog = false;
                this.showSuccess(res?.data?.msg);
                this.loadMasterData(master);
                if(master === 'suppliermaster' || master === 'customermaster'){
                    this.onGetDataList();
                }
            },
            error: (err: any) => {
                console.error('API error', err);
            }
        });
    }

    createDropdownPayload(returnType: string, returnvalue: string = '') {
        return {
            p_username: this.authService.isLogIntType()?.userid,
            p_returntype: returnType
            // p_returnvalue: returnvalue
        };
    }

    createParameterBased(type: string, value: string) {
        const userId = this.authService.isLogIntType()?.userid;
        const companyId = this.authService.isLogIntType()?.companyid;
        return {
            returnType: type,
            returnValue: value,
            username: userId,
            option1: companyId,
            option2: ''
        };
    }
    /** 🔍 Global Filter **/

    applyGlobalFilter() {
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
