import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { ItemDetail } from '@/types/product';
interface Product {
    name: string;
    price: string;
    code: string;
    sku: string;
    status: string;
    tags: string[];
    category: string;
    colors: string[];
    stock: string;
    inStock: boolean;
    description: string;
    images: Image[];
}

interface Image {
    name: string;
    objectURL: string;
}

@Component({
    selector: 'app-credit-note',
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
        ToggleSwitchModule,
        RippleModule,
        ChipModule,
        FluidModule,
        MessageModule,
        DatePickerModule,
        DialogModule,
        AutoCompleteModule,
        ConfirmDialogModule,
        CheckboxModule
    ],
    templateUrl: './credit-note.component.html',
    styleUrl: './credit-note.component.scss',
    providers: [ConfirmationService]
})
export class CreditNoteComponent {
    CreditForm!: FormGroup;

    totalAmount: number = 0;
    public selection: boolean = true;
    public pagedProducts: StockIn[] = [];
    public first: number = 0;
    public rowsPerPage: number = 5;
    currentDate: Date = new Date();
    companyName: string = '';
    suppliername: string = '';
    companyAddress: string = '';
    companycity: string = '';
    companystate: string = '';
    statecode: string = '';
    companyemail: string = '';
    companygstno: string = '';
    bankname: string = '';
    accountno: string = '';
    branchname: string = '';
    ifsc: string = '';
    pan: string = '';
    profileOptions: any = {};
    vendorOptions = [];
    public debittnotList: ItemDetail[] = [];
    public replacecednlist: ItemDetail[] = [];
    public selectedItems: any[] = [];
    public stroeitemlist: ItemDetail[] = [];
    products: StockIn[] = [];
    constructor(
        private fb: FormBuilder,
        private prouctsaleservice: InventoryService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadall();
    }
    OnCreditForm() {
        this.CreditForm = this.fb.group({
            p_debitNote: [null],
            p_creditNote: [null, Validators.maxLength(25)],
            p_vendorid: ['', [Validators.required]],
            p_sale: this.fb.array([])
        });
    }
    loadall() {
        this.OnCreditForm();
        this.OnReplacedn();
        this.OnDNN();
        this.OnGetVendor();
        this.OnGetProfile();
    }
    createSaleRow(item: any): FormGroup {
        return this.fb.group({
            transactiondetailid: [item.transactiondetailid],
            itemid: [item.itemid],
            itemsku: [item.itemsku],
            itembarcode: [item.itembarcode],
            itemname: [item.itemname],
            uomid: [item.uomid],
            uomname: [item.uomname]
        });
    }

    get saleArray(): FormArray {
        return this.CreditForm.get('p_sale') as FormArray;
    }
    onSelectionChange(selected: any[]) {
        this.selectedItems = selected;

        // --- Clear form array ---
        this.saleArray.clear();

        // --- Add only selected rows back ---
        selected.forEach((item) => {
            this.saleArray.push(this.createSaleRow(item));
        });

        console.log('Selected Items:', this.selectedItems);
        console.log('FormArray:', this.saleArray.value);
    }

    get grandTotal(): number {
        if (!this.replacecednlist || this.replacecednlist.length === 0) return 0;
        return this.replacecednlist.reduce((sum, item: any) => {
            const quantity = item.quantity || 0;
            const cost = item.itemcost || 0;
            return sum + quantity * cost;
        }, 0);
    }

 reset() {
    this.CreditForm.reset();
    this.saleArray.clear();
    this.replacecednlist = [...this.stroeitemlist];
    if (this.selectedItems && this.selectedItems.length > 0) {
        const selectedIds = this.selectedItems
            .map(item => item.transactiondetailid || item.id)
            .filter(id => id != null);
        this.replacecednlist = this.replacecednlist.filter(item => 
            !selectedIds.includes(item.transactiondetailid || item.itemid)
        );
    }
    this.selectedItems = [];
}
    createDropdownPayload(returnType: string) {
        return {
            p_returntype: returnType
        };
    }
    OnGetProfile() {
        const payload = this.createDropdownPayload('PROFILE');
        this.prouctsaleservice.getdropdowndetails(payload).subscribe({
            next: (res) => {
                if (res.data && res.data.length > 0) {
                    this.profileOptions = res.data;
                    const profile = res.data[0];
                    ((this.companyName = profile.companyname),
                        (this.companyAddress = profile.companyaddress),
                        (this.companystate = profile.state_name),
                        (this.companycity = profile.city_name),
                        (this.companyemail = profile.companyemail),
                        (this.companygstno = profile.companygstno),
                        (this.statecode = profile.statecode),
                        (this.bankname = profile.bankname),
                        (this.accountno = profile.accountno),
                        (this.branchname = profile.branch),
                        (this.ifsc = profile.ifsc),
                        (this.pan = profile.pan));
                }
            },
            error: (err) => console.log(err)
        });
    }
    //REPLACEDN
    OnReplacedn() {
        const apibody = this.createDropdownPayload('REPLACEDN');
        delete (apibody as any).p_loginuser;
        this.prouctsaleservice.getdropdowndetails(apibody).subscribe({
            next: (res) => {
                const list: [] = res.data;
                this.replacecednlist = list;
                this.stroeitemlist = list;
                console.log(this.replacecednlist);
            }
        });
    }

