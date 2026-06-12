import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { InventoryService } from '@/core/services/inventory.service';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '@/core/services/auth.service';
import { RadioButtonModule } from 'primeng/radiobutton';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-balance-sheet',
  imports: [
    CommonModule, EditorModule, ReactiveFormsModule, TextareaModule, TableModule,
    InputTextModule, FormsModule, FileUploadModule, ButtonModule, SelectModule,
    DropdownModule, ToggleSwitchModule, RippleModule, ChipModule, FluidModule,
    MessageModule, DatePickerModule, DialogModule, AutoCompleteModule,
    CheckboxModule, RadioButtonModule
  ],
  templateUrl: './balance-sheet.component.html',
  styleUrl: './balance-sheet.component.scss',
  providers: [DatePipe]
})
export class BalanceSheetComponent implements OnInit {
  reportForm!: FormGroup;
  today: Date = new Date();
  products: any[] = [];
  filteredProducts: any[] = [];
  summaryTotal = 0;
  detailTotal=0;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private messageService: MessageService,
    public datepipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.reportForm = this.fb.group(
      {
        item: [{ value: '', disabled: true }],
        fromDate: [this.today, [Validators.required]],
        toDate: [this.today, [Validators.required]],
        // reportType: ['PNLSUMMARY', Validators.required]
      },
      { validators: this.dateRangeValidator }
    );
  }

  dateRangeValidator(form: FormGroup) {
    const fromDate = form.get('fromDate')?.value;
    const toDate   = form.get('toDate')?.value;
    if (!fromDate || !toDate) return null;
    return new Date(toDate) >= new Date(fromDate) ? null : { dateRangeInvalid: true };
  }

  Onreturndropdowndetails() {
    // const reportType = this.reportForm.get('reportType')?.value;
    const fromdate = this.reportForm.get('fromDate')?.value;
    const todate = this.reportForm.get('toDate')?.value;
    const loginuser = this.authService.isLogIntType()?.userid.toString();

    const from = new Date(fromdate);
        const to = new Date(todate);
        if (to < from) {
            this.errorSuccess('To Date must be greater than or equal to From Date.');
            return;
        }

    const payload = {
      // p_reporttype: reportType,
      p_reporttype: 'PNLSUMMARY',
      p_fromdate: this.datepipe.transform(fromdate, 'yyyy/MM/dd'),
      p_todate: this.datepipe.transform(todate, 'yyyy/MM/dd'),
      p_loginuser: loginuser
    }
    this.inventoryService.get_pnl(payload).subscribe({
      next:(res:any)=>{
//  if (reportType === 'PNLSUMMARY') {
      this.filteredProducts = res.data;
      this.calculateSummaryTotals();
    // }
    //  else if (reportType === 'PNLDETAIL') {
    //   this.filteredProducts = res.data;
    //   this.calculateDetailTotals();
    // }
      }
    })
   
  }

  calculateSummaryTotals() {
    this.summaryTotal = this.filteredProducts.reduce(
      (acc,row) =>
      acc + (parseFloat(row.profit) || 0),0
    )
  }

  // calculateDetailTotals() {
  //  this.detailTotal = this.filteredProducts.reduce(
  //     (acc,row) =>
  //     acc + (parseFloat(row.grand_total) || 0),0
  //   )
  // }

  onDownloadClick() {
    if(!this.filteredProducts || this.filteredProducts.length === 0){
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'No data to download' });
    return;
    }

     const excelData = this.filteredProducts.map(row => ({
    'Period':           row.period,
    'Sale':             row.sale,
    'Return':           row.return,
    'Purchase':         row.purchase,
    'Misc Charge':      row.misc_charge,
    'Write Off Amount': row.writeoff_amount,
    'Grand Total':      row.grand_total,
     'Profit':           row.profit
  }));

   excelData.push({
    'Period':           'Grand Total',
    'Sale':             '',
    'Return':           '',
    'Purchase':         '',
    'Misc Charge':      '',
    'Write Off Amount': '',
    'Grand Total':      '',
    'Profit':            this.summaryTotal
  });

   const worksheet  = XLSX.utils.json_to_sheet(excelData);
  const workbook   = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PNL Summary');

   worksheet['!cols'] = [
    { wch: 15 }, // Period
    { wch: 12 }, // Sale
    { wch: 12 }, // Return
    { wch: 12 }, // Purchase
    { wch: 14 }, // Misc Charge
    { wch: 18 }, // Write Off Amount
    { wch: 14 }, // Grand Total
    { wch: 12 }, // Profit 
  ];

  const fromDate = this.datepipe.transform(this.reportForm.get('fromDate')?.value, 'ddMMMyyyy');
  const toDate   = this.datepipe.transform(this.reportForm.get('toDate')?.value,   'ddMMMyyyy');
  const fileName = `PNL_Summary_${fromDate}_to_${toDate}.xlsx`;

  XLSX.writeFile(workbook, fileName);
   }

  reset() {
    this.reportForm.reset({
      fromDate: this.today,
      toDate: this.today,
      // reportType: 'PNLSUMMARY'
    });
    this.filteredProducts = [];
   
  }

   errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}