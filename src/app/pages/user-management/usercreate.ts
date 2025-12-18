import { Component, inject } from '@angular/core';
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

@Component({
    selector: 'user-create',
    standalone: true,
    imports: [Select, InputText, TextareaModule, FileUploadModule, ButtonModule, InputGroupModule, RippleModule, CommonModule, ReactiveFormsModule, RouterLink],
    template: `<div class="card">
        <span class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-6 block">Profile Creation</span>
        <!-- <div  class="col-span-12 lg:col-span-10"> -->
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="col-span-12 lg:col-span-10">
            <div class="grid grid-cols-12 gap-6">
                <div class="col-span-12 md:col-span-6">
                    <label class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Name</label>
                    <input formControlName="companyname" type="text" pInputText placeholder="Company Name" fluid />
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label for="companyemail" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Email </label>
                    <input formControlName="companyemail" type="email" pInputText fluid placeholder="Company Email" />
                    <small class="text-red-500 mt-1" *ngIf="profileForm.get('companyemail')?.touched && profileForm.get('companyemail')?.invalid"> Enter a valid email address </small>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label for="companygstno" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> GST No </label>
                    <input formControlName="companygstno" type="text" pInputText fluid placeholder="GST No." maxlength="15" />
                    <small class="text-red-500 mt-1" *ngIf="profileForm.get('companygstno')?.touched && profileForm.get('companygstno')?.invalid"> Enter a valid gst number </small>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label for="companyphone" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Phone</label>
                    <input formControlName="companyphone" type="text" pInputText fluid placeholder="Company Phone" maxlength="10" (keypress)="allowOnlyDigits($event)" />
                    <small class="text-red-500 mt-1" *ngIf="profileForm.get('companyphone')?.touched && profileForm.get('companyphone')?.invalid"> Enter a valid 10-digit mobile number </small>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label for="companyaddress" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Address</label>
                    <input formControlName="companyaddress" type="text" pInputText fluid placeholder="Address" />
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label for="companycontactperson" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Company Contact Person </label>
                    <input formControlName="companycontactperson" type="text" pInputText fluid placeholder="Comapny Contact Person" />
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label for="companycountry" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Country </label>
                    <p-select inputId="companycountry" formControlName="companycountry" [options]="countries" optionLabel="name" fluid [filter]="true" filterBy="name" [showClear]="true" placeholder="Select a Country">
                        <ng-template let-country #item>
                            <div class="flex items-center">
                                <img src="https://primefaces.org/cdn/primeng/images/flag/flag_placeholder.png" [class]="'mr-2 flag flag-' + country.code.toLowerCase()" style="width:18px" />
                                <div>{{ country.name }}</div>
                            </div>
                        </ng-template>
                    </p-select>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label for="companycontactphone" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Comapny Contact Phone</label>
                    <input formControlName="companycontactphone" type="text" pInputText fluid placeholder="Company Contact Phone" maxlength="10" (keypress)="allowOnlyDigits($event)" />
                    <small class="text-red-500 mt-1" *ngIf="profileForm.get('companycontactphone')?.touched && profileForm.get('companycontactphone')?.invalid"> Enter a valid 10-digit mobile number </small>
                </div>

 <div class="col-span-12 md:col-span-6">
                    <label for="companystate" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> State </label>
                    <input formControlName="companystate" type="text" pInputText fluid placeholder="State" />
                </div>
               

                <div class="col-span-12 md:col-span-6">
                    <label for="companycontactemail" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Contact Email </label>
                    <input formControlName="companycontactemail" type="email" pInputText fluid placeholder="Company Contact Email" />
                    <small class="text-red-500 mt-1" *ngIf="profileForm.get('companycontactemail')?.touched && profileForm.get('companycontactemail')?.invalid"> Enter a valid email address </small>
                </div>
                 <div class="col-span-12 md:col-span-6">
                    <label for="companycity" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> City </label>
                    <input formControlName="companycity" type="text" pInputText fluid placeholder="City" />
                </div>

                <div class="col-span-12 md:col-span-6 flex flex-col items-start">
                    <label for="companylogo" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Logo</label>
                    <p-fileupload mode="basic" name="companylogo" url="./upload.php" accept="image/*" [maxFileSize]="1000000" styleClass="p-button-outlined p-button-plain" chooseLabel="Upload Image"></p-fileupload>
                </div>
                

                @if(loggedInUserRole==='Admin')
                {<div class="flex flex-col">
                    <button pButton pRipple type="submit" label="Submit" class="w-auto mt-3" [disabled]="profileForm.invalid"></button>
                </div>

                <div class="flex flex-col">
                    <button pButton pRipple type="button" label="Close" class="w-auto mt-3" routerLink="/layout"></button>
                </div>
                }
            </div>
        
            <!-- </div> -->
        </form>
    </div>`
})
export class UserCreate {
    fb = inject(FormBuilder);
    userList: any[] = [];
    countries: any[] = [];
    loggedInUserRole:string='';
    profileForm: FormGroup = this.fb.group({
        companyname: ['', Validators.maxLength(50)],
        companyemail: ['', [Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(50)]],
        companygstno: ['',[Validators.required]],
        companycontactperson: ['', Validators.maxLength(50)],
        companyaddress: ['', Validators.maxLength(100)],
        companycontactphone: ['', Validators.pattern(/^[0-9]{10}$/)],
        companycontactemail: ['', [Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(50)]],
        companycountry: ['',Validators.required],
        companystate: ['', Validators.maxLength(50)],
        companycity: ['', Validators.maxLength(50)],
        companyphone: ['', Validators.pattern(/^[0-9]{10}$/)]
    });
    