    OnGetVendor() {
        const payload = this.createDropdownPayload('VENDOR');
        this.prouctsaleservice.getdropdowndetails(payload).subscribe({
            next: (res) => (this.vendorOptions = res.data),
            error: (err) => console.log(err)
        });
    }

    // Debit note
    OnDNN() {
        const apibody = this.createDropdownPayload('DNN');
        delete (apibody as any).p_loginuser;
        this.prouctsaleservice.getdropdowndetails(apibody).subscribe({
            next: (res) => {
                const creditstore: any = res.data;
                this.debittnotList = creditstore;
            }
        });
    }
    Ganratedn(type: string) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to submit?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.selectedItems = [...this.saleArray.value];
                this.accpatHeaderCreate(this.saleArray.value, type);
            }
        });
    }

    accpatHeaderCreate(saledata: any, type: string) {
        const vendorid = this.CreditForm.get('p_vendorid')?.value;
        let apibody: any = {
            p_transactiontype: type, // CREDITNOTE or DEBITNOTE
            p_transactionid: 0,
            p_transactiondate: '',
            p_mobileno: '',
            p_totalcost: 0,
            p_totalsale: 0,
            p_overalldiscount: 0,
            p_roundoff: '0.00',
            p_totalpayable: 0,
            p_currencyid: 0,
            p_gsttran: 'N',
            p_status: 'Complete',
            p_isactive: 'Y',
            p_linktransactionid: vendorid,
            p_replacesimilir: '',
            p_paymentmode: '',
            p_paymentdue: 0,
            p_sale: saledata
        };

        // ⭐ ADD CONDITION
        if (apibody.p_transactiontype === 'CREDITNOTE') {
            apibody.p_customername = this.replacecednlist[0]?.dnno; // add key
            apibody.p_creditnoteno = this.CreditForm.get('p_creditNote')?.value;
        } else {
            delete apibody.p_customername; // remove key
        }
        this.prouctsaleservice.OninsertSalesDetails(apibody).subscribe({
            next: (res) => {
                if (res.data[0].billno != null) {
                    this.OnDNN();
                    this.RetunCredit({ value: res.data[0].billno });
                    this.CreditForm.patchValue({
                        p_debitNote: res.data[0].billno
                    });
                }

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: res.data[0].msg,
                    life: 3000
                });
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save sales. Please try again.',
                    life: 3000
                });
            }
        });
    }

    RetunCredit(dnndata: any) {
        if (dnndata.value == null) return;
        let apibody = {
            p_returntype: 'DNN',
            p_returnvalue: dnndata.value
        };
        delete (apibody as any).p_loginuser;
        this.prouctsaleservice.Getreturndropdowndetails(apibody).subscribe({
            next: (res) => {
                this.selectedItems = res.data;
                this.replacecednlist = res.data;
                this.calculateTotal(this.replacecednlist);
                this.CreditForm.patchValue({
                    p_creditNote: this.replacecednlist[0]?.cnno,
                    p_vendorid: this.replacecednlist[0]?.vendorid
                });
                this.suppliername = res.data[0].suppliername;
            }
        });
    }

    calculateTotal(data: any[]) {
        this.totalAmount = data.reduce((sum, row) => {
            return sum + row.quantity * row.itemcost;
        }, 0);
    }
    print() {
        const printContents = document.getElementById('printSection')?.innerHTML;
        if (!printContents) return;

        const popup = window.open('', '_blank', 'width=900,height=1500');

        popup!.document.open();
        popup!.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
         
            <style>
               @page {
                        margin: 0;
                        size: auto;
                    }
                /* Consistent with invoice print styling */
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0;
                    padding: 20px;
                    width: 900px;
                    margin: 0 auto;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                th, td {
                    border: 1px solid #000;
                    padding: 6px;
                }
                
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                
                @media print {
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0;
                        padding: 20px;
                    }
                    
                    table { 
                        border-collapse: collapse; 
                        width: 100%;
                    }
                    
                    th, td { 
                        border: 1px solid #000; 
                        padding: 6px;
                    }
                    
                    /* Hide header/footer in print */
                    header, footer {
                        display: none !important;
                    }
                    
                    /* Ensure proper page breaks */
                    .page-break {
                        page-break-before: always;
                    }
                }
            </style>
        </head>
        <body>
            ${printContents}
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `);

        popup!.document.close();
    }
}
