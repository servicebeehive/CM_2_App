import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { StockIn } from '@/types/stockin.model';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { DrowdownDetails } from '@/core/models/inventory.model';
import { ShareService } from '@/core/services/shared.service';

@Component({
    selector: 'app-grn',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        ConfirmDialogModule,
        DatePickerModule,
        DialogModule,
        DropdownModule,
        InputNumberModule,
        InputTextModule,
        TableModule,
        TabViewModule,
        TooltipModule
    ],
    templateUrl: './grn.component.html',
    styleUrl: './grn.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class GrnComponent implements OnInit {

    // ── Auth ───────────────────────────────────────────────────────────────
    public authService = inject(AuthService);

    // ── Form ───────────────────────────────────────────────────────────────
    productForm!: FormGroup;

    /** True once the user selects a PO number — unlocks all tabs */
    poSelected = false;

    // ── Dialog / item state ────────────────────────────────────────────────
    public transationid: any;
    visibleDialog   = false;
    selectedRow: any = null;
    mode: 'add' | 'edit' = 'add';
    addItemEnabled  = false;
    backshow        = false;
    childUomDialog  = false;
    childUOMList: any[] = [];
    childUomStatus  = false;

    pagedProducts: StockIn[] = [];
    first        = 0;
    rowsPerPage  = 10;
    products: StockIn[] = [];
    itemOptionslist: any[] = [];

    // ── Date cap ───────────────────────────────────────────────────────────
    dateTime = new Date();

    // ── File upload state ──────────────────────────────────────────────────
    fileNames: { challan: string; material: string; qualityreport: string; other: string } = {
        challan: '', material: '', qualityreport: '', other: ''
    };
    uploadedFiles: {
        challan: File | null;
        material: File[] | null;
        qualityreport: File | null;
        other: File[] | null;
    } = { challan: null, material: null, qualityreport: null, other: null };

    qualityReportOptions: { label: string; value: string }[] = [
        { label: 'Y', value: 'Y' },
        { label: 'N', value: 'N' },
        { label: 'P', value: 'P' }
    ];

    // ── Dropdown options ───────────────────────────────────────────────────
    vendorOptions: any[]              = [];
    vendorNameOptions: DrowdownDetails[] = [];
    uomOptions: any[]                 = [];
    categoryOptions: any[]            = [];
    itemOptions: any[]                = [];
    purchaseIdOptions: any[]          = [];
    indentNoOptions: any[]            = [];

    storeLocationOptions: { label: string; value: string }[] = [
        { label: 'Main Warehouse',    value: 'Main Warehouse' },
        { label: 'Site Store A',      value: 'Site Store A' },
        { label: 'Site Store B',      value: 'Site Store B' },
        { label: 'Temporary Storage', value: 'Temporary Storage' }
    ];

    constructor(
        private fb: FormBuilder,
        private stockInService: InventoryService,
        private confirmationService: ConfirmationService,
        public datePipe: DatePipe,
        private messageService: MessageService,
        private sharedService: ShareService,
        private route: Router
    ) {}

    // ── Lifecycle ──────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.initForm();
        this.OnGetDropdown();
        this.loadAllDropdowns();
        this.onGetStockIn();

        const navigation = history.state;
        if (navigation?.stockData && navigation?.itemsData) {
            this.backshow = true;
            this.mode     = navigation.mode || 'edit';
            this.populateStockForm(navigation.stockData, navigation.itemsData);
        }

        this.setupBackButtonListener();
    }

    // ── Form initialisation ────────────────────────────────────────────────
    private initForm(): void {
        this.productForm = this.fb.group({
            // Top 3 (always visible)
            p_tranpurchaseid: [null],
             p_grndate:        [this.dateTime, Validators.required], 
            p_vendorid:       [null, Validators.required],   // PO Number

            // Tab 1: Purchase Order
            p_podate:         [null],
            p_project:        [''],
            p_vendor:         [null, Validators.required],
            p_location:  [null, Validators.required],
            p_worklocation:   [''],
            p_totalpoamount:  [''],
            p_deliveryterms:  [''],
            p_paymentterms:   [''],
            p_poreference:    [''],
            p_contactperson:  [''],
            p_contactno:      [''],

            // Tab 2: Delivery
            p_challanno:      ['', Validators.required],
            p_challandate:    [null, Validators.required],
            p_vehicleno:      [''],
            p_drivername:     [''],
            p_drivermobile:   ['', Validators.pattern(/^[6-9]\d{9}$/)],

            // Tab 3: Remarks
            p_indentno:       [null, Validators.required],
            p_remarks:        ['', Validators.maxLength(500)],

            // Internal
            grandTotal:       [0],
            p_amountpaid:     [0]
        });
    }

    // ── PO Number change: unlock tabs & auto-fill PO fields ───────────────
    onPOChange(event: any): void {
        if (!event.value) {
            this.poSelected    = false;
            this.itemOptionslist = [];
            return;
        }

        this.poSelected    = true;
        this.addItemEnabled = true;

        // ── Mock: auto-fill PO fields ──────────────────────────────────────
        this.productForm.patchValue({
            p_podate:  new Date('2026-05-15'),
            p_project: 'Project A',
            p_worklocation: 'Main Site',
            p_totalpoamount: '524548.81',
            p_deliveryterms: 'For Destination',
            p_paymentterms: '30 Days Credit',
            p_poreference: 'RFQ/2024-25/0001',
            p_contactperson: 'Rakesh Sharma',
            p_contactno: '9876543210'
        });
        this.mapItemsFromPO([
            { categoryname: 'Cement & Concrete', itemname: 'OPC 53 Grade Cement', uomname: 'Bag', poqty: 550, receivedqty: 200, rate: 420, rowremarks: '' },
            { categoryname: 'Steel', itemname: 'TMT Bar 12mm', uomname: 'Kg', poqty: 1200, receivedqty: 500, rate: 68, rowremarks: 'Minor bend' }
        ]);
    }

    /** Map PO items to the table */
    private mapItemsFromPO(items: any[]): void {
        this.itemOptionslist = items.map(it => ({
            ...it,
            orderedqty:          it.poqty        || 0,
            previouslyreceived:  it.receivedqty  || 0,
            pendingqty:          (it.poqty || 0) - (it.receivedqty || 0),
            receivedqty:         null,
            acceptedqty:         null,
            rejectedqty:         null,
            qualityreport:       it.qualityreport || 'N',
            rate:                Number(it.rate || 0),
            rowremarks:          it.rowremarks || ''
        }));
    }

    // ── GRN No dropdown: load a saved GRN ─────────────────────────────────
    purchaseIdDetails(event: any): void {
        this.transationid = event.value;
        const selected = this.purchaseIdOptions.find(item => item.purchaseid == event.value);
        if (!selected) return;

        this.productForm.patchValue({
            p_vendorid:   selected.vendorid,
            p_grndate:    selected.invoicedate ? new Date(selected.invoicedate) : null,
            p_remarks:    selected.remark,
            grandTotal:   this.grandTotal.toFixed(2),
            p_amountpaid: (selected.total_paid || 0).toFixed(2)
        });

        this.poSelected     = true;
        this.addItemEnabled = true;
    }

    // ── File upload ────────────────────────────────────────────────────────
    onFileSelect(event: Event, type: 'challan' | 'material' | 'qualityreport' | 'other'): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        if (type === 'challan') {
            this.uploadedFiles.challan  = input.files[0];
            this.fileNames.challan      = input.files[0].name;
        } else if (type === 'material') {
            this.uploadedFiles.material = Array.from(input.files);
            this.fileNames.material     = `${input.files.length} file(s) selected`;
        } else if (type === 'qualityreport') {
            this.uploadedFiles.qualityreport = input.files[0];
            this.fileNames.qualityreport = input.files[0].name;
        } else {
            this.uploadedFiles.other    = Array.from(input.files);
            this.fileNames.other        = `${input.files.length} file(s) selected`;
        }
    }

    // ── Qty logic ──────────────────────────────────────────────────────────
    onReceivedQtyChange(product: any): void {
        const received = Number(product.receivedqty || 0);
        if (received > product.pendingqty) product.receivedqty = product.pendingqty;
        product.acceptedqty = product.receivedqty;
        product.rejectedqty = 0;
    }

    onAcceptedQtyChange(product: any): void {
        const received = Number(product.receivedqty || 0);
        const accepted = Number(product.acceptedqty || 0);
        if (accepted > received) product.acceptedqty = received;
        product.rejectedqty = received - Number(product.acceptedqty || 0);
    }

    calculateRowAmount(product: any): number {
        return Number(product.acceptedqty || 0) * Number(product.rate || 0);
    }

    // ── Grand total ────────────────────────────────────────────────────────
    get grandTotal(): number {
        if (!this.itemOptionslist.length) return 0;
        return this.itemOptionslist.reduce((sum, item) =>
            sum + (Number(item.quantity || 0) * Number(item.costprice || 0)), 0);
    }

    get totalPoQty(): number {
        return this.itemOptionslist.reduce((sum, item) => sum + (Number(item.orderedqty) || 0), 0);
    }

    get totalPreviouslyReceivedQty(): number {
        return this.itemOptionslist.reduce((sum, item) => sum + (Number(item.previouslyreceived) || 0), 0);
    }

    get totalPendingQty(): number {
        return this.itemOptionslist.reduce((sum, item) => sum + (Number(item.pendingqty) || 0), 0);
    }

    get totalReceivedQty(): number {
        return this.itemOptionslist.reduce((sum, item) => sum + (Number(item.receivedqty) || 0), 0);
    }

    get totalAcceptedQty(): number {
        if (!this.itemOptionslist.length) return 0;
        return this.itemOptionslist.reduce((sum, item) => sum + (Number(item.acceptedqty) || 0), 0);
    }

    get totalRejectedQty(): number {
        if (!this.itemOptionslist.length) return 0;
        return this.itemOptionslist.reduce((sum, item) => sum + (Number(item.rejectedqty) || 0), 0);
    }

    get totalAmount(): number {
        return this.itemOptionslist.reduce((sum, item) => sum + this.calculateRowAmount(item), 0);
    }

    get isQualityReportAttachmentRequired(): boolean {
        return this.itemOptionslist.some((item) => item.qualityreport === 'Y');
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    onSubmit(): void {
        this.productForm.markAllAsTouched();
        if (this.productForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary:  'Validation Failed',
                detail:   'Please fill all required fields across all tabs.',
                life:      3000
            });
            return;
        }

        if (this.isQualityReportAttachmentRequired && !this.uploadedFiles.qualityreport) {
            this.messageService.add({
                severity: 'error',
                summary: 'Quality Report Required',
                detail: 'Attach a quality report file when any item has Quality Report = Y.',
                life: 3000
            });
            return;
        }

        this.confirmationService.confirm({
            message:                'Do you want to save this GRN?',
            header:                 'Confirm',
            acceptLabel:            'Yes',
            rejectLabel:            'Cancel',
            rejectButtonStyleClass: 'p-button-secondary',
            accept:                 () => this.OnPurchesHeaderCreate(this.productForm.value)
        });
    }

    // ── API: create GRN header ─────────────────────────────────────────────
    OnPurchesHeaderCreate(data: any): void {
        const payload: any = {
            p_operationtype: 'PUR_INSERT',
            p_purchaseid:    data.p_tranpurchaseid ? String(data.p_tranpurchaseid) : '',
            p_vendorid:      data.p_vendorid ? String(data.p_vendorid) : '0',
            p_grndate:       this.datePipe.transform(data.p_grndate, 'dd/MM/yyyy'),
            p_podate:        this.datePipe.transform(data.p_podate,  'dd/MM/yyyy'),
            p_project:       data.p_project       || '',
            p_vendor:        data.p_vendor         || '',
            p_location: data.p_location  || '',
            p_worklocation:  data.p_worklocation   || '',
            p_totalpoamount: data.p_totalpoamount  || '',
            p_deliveryterms: data.p_deliveryterms  || '',
            p_paymentterms:  data.p_paymentterms   || '',
            p_poreference:   data.p_poreference    || '',
            p_contactperson: data.p_contactperson  || '',
            p_contactno:     data.p_contactno      || '',
            p_challanno:     data.p_challanno      || '',
            p_challandate:   this.datePipe.transform(data.p_challandate, 'dd/MM/yyyy'),
            p_vehicleno:     data.p_vehicleno      || '',
            p_drivername:    data.p_drivername     || '',
            p_drivermobile:  data.p_drivermobile   || '',
            p_indentno:      data.p_indentno       || '',
            p_remarks:       data.p_remarks        || '',
            p_amountpaid:    (data.p_amountpaid || 0).toFixed(2),
            p_active:        'Y'
        };

        this.stockInService.OnPurchesHeaderCreate(payload).subscribe({
            next: (res) => {
                this.transationid = res.data[0].tranpurchaseid;
                const id = Number(res.data[0].tranpurchaseid);
                if (!this.purchaseIdOptions.some(x => x.purchaseid === id)) {
                    this.purchaseIdOptions.push({
                        purchaseid: id, invoicedate: null,
                        invoicenumber: '', remark: '', vendorid: 0
                    });
                }
                this.productForm.patchValue({ p_tranpurchaseid: id });
                this.loadAllDropdowns();
                this.showSuccess('GRN saved successfully');
            },
            error: err => console.error(err)
        });
    }

    // ── Dropdowns ──────────────────────────────────────────────────────────
    private createDropdownPayload(returnType: string) {
        return { p_username: this.authService.isLogIntType().userid.toString(), p_returntype: returnType };
    }

    OnGetDropdown(): void {
        this.stockInService.getdropdowndetails({ p_username: this.authService.isLogIntType().userid.toString(), p_returntype: 'ITEM' }).subscribe({
            next:  res => { this.vendorNameOptions = res.data; },
            error: err => console.error(err)
        });
    }

    loadAllDropdowns(): void {
        this.OnGetItem(); this.OnGetCategory();
        this.OnGetUOM();  this.OnGetVendor();
        this.OnGetPurchaseId();
    }

    OnGetItem(): void {
        this.stockInService.getdropdowndetails(this.createDropdownPayload('ITEM')).subscribe({
            next: res => this.itemOptions = res.data, error: err => console.error(err)
        });
    }
    OnGetCategory(): void {
        this.stockInService.getdropdowndetails(this.createDropdownPayload('CATEGORY')).subscribe({
            next: res => this.categoryOptions = res.data, error: err => console.error(err)
        });
    }
    OnGetUOM(): void {
        this.stockInService.getdropdowndetails(this.createDropdownPayload('UOM')).subscribe({
            next: res => this.uomOptions = res.data, error: err => console.error(err)
        });
    }
    OnGetVendor(): void {
        this.stockInService.getdropdowndetails(this.createDropdownPayload('VENDOR')).subscribe({
            next: res => this.vendorOptions = res.data, error: err => console.error(err)
        });
    }
    OnGetPurchaseId(): void {
        this.stockInService.getdropdowndetails(this.createDropdownPayload('PURCHASEID')).subscribe({
            next: res => this.purchaseIdOptions = res.data, error: err => console.error(err)
        });
    }

    // ── Delete item ────────────────────────────────────────────────────────
    deleteItem(product: any): void {
        this.confirmationService.confirm({
            message:                `Are you sure you want to delete <b>${product.itemname}</b>?`,
            header:                 'Confirm Delete',
            icon:                   'pi pi-exclamation-triangle',
            acceptLabel:            'Yes',
            rejectLabel:            'No',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept:                 () => this.OnDeleteItem(product.purchasedetailid)
        });
    }

    OnDeleteItem(id: any): void {
        const payload = { p_username: this.authService.isLogIntType().userid.toString(), p_returntype: 'PURCHASEDETAIL', p_purchasedetailid: id };
        this.stockInService.DeletStockinitem(payload).subscribe({
            next: res => {
                this.showSuccess(res.data[0].msg);
                this.OnGetItem();
            }
        });
    }

    // ── Child UOM ──────────────────────────────────────────────────────────
    onChildUom(status: boolean): boolean {
        this.childUomStatus = status;
        return this.childUomStatus;
    }

    viewItem(id: number): void {
        const payload = { p_username: this.authService.isLogIntType().userid.toString(), p_returntype: 'CHILDUOM', p_returnvalue: id.toString() };
        this.stockInService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                if (!res.data?.length) return;
                this.childUOMList  = res.data;
                this.childUomDialog = true;
            },
            error: err => console.error(err)
        });
    }

    // ── Misc ───────────────────────────────────────────────────────────────
    onGetStockIn(): void {
        this.products = this.stockInService.productItem;
        this.products.forEach(p => (p.selection = true));
    }

    populateStockForm(data: any, itemsData: any[]): void {
        this.transationid = data.purchaseid;
        this.poSelected   = true;
        this.productForm.patchValue({
            p_tranpurchaseid: data.purchaseid   || 0,
            p_grndate:        data.invoicedate  ? new Date(data.invoicedate) : new Date(),
            p_remarks:        data.remark       || '',
            p_vendorid:       data.vendorid      || null,
            p_worklocation:   data.worklocation || '',
            p_totalpoamount:  data.total_po_amount || '',
            p_deliveryterms:  data.delivery_terms || '',
            p_paymentterms:   data.payment_terms || '',
            p_poreference:    data.po_reference || '',
            p_contactperson:  data.contact_person || '',
            p_contactno:      data.contact_no || '',
            p_amountpaid:     (data.total_paid  || 0).toFixed(2),
            grandTotal:       (data.total_cost  || 0).toFixed(2)
        });
        if (itemsData?.length) {
            this.itemOptionslist = itemsData.map(item => ({
                ...item,
                orderedqty:         item.orderedqty         || item.quantity || 0,
                previouslyreceived: item.previouslyreceived || 0,
                pendingqty:         item.pendingqty         || item.quantity || 0,
                receivedqty:        item.receivedqty        || 0,
                acceptedqty:        item.acceptedqty        || 0,
                rejectedqty:        item.rejectedqty        || 0,
                qualityreport:      item.qualityreport      || 'N',
                rate:               Number(item.rate || 0),
                rowremarks:         item.rowremarks || item.remarks || ''
            }));
        }
    }

    reset(): void {
        this.productForm.reset(
            {p_grndate:this.dateTime}
        );
        this.products        = [];
        this.itemOptionslist = [];
        this.poSelected      = false;
        this.addItemEnabled  = false;
        this.backshow        = false;
        this.fileNames       = { challan: '', material: '', qualityreport: '', other: '' };
        this.uploadedFiles   = { challan: null, material: null, qualityreport: null, other: null };
    }

    back(): void {
        this.route.navigate(['/layout/inventory/transaction']);
    }

    setupBackButtonListener(): void {
        window.addEventListener('beforeunload', () => this.sharedService.clearTransactionState());
    }

    ngOnDestroy(): void {
        window.removeEventListener('beforeunload', () => {});
    }

    allowOnlyNumbers(event: any): void {
        const input = event.target as HTMLInputElement;
        if (input.value.length >= 10) { event.preventDefault(); return; }
        if (!/^[0-9]$/.test(String.fromCharCode(event.which))) event.preventDefault();
    }

    showSuccess(message: string): void {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }
}