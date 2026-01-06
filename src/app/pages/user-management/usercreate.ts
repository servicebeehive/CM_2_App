import { Component, inject, ViewChild } from '@angular/core';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { RippleModule } from 'primeng/ripple';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryService } from '@/core/services/inventory.service';
import { UserService } from '@/core/services/user.service';
import { AuthService } from '@/core/services/auth.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'user-create',
    standalone: true,
    imports: [InputText, TextareaModule, FileUploadModule, ButtonModule, InputGroupModule, RippleModule, CommonModule, ReactiveFormsModule, RouterLink, DropdownModule, ConfirmDialogModule],
    providers: [ConfirmationService],
    template: `<div class="card">
            <span class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-6 block">Profile Creation</span>
            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="col-span-12 lg:col-span-10">
                <div class="card">
                    <div class="flex items-center gap-4">
                        <!-- LEFT : LOGO (SQUARE) -->
                        <img
                            [src]="imageUrl || '/layout/images/logo.png'"
                            alt="logo"
                            class="w-[140px] h-[80px]
         object-contain
         border
         rounded-md
         bg-white
         p-2"
                        />

                        <!-- RIGHT : UPLOAD BUTTON -->
                        <div class="flex flex-col gap-1">
                            <p-fileupload
                                #fileUpload
                                mode="basic"
                                name="companylogo"
                                accept="image/*"
                                [maxFileSize]="1000000"
                                styleClass="p-button-outlined p-button-plain"
                                chooseLabel="Upload Image"
                                (onSelect)="onFileSelect($event)"
                                (onClear)="onFileClear()"
                            ></p-fileupload>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4 mt-4">
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Name <span class="text-red-500">*</span></label>
                            <input formControlName="companyname" type="text" pInputText placeholder="Company Name" fluid />
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="companyemail" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Email <span class="text-red-500">*</span></label>
                            <input formControlName="companyemail" type="email" pInputText fluid placeholder="Company Email" />
                            <small class="text-red-500 mt-1" *ngIf="profileForm.get('companyemail')?.touched && profileForm.get('companyemail')?.invalid"> Enter a valid email address </small>
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="companyphone" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Phone <span class="text-red-500">*</span></label>
                            <input formControlName="companyphone" type="text" pInputText fluid placeholder="Company Phone" maxlength="10" (keypress)="allowOnlyDigits($event)" />
                            <small class="text-red-500 mt-1" *ngIf="profileForm.get('companyphone')?.touched && profileForm.get('companyphone')?.invalid"> Enter a valid 10-digit mobile number </small>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <p class="mb-2"><strong>Company Address:</strong></p>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-4">
                            <label for="companyaddress" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Address <span class="text-red-500">*</span></label>
                            <input formControlName="companyaddress" type="text" pInputText fluid placeholder="Address" />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="p_warehouse" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Warehouse Name <span class="text-red-500">*</span></label>
                            <input formControlName="p_warehouse" type="text" pInputText fluid placeholder="Warehouse Name" />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="companypincode" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Pincode <span class="text-red-500">*</span></label>
                            <input formControlName="companypincode" type="text" pInputText fluid placeholder="Pincode" />
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="companycountry" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Country <span class="text-red-500">*</span></label>
                            <p-dropdown
                                formControlName="companycountry"
                                [options]="countries"
                                optionLabel="country_name"
                                optionValue="country_id"
                                fluid
                                filterPlaceholder="Search Countries"
                                [filter]="true"
                                [showClear]="true"
                                placeholder="Select a Country"
                                (onChange)="onCountryChange($event)"
                            >
                            </p-dropdown>
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="companystate" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> State <span class="text-red-500">*</span></label>
                            <p-dropdown
                                formControlName="companystate"
                                [options]="states"
                                optionLabel="state_name"
                                optionValue="state_id"
                                [filter]="true"
                                fluid
                                placeholder="State"
                                [showClear]="true"
                                filterPlaceholder="Search State"
                                (onChange)="onGetStateChange($event)"
                            ></p-dropdown>
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="companycity" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> City <span class="text-red-500">*</span></label>
                            <p-dropdown formControlName="companycity" [options]="cities" optionLabel="city_name" optionValue="city_id" filterPlaceholder="Search City" fluid [filter]="true" [showClear]="true" placeholder="City"></p-dropdown>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <p class="mb-2"><strong>Company Contact:</strong></p>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-4">
                            <label for="companycontactperson" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Name</label>
                            <input formControlName="companycontactperson" type="text" pInputText fluid placeholder="Name" />
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="companycontactphone" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Phone No</label>
                            <input formControlName="companycontactphone" type="text" pInputText fluid placeholder="Phone No" maxlength="10" (keypress)="allowOnlyDigits($event)" />
                            <small class="text-red-500 mt-1" *ngIf="profileForm.get('companycontactphone')?.touched && profileForm.get('companycontactphone')?.invalid"> Enter a valid 10-digit mobile number </small>
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="companycontactemail" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Email</label>
                            <input formControlName="companycontactemail" type="email" pInputText fluid placeholder="Email" />
                            <small class="text-red-500 mt-1" *ngIf="profileForm.get('companycontactemail')?.touched && profileForm.get('companycontactemail')?.invalid"> Enter a valid email address </small>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <p class="mb-2"><strong>Company GST: </strong></p>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-4">
                            <label for="companygstno" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> GST No <span class="text-red-500">*</span></label>
                            <input formControlName="companygstno" type="text" pInputText fluid placeholder="GST No." maxlength="15" />
                            <small class="text-red-500 mt-1" *ngIf="profileForm.get('companygstno')?.touched && profileForm.get('companygstno')?.invalid"> Enter a valid gst number </small>
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="statecode" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">State Code <span class="text-red-500">*</span></label>
                            <input formControlName="statecode" type="text" pInputText fluid placeholder="State Code" maxlength="15" />
                            <small class="text-red-500 mt-1" *ngIf="profileForm.get('statecode')?.touched && profileForm.get('statecode')?.invalid"> Enter a valid State Code </small>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <p class="mb-2"><strong>Company Bank Info:</strong></p>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-4">
                            <label for="bankname" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Bank Name <span class="text-red-500">*</span></label>
                            <input formControlName="bankname" type="text" pInputText fluid placeholder="Bank Name" />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="branch" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Branch <span class="text-red-500">*</span></label>
                            <input formControlName="branch" type="text" pInputText fluid placeholder="Branch" />
                        </div>

                        <div class="col-span-12 md:col-span-4"></div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="ifsc" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> IFSC <span class="text-red-500">*</span></label>
                            <input formControlName="ifsc" type="text" pInputText fluid placeholder="IFSC" />
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="accountno" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Account No <span class="text-red-500">*</span></label>
                            <input formControlName="accountno" type="text" pInputText fluid placeholder="Account No" />
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="pan" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company PAN <span class="text-red-500">*</span></label>
                            <input formControlName="pan" type="text" pInputText fluid placeholder="Company PAN" />
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-12 gap-4">
                    @if (loggedInUserRole === 'Admin') {
                        <div class="flex flex-col">
                            <button pButton pRipple type="submit" label="Submit" [disabled]="profileForm.invalid"></button>
                        </div>

                        <div class="flex flex-col">
                            <button pButton pRipple type="button" label="Close" routerLink="/layout"></button>
                        </div>
                    }
                </div>
            </form>
        </div>

        <p-confirmDialog></p-confirmDialog> `
})
export class UserCreate {
    @ViewChild('fileUpload') fileUpload: any;
    selectedFile: File | null = null;
    logoBase64: string | null = null;
    fb = inject(FormBuilder);
    userList: any[] = [];
    countries: any[] = [];
    states: any[] = [];
    cities: any[] = [];
    public getUserDetails = {};
    loggedInUserRole: string = '';
    public imageUrl: string | null = '';
    profileForm: FormGroup = this.fb.group({
        companyname: ['', [Validators.required, Validators.maxLength(100)]],
        companyemail: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(100)]],
        companygstno: ['', [Validators.required, Validators.maxLength(30)]],
        companycontactperson: ['', Validators.maxLength(100)],
        companyaddress: ['', [Validators.required, Validators.maxLength(500)]],
        companycontactphone: ['', Validators.pattern(/^[0-9]{10}$/)],
        companycontactemail: ['', [Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(100)]],
        companycountry: ['', [Validators.required, Validators.required]],
        companystate: ['', [Validators.required, Validators.maxLength(50)]],
        companycity: ['', [Validators.required, Validators.maxLength(50)]],
        companyphone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        companypincode: ['', [Validators.required, Validators.maxLength(6)]],
        p_warehouse: ['', [Validators.required, Validators.maxLength(100)]],
        statecode: ['', [Validators.required, Validators.maxLength(5)]],
        bankname: ['', [Validators.required, Validators.maxLength(100)]],
        accountno: ['', [Validators.required, Validators.maxLength(25)]],
        pan: ['', [Validators.required, Validators.maxLength(25)]],
        ifsc: ['', [Validators.required, Validators.maxLength(25)]],
        branch: ['', [Validators.required, Validators.maxLength(100)]]
    });

    constructor(
        private inventoryService: InventoryService,
        private userService: UserService,
        private authservice: AuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}
    ngOnInit() {
        this.loggedInUserRole = this.authservice.isLogIntType().usertypename;
        this.onGetCountry();
        this.onGetData();
    }
    allowOnlyDigits(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char)) {
            event.preventDefault();
        }
    }
    submitValue(form: any) {
        const payload = {
            p_companyname: form.companyname,
            p_companyaddress: form.companyaddress,
            p_companycity: form.companycity,
            p_companystate: form.companystate,
            p_companycountry: form.companycountry,
            p_companypincode: form.companypincode,
            p_companyphone: form.companyphone,
            p_companyemail: form.companyemail,
            p_companygstno: form.companygstno,
            p_companycontactperson: form.companycontactperson,
            p_companycontactphone: form.companycontactphone,
            p_companycontactemail: form.companycontactemail,
            p_statecode: form.statecode,
            p_bankname: form.bankname,
            p_branch: form.branch,
            p_ifsc: form.ifsc,
            p_accountno: form.accountno,
            p_pan: form.pan,
            p_warehouse: form.p_warehouse,
            p_companylogo: this.logoBase64 || null
        };
        this.userService.OnUserListHeaderCreate(payload).subscribe({
            next: (res: any) => {
                console.log('API RESULT:', res.data);
                this.showSuccess('Profile details saved successfully');
            },
            error: (err) => {
                console.error(err);
            }
        });
    }
    onSubmit() {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }
        this.confirmationService.confirm({
            message: 'Are you sure you want to submit?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.submitValue(this.profileForm.value);
            }
        });
    }

    onFileSelect(event: any) {
        const file: File = event.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid File',
                detail: 'Please upload an image file'
            });
            return;
        }
        this.selectedFile = file;
        this.convertToBase64(file);
    }

    onFileClear() {
        this.selectedFile = null;
        this.logoBase64 = null;
    }

    convertToBase64(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            this.logoBase64 = reader.result as string;
            console.log('Base64 ready');
            this.imageUrl = this.base64ToBlobUrl(this.logoBase64);
        };
        reader.onerror = () => {
            console.error('Error converting file to Base64');
        };
        reader.readAsDataURL(file);
    }
    createDropdownPayload(returnType: string) {
        return {
            uname: 'admin',
            p_username: 'admin',
            p_returntype: returnType
        };
    }

    onGetData() {
        const payload = this.createDropdownPayload('PROFILE');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                if (res.data) {
                    this.patchFromData(res.data[0]);
                    if (this.loggedInUserRole !== 'Admin') {
                        this.profileForm.disable();
                    } else {
                        this.profileForm.enable();
                    }
                }
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
    onGetState(countryId: string, stateName: string, statecode: string, cityName: string) {
        const payload = {
            ...this.getUserDetails,
            p_returntype: 'STATE',
            p_returnvalue: countryId
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.states = res.data || [];
                const state = this.states.filter((s) => s.state_id === stateName);
                const statename = state[0].state_id;
                if (statename) {
                    this.profileForm.patchValue({
                        companystate: statename,
                        statecode: state[0].stategstcode
                    });
                    this.onGetCity(statename, cityName);
                }
            },
            error: (err) => console.log(err)
        });
    }

    onGetCity(statename: string, cityName: string) {
        const payload = {
            ...this.getUserDetails,
            p_returntype: 'CITY',
            p_returnvalue: statename
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.cities = res.data || [];
                const city = this.cities.filter((c) => c.city_id === cityName);
                const cityname = city[0].city_id;
                if (city) {
                    this.profileForm.patchValue({
                        companycity: cityname
                    });
                }
            },
            error: (err) => console.log(err)
        });
    }
    onGetStateChange(data: any) {
        console.log(data.value);
        const stateId = data.value;
        this.profileForm.patchValue({
            companycity: ''
        });
        this.cities = [];

        if (!stateId) {
            return;
        }
        const statepayload = {
            p_returntype: 'STATE',
            p_returnvalue: 1
        };
        const payload = {
            ...this.getUserDetails,
            p_returntype: 'CITY',
            p_returnvalue: stateId
        };

        this.inventoryService.Getreturndropdowndetails(statepayload).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    const stateCode = this.states.filter((s) => s.state_id === data.value);
                    this.profileForm.patchValue({
                        statecode: stateCode[0].stategstcode
                    });
                }
            }
        });

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    console.log('res:', res.data);
                    this.cities = res.data;
                    this.profileForm.patchValue({
                        companycity: res.data[0].city_id
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
                    console.log('res:', res.data);
                    this.states = res.data;
                }
            }
        });
    }

    patchFromData(data: any) {
        if (!data) {
            console.warn('No data provided to patchFromData');
            return;
        }

        if (this.countries.length === 0) {
            console.warn('Countries not loaded yet, delaying patchFromData');
            setTimeout(() => this.patchFromData(data), 100);
            return;
        }
        const country = this.countries.find((c) => c.country_id === data.companycountry || c.company_id?.toLowerCase() === data.companycountry?.toLowerCase());
        const countryId = country ? country.country_id : data.companycountry;
        this.profileForm.patchValue({
            companyname: data.companyname,
            companyemail: data.companyemail,
            companygstno: data.companygstno,
            companycontactperson: data.companycontactperson,
            companyaddress: data.companyaddress,
            companycontactphone: data.companycontactphone,
            companycontactemail: data.companycontactemail,
            companycountry: countryId || '',
            companyphone: data.companyphone,
            bankname: data.bankname,
            ifsc: data.ifsc,
            branch: data.branch,
            pan: data.pan,
            companypincode: data.companypincode,
            p_warehouse: data.warehouse,
            accountno: data.accountno
        });
        this.imageUrl = this.base64ToBlobUrl(data.companylogo);
        if (countryId) {
            this.onGetState(countryId, data.companystate, data.statecode, data.companycity);
        }
    }
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
    base64ToBlobUrl(base64: string | null | undefined): string | null {
        if (!base64 || !base64.includes(',')) {
            return null;
        }
        const [meta, data] = base64.split(',');
        const mime = meta.match(/:(.*?);/)![1];

        const byteString = atob(data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: mime });
        return URL.createObjectURL(blob);
    }
}
