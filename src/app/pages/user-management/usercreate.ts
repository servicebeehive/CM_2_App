import { Component, inject } from '@angular/core';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { RippleModule } from 'primeng/ripple';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";

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
                        <input formControlName="firmName" type="text" pInputText placeholder="Company Name" fluid />
                    </div>
                        
                     <div class="col-span-12 md:col-span-6">
                        <label for="email" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Email </label>
                        <input formControlName="email" type="email" pInputText fluid placeholder="Email" />
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label for="gstNo" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> GST No </label>
                        <input formControlName="gstNo" type="text" pInputText fluid placeholder="GST No." />
                    </div>

 <div class="col-span-12 md:col-span-6">
                        <label for="phoneNo" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Phone</label>
                        <input formControlName="phoneNo" type="text" pInputText fluid placeholder="Phone" />
                    </div>

                     <div class="col-span-12 md:col-span-6">
                        <label for="address" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Address</label>
                        <input formControlName="address" type="text" pInputText fluid placeholder="Address" />
                    </div>

 <div class="col-span-12 md:col-span-6">
                        <label for="ownerName" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Owner Name </label>
                        <input formControlName="ownerName" type="text" pInputText fluid placeholder="Owner Name" />
                    </div>
                    
                    <div class="col-span-12 md:col-span-6">
                        <label for="country" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Country </label>
                        <p-select inputId="country" [options]="countries" optionLabel="name" fluid [filter]="true" filterBy="name" [showClear]="true" placeholder="Select a Country">
                            <ng-template let-country #item>
                                <div class="flex items-center">
                                    <img src="https://primefaces.org/cdn/primeng/images/flag/flag_placeholder.png" [class]="'mr-2 flag flag-' + country.code.toLowerCase()" style="width:18px" />
                                    <div>{{ country.name }}</div>
                                </div>
                            </ng-template>
                        </p-select>
                    </div>

 <div class="col-span-12 md:col-span-6">
                        <label for="ownerPhoneNo" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Owner Phone</label>
                        <input formControlName="ownerPhoneNo" type="text" pInputText fluid placeholder="Owner Phone" />
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label for="city" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> City </label>
                        <input formControlName="city" type="text" pInputText fluid placeholder="City" />
                    </div>

<div class="col-span-12 md:col-span-6">
                        <label for="state" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> State </label>
                        <input formControlName="state" type="text" pInputText fluid placeholder="State" />
                    </div>


                     <div class="col-span-12 md:col-span-6">
                        <label for="ownerEmail" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Owner Email </label>
                        <input formControlName="ownerEmail" type="email" pInputText fluid placeholder="Owner Email" />
                    </div>

                    
                    <div class="col-span-12 md:col-span-6 flex flex-col items-start">
                        <label for="avatar" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Company Logo</label>
                        <p-fileupload mode="basic" name="avatar" url="./upload.php" accept="image/*" [maxFileSize]="1000000" styleClass="p-button-outlined p-button-plain" chooseLabel="Upload Image"></p-fileupload>
                    </div>
                    
                    <div class="flex flex-col">
                        <button pButton pRipple type="submit" label="Submit" class="w-auto mt-3"></button>
                    </div>

                     <div class="flex flex-col">
                        <button pButton pRipple type="button" label="Close" class="w-auto mt-3" routerLink="/layout"></button>
                    </div>
                </div>
<!-- </div> -->
</form>
</div>`
})
export class UserCreate {
    fb=inject(FormBuilder);
    profileForm: FormGroup = this.fb.group({
        firmName:[''],
        email:[''],
        gstNo:[''],
        ownerName:[''],
        address:[''],
        ownerPhoneNo:[''],
        ownerEmail:[''],
        country:[''],
        state:[''],
        city:[''],
        phoneNo:['']
    });
    countries: any[] = [];

    ngOnInit() {
        this.countries = [
            { name: 'Australia', code: 'AU' },
            { name: 'Brazil', code: 'BR' },
            { name: 'China', code: 'CN' },
            { name: 'Egypt', code: 'EG' },
            { name: 'France', code: 'FR' },
            { name: 'Germany', code: 'DE' },
            { name: 'India', code: 'IN' },
            { name: 'Japan', code: 'JP' },
            { name: 'Spain', code: 'ES' },
            { name: 'United States', code: 'US' }
        ];
    }
    onSubmit(){

    }
}