    constructor(private inventoryService:InventoryService, private userService : UserService,private authservice:AuthService,private messageService:MessageService){}
    ngOnInit() {
       
        this.countries = [
           
            // { name: 'Australia', code: 'AU' },
            // { name: 'Brazil', code: 'BR' },
            // { name: 'China', code: 'CN' },
            // { name: 'Egypt', code: 'EG' },
            // { name: 'France', code: 'FR' },
            // { name: 'Germany', code: 'DE' },
            { name: 'India', code: 'IN' },
            // { name: 'Japan', code: 'JP' },
            // { name: 'Spain', code: 'ES' },
            // { name: 'United States', code: 'US' }
        ];
        this.loggedInUserRole=this.authservice.isLogIntType().usertypename;
         this.onGetData();
        
    }
    allowOnlyDigits(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char)) {
            event.preventDefault();
        }
    }
    onSubmit() {
        if(this.profileForm.invalid){
            this.profileForm.markAllAsTouched();
            return;
        }
        const form = this.profileForm.value;
        const payload={
    p_companyname : form.companyname,
	p_companyaddress : form.companyaddress,
	p_companycity : form.companycity,
	p_companystate : form.companystate,
	p_companycountry : form.companycountry?.name,
	p_companypincode : "490001",
	p_companyphone: form.companyphone,
	p_companyemail : form.p_companycontactemail || null,
	p_companygstno : form.companygstno,
	p_companycontactperson : form.companycontactperson,
	p_companycontactphone : form.companycontactphone,
	p_companycontactemail : form.companycontactemail,
	p_companylogo : null
        };
     this.userService.OnUserListHeaderCreate(payload).subscribe({
        next:(res:any)=>{
             console.log('API RESULT:', res.data);
             this.showSuccess('Profile details saved successfully');
        },
        error: (err) => {
                console.error(err);
        }
     });
    }
 
    createDropdownPayload(returnType:string){
       return{
         uname: "admin",
    p_username: "admin",
    p_returntype: returnType
       }
    }

    onGetData(){
        const  payload= this.createDropdownPayload('PROFILE');
        this.inventoryService.getdropdowndetails(payload).subscribe({
            
            next:(res)=>
            { if(res.data){
                    this.patchFromData(res.data[0]);
                    if(this.loggedInUserRole !=='Admin'){
                        this.profileForm.disable();
                    }
                    else{
                        this.profileForm.enable();
                    }
            }
            },
            error: (err) => console.log(err)
        });
    }
    patchFromData(data:any){
           this.profileForm.patchValue({
                    companyname:data.companyname,
                     companyemail: data.companyemail,
                    companygstno: data.companygstno,
                    companycontactperson: data.companycontactperson,
                    companyaddress: data.companyaddress,
                    companycontactphone: data.companycontactphone,
                    companycontactemail: data.companycontactemail,
                    companycountry: this.countries.find(c=>c.name === data.companycountry),
                    companystate: data.companystate,
                    companycity: data.companycity,
                    companyphone: data.companyphone
                });
    }
     showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
}
