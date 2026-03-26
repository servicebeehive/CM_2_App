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
import { ConfirmationService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { UserService } from '@/core/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { state } from '@angular/animations';

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
    states : any[]=[];
    cities: any[]=[];
    public getUserDetails = {};
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;
     
    masterDetails: [] = [];
    loggedInUserName: string = '';
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
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.initForm();

        this.route.paramMap.subscribe((params) => {
            const master = params.get('master') || 'categorymaster';
            this.masterForm.get('master')?.setValue(master);
            this.updateTitleMaster(master);
            this.tableColumns = this.tableConfig[master];
            this.loadMasterData(master);
        });
        this.filterMaster = [...this.masterDetails];
        // this.onGetUserList();
        this.loggedInUserName = this.authService.isLogIntType().username;
        this.loggedInUserRole = this.authService.isLogIntType().usertypename;

        this.onGetCountry();
    }

    initForm() {
        this.masterForm = this.fb.group({
          master:['categorymaster'],
            checked: [true]
        });
        // this.masterForm.get('master')?.valueChanges.subscribe((value) => {
        //     this.updateTitleMaster(value);
        //     this.loadMasterData(value);
        //     this.tableColumns = this.tableConfig[value];
        // });
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
            { field: 'customername', header: 'Name',width:'300px' },
            { field: 'customerphone', header: 'Phone' },
            { field: '', header: 'Gst No'},
            { field: 'cityforall', header: 'City' },
            { field: 'isactive', header: 'Active', width:'80px' }
        ],
        suppliermaster: [
            { field: 'suppliername', header: 'Name',width:'300px' },
            { field: 'supplierphone', header: 'Phone' },
            { field: '', header: 'Gst No'},
            { field: 'cityforall', header: 'City' },
            { field: 'isactive', header: 'Active', width:'80px' }
        ],
    };
    /** ✳️ Add User Dialog **/
    openUserDialog() {
        if (!this.masterForm) return;
        this.selectedMaster = this.masterForm.get('master')?.value ?? 'categorymaster';
        this.addControlsByMaster(this.selectedMaster);
        const dialogTitleMap: Record<string, string> = {
            customermaster: 'Add Customer',
            suppliermaster: 'Add Supplier'
        };
        this.dialogTitle = dialogTitleMap[this.selectedMaster] ?? 'Add';
        console.log('master', this.selectedMaster, dialogTitleMap);
        // this.resetFormByMaster(this.selectedMaster);
        this.visibleDialog = true;
    }
    addControlsByMaster(master: string) {
        Object.keys(this.masterForm.controls).forEach((key) => {
            if (key !== 'master' && key!=='checked') {
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
            this.masterForm.addControl('customerphone', this.fb.control('', Validators.required));
            this.masterForm.addControl('customeremail', this.fb.control(''));
            this.masterForm.addControl('customergstno', this.fb.control('',[gstNumberValidator]));
            this.masterForm.addControl('customercontactname', this.fb.control(''));
            this.masterForm.addControl('customercontactphone', this.fb.control(''));
            this.masterForm.addControl('customercontactemail', this.fb.control('', [Validators.email]));
        }
        
        if (master === 'suppliermaster') {
            this.masterForm.addControl('suppliername', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplieraddress', this.fb.control('', Validators.required));
            this.masterForm.addControl('countryforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('stateforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('cityforall', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplierpincode', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplierphone', this.fb.control('', Validators.required));
            this.masterForm.addControl('supplieremail', this.fb.control('', [Validators.email]));
            this.masterForm.addControl('suppliergstno', this.fb.control('',[gstNumberValidator]));
            this.masterForm.addControl('suppliercontactname', this.fb.control(''));
            this.masterForm.addControl('suppliercontactphone', this.fb.control(''));
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

    openEditDialog(user: any) {
        this.visibleDialog = true;
        this.editMode = true;
        this.selectedUser = user;

        console.log('user role', user.usertypename);
        this.masterForm.patchValue({
            p_categorydesc: user.usertypeid,
            p_categoryname: user.username,
            checked: user.isactive === 'Y'
        });
    }

    closeDialog() {
        this.visibleDialog = false;
    }
    //  onGetUserList(){
    //    const payload:any = {
    //     "p_ufullname": "",
    //     "p_categoryname":"admin",
    //     "p_pwd": "",
    //     "p_active": "",
    //     "p_operationtype": "GETUSER",
    //     "p_phone": "",
    //     "p_categorydesc": "",
    //     "p_email": "",
    //     "p_oldpwd": "",
    //    };
    //    this.userService.OnUserHeaderCreate(payload).subscribe({
    //     next:(res)=>{
    //       console.log('res:',res);
    //       this.user=res.data || [];
    //       if(this.loggedInUserRole ==='Admin' || this.loggedInUserRole==='admin'){
    //           this.filterMaster=[...this.user];
    //       }
    //       else{
    //         this.filterMaster=this.user.filter(u=>u.username === this.loggedInUserName);
    //       }

    //     },
    //     error:(err)=>{
    //       console.error(err);
    //     }
    //    });
    //  }
    loadMasterData(masterKey: string) {
        const payloadType = this.masterPayloadMap[masterKey];
        if (!payloadType) return;
        const payload = this.createDropdownPayload(payloadType);
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                ((this.masterDetails = res.data || []), console.log(this.masterDetails));
                this.filterMaster = [...this.masterDetails];
            },
            error: (err) => console.log(err)
        });
    }
    onUserCreation(data: any) {
        console.log('user role:', data.p_categorydesc);
        const payload: any = {
            p_operationtype: this.editMode ? 'UPDATE' : 'INSERT',
            p_ufullname: data.p_ufullname,
            p_categoryname: data.p_categoryname,
            p_pwd: data.p_pwd,
            p_active: data.checked ? 'Y' : 'N',
            p_phone: data.p_phone,
            p_categorydesc: data.p_categorydesc.toString(),
            p_email: data.p_email,
            p_oldpwd: ''
        };

        this.userService.OnUserHeaderCreate(payload).subscribe({
            next: (res) => {
                console.log('Create/Update response:', res);
                // Close dialog
                this.visibleDialog = false;
                //  this.onGetUserList();
            },
            error: (err) => {
                console.error('API error', err);
            }
        });
    }

    onGetCountry(){
      const payload = this.createDropdownPayload('COUNTRY');
      this.inventoryService.getdropdowndetails(payload).subscribe({
        next: (res) => {
          this.countries = res.data || [];
        },
        error: (err) => console.log(err)
      });
    }

    onGetState(countryId: string, stateName: string, statecode: string, cityName: string){
      const payload = {
         ...this.getUserDetails,
         p_returntype:'STATE',
         p_returnvalue: countryId
      };
      this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next:(res) =>{
          this.states = res.data || [];
          const state = this.states.filter((s)=>s.state_id === stateName);
          const statename = state[0].state_id;
          if(statename){
            this.masterForm.patchValue({
              stateforall: statename
            });
           this.onGetCity(statename, cityName);
          }
        },
        error: (err) => console.log(err)
      });
    }

    onGetCity(statename: string, cityName: string){
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
         if(city){
          this.masterForm.patchValue({
            cityforall:cityname
          });
         }
      },
      error:(err) => console.log(err)
     });
    }

    onGetStateChange(data:any){
      const stateId = data.value;
      this.masterForm.patchValue({
        cityforall:''
      });
      this.cities = [];

      if(!stateId){
        return;
      }
      
      const payload = {
        ...this.getUserDetails,
        p_returntype: 'CITY',
        p_returnvalue: stateId
      };

      this.inventoryService.Getreturndropdowndetails(payload).subscribe({
        next: (res) => {
          if(res.data && res.data.length>0){
            this.cities=res.data;
            this.masterForm.patchValue({
              cityforall : res.data[0].city_id
            });
          }
        },
        error:(err)=>console.log(err)
      });
    }

    onCountryChange(event:any){
      const countryId = event.value;
      const payload = {
        p_returntype : 'STATE',
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
        const value = this.globalFilter;
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
}
