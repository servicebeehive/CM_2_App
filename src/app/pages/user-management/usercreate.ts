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
                        <img [src]="imageUrl" alt="logo" class="w-[140px] h-[80px] object-contain border rounded-md bg-white p-2" />

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

                        <div class="col-span-12 md:col-span-4">
                            <label class="font-medium mb-1">Industry Type <span class="text-red-500">*</span></label>
                            <p-dropdown
                                formControlName="industrytype"
                                [options]="industryTypeOptions"
                                optionLabel="industry_type_name"
                                optionValue="industry_type_id"
                                [filter]="true"
                                [showClear]="true"
                                placeholder="Select Industry Type"
                                styleClass="w-full"
                            ></p-dropdown>
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label class="font-medium mb-1">Time Zone <span class="text-red-500">*</span></label>
                            <p-dropdown formControlName="timezone" [options]="timeZoneOptions" optionLabel="label" optionValue="label" [filter]="true" [showClear]="true" placeholder="Select Time Zone" styleClass="w-full"></p-dropdown>
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
                            <label for="pan" class="font-medium text-sur~face-900 dark:text-surface-0 mb-2 block">Company PAN <span class="text-red-500">*</span></label>
                            <input formControlName="pan" type="text" pInputText fluid placeholder="Company PAN" />
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-12 gap-4">
                    @if (loggedInRole === 'ADMINISTRATOR') {
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
    loggedInRole: string = '';
    countries: any[] = [];
    states: any[] = [];
    cities: any[] = [];
    industryTypeOptions: any[] = [];
    timeZoneOptions: any[] = [{ label: 'Asia/Kolkata' }];
    companyId = '';
    public getUserDetails = {};
    private readonly alwaysDisabled = ['industrytype', 'timezone', 'companygstno', 'statecode'];
    public imageUrl: string | null = '';
    profileForm: FormGroup = this.fb.group({
        companyname: ['', [Validators.required, Validators.maxLength(100)]],
        companyemail: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(100)]],
        companygstno: [{ value: '', disabled: true }, [Validators.required, gstNumberValidator]],
        companycontactperson: ['', Validators.maxLength(100)],
        companyaddress: ['', [Validators.required, Validators.maxLength(500)]],
        companycontactphone: ['', Validators.pattern(/[6-9]\d{9}$/)],
        companycontactemail: ['', [Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(100)]],
        companycountry: ['', [Validators.required, Validators.required]],
        companystate: ['', [Validators.required, Validators.maxLength(50)]],
        companycity: ['', [Validators.required, Validators.maxLength(50)]],
        companyphone: ['', [Validators.required, Validators.pattern(/[6-9]\d{9}$/)]],
        companypincode: ['', [Validators.required, Validators.maxLength(6)]],
        p_warehouse: ['', [Validators.required, Validators.maxLength(100)]],
        statecode: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(5)]],
        bankname: ['', [Validators.required, Validators.maxLength(100)]],
        accountno: ['', [Validators.required, Validators.maxLength(25)]],
        pan: ['', [Validators.required, Validators.maxLength(25)]],
        ifsc: ['', [Validators.required, Validators.maxLength(25)]],
        branch: ['', [Validators.required, Validators.maxLength(100)]],
        industrytype: [{ value: '', disabled: true }, Validators.required],
        timezone: [{ value: '', disabled: true }, Validators.required]
    });

    constructor(
        private userService: UserService,
        private authservice: AuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private inventoryService: InventoryService
    ) {}
    ngOnInit() {
        this.companyId = this.authservice.isLogIntType()?.companyid.toString();
        this.loggedInRole = this.authservice.isLogIntType()?.usertypecode;
        this.onGetCompanyProfile();
        this.loadDropdown('INDUSTRY', '', 'industryTypeOptions');
    }
    allowOnlyDigits(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char)) {
            event.preventDefault();
        }
    }

    loadDropdown(type: string, value: string, key: 'countries' | 'states' | 'cities' | 'industryTypeOptions', callback?: () => void) {
        const userId = this.authservice.isLogIntType()?.userid;
        const payload = {
            returnType: type,
            returnValue: value,
            username: userId,
            option1: this.companyId,
            option2: ''
        };

        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                this[key] = res.data;
                if (key === 'states') {
                    this.states = res.data;
                }
                callback?.();
            }
        });
    }

    submitValue(form: any) {
        let loggedIn = this.authservice.isLogIntType()?.userid.toString();
        let companyid = this.authservice.isLogIntType()?.companyid;
        console.log(form);
        const payload = {
            p_companyid: companyid,
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
            p_companyLogo: this.logoBase64 || null,
            p_loginuser: loggedIn,
            p_industry: form.industrytype,
            p_timezone: 'Asia/Kolkata'
        };

        this.userService.OnUserListHeaderCreate(payload).subscribe({
            next: (res: any) => {
                this.showSuccess(res.data[0].msg);
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
                this.submitValue(this.profileForm.getRawValue());
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
        if (file.size > 2 * 1024 * 1024) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Large File',
                detail: 'Image is large and will be compressed automatically'
            });
        }

        this.selectedFile = file;
        this.convertToBase64(file);
    }

    onFileClear() {
        this.selectedFile = null;
        this.logoBase64 = null;
    }

    convertToBase64(file: File) {
        const maxWidth = 300;
        const maxHeight = 200;
        const quality = 0.7; // 70% quality

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        const isPng = file.type === 'image/png';

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            // Calculate scaled dimensions
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d')!;

            if (!isPng) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG
            this.logoBase64 = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality);
            this.imageUrl = this.base64ToBlobUrl(this.logoBase64);
        };

        img.onerror = () => console.error('Image load error');
        img.src = objectUrl;
    }

    createDropdownPayload(returnType: string) {
        return {
            uname: this.authservice.isLogIntType().userid.toString(),
            p_username: this.authservice.isLogIntType().userid.toString(),
            p_returntype: returnType
        };
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
                    if (this.loggedInRole !== 'ADMINISTRATOR') {
                        this.profileForm.disable();
                    } else {
                        this.profileForm.enable();
                        this.alwaysDisabled.forEach((name) => this.profileForm.get(name)?.disable());
                    }
                }
            },
            error: (err) => console.error(err)
        });
    }

    onGetState(countryId: string, stateName: string, statecode: string, cityName: string) {
        this.loadDropdown('STATE', countryId, 'states', () => {
            const state = this.states.filter((s) => s.state_id === Number(stateName));
            const statename = state[0].state_id;
            if (statename) {
                this.profileForm.patchValue({
                    companystate: statename,
                    statecode: state[0].state_code
                });
                this.onGetCity(statename, cityName);
            }
        });
    }

    onGetCity(statename: string, cityName: string) {
        this.loadDropdown('CITY', statename, 'cities', () => {
            const city = this.cities.filter((c) => c.city_id === cityName);
            const cityname = city[0].city_id;
            if (city) {
                this.profileForm.patchValue({
                    companycity: cityname
                });
            }
        });
    }
    onGetStateChange(data: any) {
        const stateId = data.value;
        this.profileForm.patchValue({
            companycity: ''
        });
        this.cities = [];

        if (!stateId) {
            return;
        }

        this.loadDropdown('STATE', '1', 'states');

        this.loadDropdown('CITY', stateId, 'cities');
        const stateCode = this.states.filter((s) => s.state_id === data.value);
        this.profileForm.patchValue({
            statecode: stateCode[0].state_code
        });
    }
    onCountryChange(event: any) {
        const countryId = event.value;
        this.loadDropdown('STATE', countryId, 'states');
    }

    patchFromData(data: any) {
        if (!data) {
            console.warn('No data provided to patchFromData');
            return;
        }
        this.loadDropdown('COUNTRY', 'null', 'countries');
        const country = this.countries.find((c) => c.country_id === data.companycountry || c.company_id?.toLowerCase() === data.companycountry?.toLowerCase());
        const countryId = country ? country.country_id : data.companycountry;
        const industry = this.industryTypeOptions.find((i) => i.industry_type_id === data.industry_type_id);
        console.log('Patching form with data:', data, industry);
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
            accountno: data.accountno,
            industrytype: data.industry_type_id,
            timezone: data.timezone
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
