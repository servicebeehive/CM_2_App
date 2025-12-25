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
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';

@Component({
    selector: 'user-create',
    standalone: true,
    imports: [InputText, TextareaModule, FileUploadModule, ButtonModule, InputGroupModule, RippleModule, CommonModule, ReactiveFormsModule, RouterLink, DropdownModule],
    template: `<div class="card">
        <span class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-6 block">Profile Creation</span>
        <!-- <div  class="col-span-12 lg:col-span-10"> -->
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="col-span-12 lg:col-span-10">
            <div class="card">
                <p class="mb-2"><strong>Company Info:</strong></p>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-4">
                        <label class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Name</label>
                        <input formControlName="companyname" type="text" pInputText placeholder="Company Name" fluid />
                    </div>

                    <div class="col-span-12 md:col-span-4">
                        <label for="companyemail" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Email </label>
                        <input formControlName="companyemail" type="email" pInputText fluid placeholder="Company Email" />
                        <small class="text-red-500 mt-1" *ngIf="profileForm.get('companyemail')?.touched && profileForm.get('companyemail')?.invalid"> Enter a valid email address </small>
                    </div>

                    <div class="col-span-12 md:col-span-4">
                        <label for="companyphone" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Phone</label>
                        <input formControlName="companyphone" type="text" pInputText fluid placeholder="Company Phone" maxlength="10" (keypress)="allowOnlyDigits($event)" />
                        <small class="text-red-500 mt-1" *ngIf="profileForm.get('companyphone')?.touched && profileForm.get('companyphone')?.invalid"> Enter a valid 10-digit mobile number </small>
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col items-start">
                        <label for="companylogo" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Logo</label>
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
                        @if (selectedFile) {
                            <small class="text-green-600 mt-2">File selected:{{ selectedFile.name }}</small>
                        }
                    </div>
                </div>
            </div>
            <div class="card">
                <p class="mb-2"><strong>Company Address:</strong></p>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-4">
                        <label for="companyaddress" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Address</label>
                        <input formControlName="companyaddress" type="text" pInputText fluid placeholder="Address" />
                    </div>
                    <div class="col-span-12 md:col-span-4">
                        <label for="p_warehouse" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Warehouse Name</label>
                        <input formControlName="p_warehouse" type="text" pInputText fluid placeholder="Warehouse Name" />
                    </div>
                    <div class="col-span-12 md:col-span-4">
                        <label for="companypincode" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Pincode</label>
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
                            [filter]="true"
                            [showClear]="true"
                            placeholder="Select a Country"
                            (onChange)="onCountryChange($event)"
                        >
                            <!-- <ng-template let-country #item>
                            <div class="flex items-center">
                                <img src="https://primefaces.org/cdn/primeng/images/flag/flag_placeholder.png" [class]="'mr-2 flag flag-' + country.code.toLowerCase()" style="width:18px" />
                                <div>{{ country.name }}</div>
                            </div>
                        </ng-template> -->
                        </p-dropdown>
                    </div>

                    <div class="col-span-12 md:col-span-4">
                        <label for="companystate" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> State <span class="text-red-500">*</span></label>
                        <p-dropdown formControlName="companystate" [options]="states" optionLabel="state_name" optionValue="state_id" fluid placeholder="State" [showClear]="true" (onChange)="onGetStateChange($event)"></p-dropdown>
                    </div>

                    <div class="col-span-12 md:col-span-4">
                        <label for="companycity" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> City <span class="text-red-500">*</span></label>
                        <p-dropdown formControlName="companycity" [options]="cities" optionLabel="city_name" optionValue="city_id" fluid [showClear]="true" placeholder="City"></p-dropdown>
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
                <p class="mb-2"><strong>Company GST:</strong></p>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-4">
                        <label for="companygstno" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> GST No </label>
                        <input formControlName="companygstno" type="text" pInputText fluid placeholder="GST No." maxlength="15" />
                        <small class="text-red-500 mt-1" *ngIf="profileForm.get('companygstno')?.touched && profileForm.get('companygstno')?.invalid"> Enter a valid gst number </small>
                    </div>

                    <div class="col-span-12 md:col-span-4">
                        <label for="statecode" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">State Code</label>
                        <input formControlName="statecode" type="text" pInputText fluid placeholder="State Code" maxlength="15" />
                        <small class="text-red-500 mt-1" *ngIf="profileForm.get('statecode')?.touched && profileForm.get('statecode')?.invalid"> Enter a valid State Code </small>
                    </div>
                </div>
            </div>

            <div class="card">
                <p class="mb-2"><strong>Company Bank Info:</strong></p>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-4">
                        <label for="bankname" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Bank Name</label>
                        <input formControlName="bankname" type="text" pInputText fluid placeholder="Bank Name" />
                    </div>
                    <div class="col-span-12 md:col-span-4">
                        <label for="branch" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Branch</label>
                        <input formControlName="branch" type="text" pInputText fluid placeholder="Branch" />
                    </div>

                    <div class="col-span-12 md:col-span-4"></div>

                    <div class="col-span-12 md:col-span-4">
                        <label for="ifsc" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> IFSC </label>
                        <input formControlName="ifsc" type="text" pInputText fluid placeholder="IFSC" />
                    </div>

                    <div class="col-span-12 md:col-span-4">
                        <label for="accountno" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Account No</label>
                        <input formControlName="accountno" type="text" pInputText fluid placeholder="Account No" />
                    </div>

                    <div class="col-span-12 md:col-span-4">
                        <label for="pan" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company PAN</label>
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
                        <button pButton pRipple type="button" label="Close"  routerLink="/layout"></button>
                    </div>
                }
            </div>

            <!-- </div> -->
        </form>
    </div>`
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
    profileForm: FormGroup = this.fb.group({
        companyname: ['', Validators.maxLength(50)],
        companyemail: ['', [Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(50)]],
        companygstno: ['', [Validators.required]],
        companycontactperson: ['', Validators.maxLength(50)],
        companyaddress: ['', Validators.maxLength(100)],
        companycontactphone: ['', Validators.pattern(/^[0-9]{10}$/)],
        companycontactemail: ['', [Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(50)]],
        companycountry: ['', [Validators.required, Validators.required]],
        companystate: ['', [Validators.required, Validators.maxLength(50)]],
        companycity: ['', [Validators.required, Validators.maxLength(50)]],
        companyphone: ['', Validators.pattern(/^[0-9]{10}$/)],
        companypincode:[''],
        p_warehouse:[''],
        statecode:[''],
        bankname:[''],
        accountno:[''],
        pan:[''],
        ifsc:[''],
        branch:['']
    });

    constructor(
        private inventoryService: InventoryService,
        private userService: UserService,
        private authservice: AuthService,
        private messageService: MessageService
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
    onSubmit() {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }
        const form = this.profileForm.value;
        const payload = {
            p_companyname: form.companyname,
            p_companyaddress: form.companyaddress,
            p_companycity: form.companycity,
            p_companystate: form.companystate,
            p_companycountry: form.companycountry,
            p_companypincode: '490001',
            p_companyphone: form.companyphone,
            p_companyemail: form.p_companycontactemail || null,
            p_companygstno: form.companygstno,
            p_companycontactperson: form.companycontactperson,
            p_companycontactphone: form.companycontactphone,
            p_companycontactemail: form.companycontactemail,
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
        // if (event.files && event.files.length > 0) {
        //     this.selectedFile = event.files[0];
        //     if (this.selectedFile) {
        //     this.convertToBase64(this.selectedFile);
        // }
        // }
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
        };
        reader.onerror = () => {
            console.error('Error converting file to Base64');
        };
        reader.readAsDataURL(file);
        //       if (!file) {
        //     console.log('No file provided');
        //     return;
        // }
        //     const reader = new FileReader();
        //     reader.onload = (e: any) => {
        //         this.logoBase64 = e.target.result;
        //         console.log('Base64 image created');
        //     };
        //     reader.readAsDataURL(file);
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
                // this.onGetData();
            },
            error: (err) => console.log(err)
        });
    }
    onGetState(countryId: string, stateName: string,statecode:string, cityName: string) {
        const payload = {
            ...this.getUserDetails,
            p_returntype: 'STATE',
            p_returnvalue: countryId
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.states = res.data || [];
                const state = this.states.filter((s) => s.state_id === stateName);
                console.log(state[0].state_id);
                console.log(state);
                const statename = state[0].state_id;

                if (statename) {
                    this.profileForm.patchValue({
                        companystate: statename,
                        statecode:state[0].stategstcode 
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
                console.log('city', cityname);
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
            companycity: '',
        });
        this.cities = [];

        if (!stateId) {
            return;
        }
        const statepayload={
            p_returntype:'STATE',
            p_returnvalue:1
        };
        const payload = {
            ...this.getUserDetails,
            p_returntype: 'CITY',
            p_returnvalue: stateId
        };
         
this.inventoryService.Getreturndropdowndetails(statepayload).subscribe({
    next: (res)=>{
        
          console.log('shgvdhv:',data.value)
        if(res.data && res.data.length>0){  
            const stateCode=this.states.filter(s=>s.state_id===data.value);
            this.profileForm.patchValue({
                statecode:stateCode[0].stategstcode
            })
        }
    }
})

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
    //    onStateChange(StateId:any){
    //         const state= this.states.find(s=>s.state_id===data.value) ;
    //         if(state){
    //             const payload={
    //                 ...this.getUserDetails,
    //                 "p_returntype":'CITY',
    //                 "p_returnvalue":StateId
    //             }
    //             this.inventoryService.Getreturndropdowndetails(payload).subscribe({
    //                 next:(res)=>{
    //                     if(res.data && res.data.length>0){
    //                         this.cities=res.data || [];
    //                     }
    //                 },
    //                  error:(err)=>console.log(err)
    //             })
    //         }
    //     }

    patchFromData(data: any) {
        if (!data) {
            console.warn('No data provided to patchFromData');
            return;
        }

        // Also check if countries are loaded
        if (this.countries.length === 0) {
            console.warn('Countries not loaded yet, delaying patchFromData');
            setTimeout(() => this.patchFromData(data), 100);
            return;
        }
        const country = this.countries.find((c) => c.country_id === data.companycountry || c.company_id?.toLowerCase() === data.companycountry?.toLowerCase());
        const countryId = country ? country.country_id : data.companycountry;
        //  const state= this.states.find(s=>s.state_name === data.companystate || s.state_name?.toLowerCase() === data.companystate?.toLowerCase());
        //  const stateId=state? state.state_id:data.companystate;
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
            // statecode:data.statecode,
            bankname:data.bankname,
            ifsc:data.ifsc,
            branch:data.branch,
            pan:data.pan,
            companypincode:data.companypincode
        });
        if (countryId) {
            this.onGetState(countryId, data.companystate,data.statecode,data.companycity);
        }
    }
    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
}
