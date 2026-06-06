import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-work',
  imports: [
    CommonModule,
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
    FluidModule,
    MessageModule,
    DatePickerModule,
    DialogModule,
    ConfirmDialogModule,
    CheckboxModule,
    GlobalFilterComponent
  ],
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss'],
  providers: [ConfirmationService]
})
export class WorkComponent implements OnInit {
   showGlobalSearch: boolean = true;
   globalFilter: string = '';
   workList:any[]=[
    {
      "project": "Project A",
      "period": "June 26",
      "work": "Tower A",
      "completed": false
    },
    {
      "project": "Project B",
      "period": "July 26",
      "work": "Sale",
      "completed": true
    }
  ];
   filterWorkList:any[]=[];

  salesForm!: FormGroup;
  projectOptions:any[]=[
    {label:'Project A', value:'Project A'}
  ];
  periodOptions: { label: string; value: string }[] = [
    { label: 'June 26', value: 'June 26' },
    { label: 'July 26', value: 'July 26' },
    { label: 'Aug 26', value: 'Aug 26' },
    { label: 'Sept 26', value: 'Sept 26' },
    { label: 'Oct 26', value: 'Oct 26' },
    { label: 'Nov 26', value: 'Nov 26' },
    { label: 'Dec 26', value: 'Dec 26' }
  ];

  // Dynamically filtered — excludes completed works
  availableWorkOptions: { label: string; value: string }[] = [];

  constructor(private fb: FormBuilder, private confirmationService: ConfirmationService) {}

  ngOnInit() {
  this.salesForm = this.fb.group({
    p_project: [null],
    p_period: [null],
    p_location: [null],
    workcode: [''],
    p_work: [null],
    items: this.fb.array([])
  });

  this.filterWorkList = [...this.workList];
}

  add(){
    const formValue = this.salesForm.value;
    if (!formValue.p_project || !formValue.p_period || !formValue.p_work) {
    return;
  }

  const newRow = {
    project: formValue.p_project,
    period:formValue.p_period,
    work: formValue.p_work,
    completed: false
  };

  this.workList.push(newRow);
  this.filterWorkList = [...this.workList];

   this.salesForm.patchValue({
    p_project: null,
    p_period: null,
    workcode: '',
    p_work: null
  });
  }

  removeItem(index: number) {
      this.confirmationService.confirm({
            message: 'Are you sure you want to submit?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.workList.splice(index, 1);
  this.filterWorkList = [...this.workList];
            }
        });
  }

  
  onCompletedChange(index: number) {
  }

  onSubmit() {
    if (this.salesForm.valid) {
     this.confirmationService.confirm({
            message: 'Are you sure you want to submit?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                
            }
        });
    }
  }

applyGlobalFilter() {
        const value = this.globalFilter?.toLowerCase().trim();
        if (!value) {
            this.filterWorkList = [...this.workList];
            return;
        }
        this.filterWorkList = this.workList.filter((user) => Object.values(user).some((v) => String(v).toLowerCase().includes(value)));
    }

  onReset() {
    this.salesForm.reset();
    this.filterWorkList = [...this.workList];
  }
}