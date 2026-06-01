import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { StockIn } from '@/types/stockin.model';
import { InventoryService } from '@/core/services/inventory.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { AuthService } from '@/core/services/auth.service';
import { DrowdownDetails } from '@/core/models/inventory.model';
import { MessageService } from 'primeng/api';
import { ShareService } from '@/core/services/shared.service';
import { AddinventoryComponent } from '@/pages/inventory/addinventory/addinventory.component';


@Component({
  selector: 'app-rented',
  imports:[CommonModule,
        EditorModule,
        ReactiveFormsModule,
        TextareaModule,
        TableModule,
        InputTextModule,
        FormsModule,
        FileUploadModule,
        ButtonModule,
        SelectModule,
        DropdownModule,
        ToggleSwitchModule,
        RippleModule,
        ChipModule,
        FluidModule,
        MessageModule,
        DatePickerModule,
        DialogModule,
        AddinventoryComponent,
        AutoCompleteModule,
        ConfirmDialogModule,
        CheckboxModule],
  templateUrl: './rented.component.html',
  styleUrls: ['./rented.component.scss'],
})
export class RentedComponent  implements OnInit {

  rentForm!:FormGroup;
purchaseIdOptions:any[]=[]
vendorOptions:any[]=[]
itemOptionslist:any[]=[]
  constructor(
     private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService,
        public datePipe: DatePipe,
        private messageService: MessageService,
        private sharedService: ShareService,
        private route:Router
  ) { }

  ngOnInit() {
    this.rentForm = this.fb.group({

    })
  }

  purchaseIdDetails(event:any){

  }
  onSubmit(){

  }

}
