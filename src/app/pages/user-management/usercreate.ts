import { Component, inject, ViewChild } from '@angular/core';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { RippleModule } from 'primeng/ripple';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryService } from '@/core/services/inventory.service';
import { UserService } from '@/core/services/user.service';
import { AuthService } from '@/core/services/auth.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

export function gstNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    return gstRegex.test(control.value.toUpperCase()) ? null : { invalidGst: true };
}
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
                            <small class="text-red-500 mt-1" *ngIf="profileForm.get('companygstno')?.touched && profileForm.get('companygstno')?.errors?.['invalidGst']"> Enter a valid gst number </small>
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
                    @if (loggedInUserRole === 'administrator') {
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
        companygstno: ['', [Validators.required, gstNumberValidator]],
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
        this.onGetCompanyProfile();
        this.onGetCountry();
        // this.onGetData();
    }

    allowOnlyDigits(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char)) {
            event.preventDefault();
        }
    }

 onGetCompanyProfile(): void {
        const companyId = this.authservice.isLogIntType().companyid.toString();
        const userid = this.authservice.isLogIntType().userid.toString();
        const payload = {
            returnType: 'COMPANYPROFILE',
            returnValue: companyId,
            username: userid,
            option1: '',
            option2: null
        };
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                  if (res.data) {
                    this.patchFromData(res.data[0]);
                    if (this.loggedInUserRole !== 'administrator') {
                        this.profileForm.disable();
                    } else {
                        this.profileForm.enable();
                    }
                }
            },
            error: (err) => console.error(err)
        });
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
    createDropdownPayload(returnType: string, username:string) {
        return {
            uname: 'admin',
            p_username: username,
            p_returntype: returnType
        };
    }

    // onGetData() {
    //     const username = this.authservice.isLogIntType().username.toString();
    //     const payload = this.createDropdownPayload('PROFILE',username);
    //     this.inventoryService.getdropdowndetails(payload).subscribe({
    //         next: (res) => {
    //             if (res.data) {
    //                 this.patchFromData(res.data[0]);
    //                 if (this.loggedInUserRole !== 'administrator') {
    //                     this.profileForm.disable();
    //                 } else {
    //                     this.profileForm.enable();
    //                 }
    //             }
    //         },
    //         error: (err) => console.log(err)
    //     });
    // }

    onGetCountry() {
         const username = this.authservice.isLogIntType().username.toString();
        const payload = this.createDropdownPayload('COUNTRY','');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                this.countries = res.message || [];
            },
            error: (err) => console.log(err)
        });
    }

  onGetStateChange(data: any) {
    const stateId = data.value;
    this.profileForm.patchValue({ companycity: '' });
    this.cities = [];
    if (!stateId) return;

    // pull GST state code from the already-loaded states list — no extra call needed
    const selectedState = this.states.find((s) => s.state_id === stateId);
    if (selectedState) {
        this.profileForm.patchValue({ statecode: selectedState.stategstcode });
    }

    const payload = { p_returntype: 'CITY', p_returnvalue: stateId };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res) => {
            this.cities = res.message || [];
        },
        error: (err) => console.log(err)
    });
}

   onCountryChange(event: any) {
    const countryId = event.value;
    this.profileForm.patchValue({ companystate: '', companycity: '', statecode: '' });
    this.states = [];
    this.cities = [];
    if (!countryId) return;

    const payload = { p_returntype: 'STATE', p_returnvalue: countryId };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res) => {
            this.states = res.message || [];
        },
        error: (err) => console.log(err)
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

    const country = this.countries.find(
        (c) => c.country_name?.toLowerCase() === data.companycountry?.toLowerCase()
    );
    const countryId = country ? country.country_id : '';
console.log('country',country,country)
    this.profileForm.patchValue({
        companyname: data.companyname,
        companyemail: data.companyemail,
        companygstno: data.companygstno,
        companycontactperson: data.companycontactperson,
        companyaddress: data.companyaddress,
        companycontactphone: data.companycontactphone,
        companycontactemail: data.companycontactemail,
        companycountry: countryId,
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
        this.onGetStateForEdit(countryId, data.companystate, data.companycity);
    }
}

onGetStateForEdit(countryId: any, stateName: string, cityName: string) {
    const payload = { p_returntype: 'STATE', p_returnvalue: countryId };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res) => {
            this.states = res.message || [];
            const state = this.states.find(
                (s) => s.state_name?.toLowerCase() === stateName?.toLowerCase()
            );
            if (state) {
                this.profileForm.patchValue({
                    companystate: state.state_id,
                    statecode: state.stategstcode
                });
                this.onGetCityForEdit(state.state_id, cityName);
            } else {
                console.log('State not found for:', stateName);
            }
        },
        error: (err) => console.log(err)
    });
}

onGetCityForEdit(stateId: any, cityName: string) {
    const payload = { p_returntype: 'CITY', p_returnvalue: stateId };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res) => {
            this.cities = res.message || [];
            const city = this.cities.find(
                (c) => c.city_name?.toLowerCase() === cityName?.toLowerCase()
            );
            if (city) {
                this.profileForm.patchValue({ companycity: city.city_id });
            } else {
                console.log('City not found for:', cityName);
            }
        },
        error: (err) => console.log(err)
    });
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
