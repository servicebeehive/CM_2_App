import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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

import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { ShareService } from '@/core/services/shared.service';
import { WorkService } from '@/core/services/work.service';
import { GrnDelivery, GrnDocumentItem, GrnDocuments, GrnHeader, GrnItem, GrnRemarks } from '@/core/models/authmodel/work.model';

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
export class GrnComponent implements OnInit, OnDestroy {
    grnForm!: FormGroup;
    poSelected = false;
    public transationid: any;
    backshow = false;
    dateTime = new Date();
    userId = '';
    
    fileNames: { challan: string; material: string; qualityreport: string; other: string } = {
        challan: '', material: '', qualityreport: '', other: ''
    };

    // Now stores base64-encoded strings instead of raw File objects
    uploadedFiles: {
        challan: string | null;
        material: string[] | null;
        qualityreport: string | null;
        other: string[] | null;
    } = { challan: null, material: null, qualityreport: null, other: null };

    qualityReportOptions: { label: string; value: string }[] = [
        { label: 'Y', value: 'Y' },
        { label: 'N', value: 'N' },
        { label: 'P', value: 'P' }
    ];

    itemOptionslist: any[] = [];
    ponoOptions: any[] = [];
    grnOptions: any[] = [];
    indentNoOptions: any[] = [];

    // Bound reference so it can be removed correctly in ngOnDestroy
    private readonly beforeUnloadHandler = () => this.sharedService.clearTransactionState();

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        public datePipe: DatePipe,
        private messageService: MessageService,
        private sharedService: ShareService,
        private route: Router,
        private authService: AuthService,
        private inventoryService: InventoryService,
        private workService: WorkService
    ) {}

    // ── Lifecycle ──────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.initForm();
        this.onGetPONO();
        this.onGetGRN();
        this.userId = this.authService.isLogIntType().username;
        const navigation = history.state;
        if (navigation?.stockData && navigation?.itemsData) {
            this.backshow = true;
            this.populateStockForm(navigation.stockData, navigation.itemsData);
        }

        this.setupBackButtonListener();
    }

    ngOnDestroy(): void {
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }

    // ── Form initialisation ────────────────────────────────────────────────
    private initForm(): void {
        this.grnForm = this.fb.group({
            // Top 3 (always visible)
            p_grn_id: [null],
            p_grndate: [this.dateTime, Validators.required],
            p_pono: [null, Validators.required], // PO Number
            status: [''],
            // Tab 1: Purchase Order
            p_podate: [null],
            p_project: [{value: '', disabled: true}, Validators.required],
            p_project_id: [null],
            p_vendor: [{value: null, disabled: true}, Validators.required],
            p_vendor_id: [null],
            p_location: [{value: null, disabled: true}, Validators.required],
            p_worklocation: [''],
            p_deliveryterms: [''],
            p_poreference: [''],
            p_contactperson: [{value: '', disabled: true}],
            p_contactno: [{value: '', disabled: true}],

            // Tab 2: Delivery
            p_challanno: ['', Validators.required],
            p_challandate: [null, Validators.required],
            p_vehicleno: [''],
            p_drivername: [''],
            p_drivermobile: ['', Validators.pattern(/^[6-9]\d{9}$/)],

            // Tab 3: Remarks
            p_received_by: [{value: this.authService.isLogIntType().fullname, disabled: true}, Validators.required],
            p_remarks: ['', Validators.maxLength(500)],

            // Internal
            grandTotal: [0],
            p_amountpaid: [0]
        });
    }

    get statusColor(): string {
        const status = (this.grnForm.get('status')?.value || '').toUpperCase();
        switch (status) {
            case 'APPROVED':
                return 'green';
            case 'SUBMITTED':
                return 'blue';
            case 'REJECTED':
                return 'red';
            case 'DRAFT':
                return 'grey';
            case 'SENDBACK':
                return 'orange';
            case 'APPROVAL PENDING':
                return 'orange';
            case 'FULLY_RECEIVED':
                return 'green';
            default:
                return 'grey';
        }
    }

    onGetGRN(){
        const payload = {
            p_returntype: 'GRNLIST',
            p_username: this.authService.isLogIntType().companyid.toString()
        }
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                this.grnOptions = res.data;
            },
            error: (error) => {
                console.error(error);
            }
        });
    }

    // ── GRN No dropdown: load a saved GRN ─────────────────────────────────
    onGRNChange(event: any): void {
        this.transationid = event.value;
        const grnValue = this.grnOptions.find((g: any) => g.grn_id === event.value)?.grn_no;
         const payload = {
          p_returntype: 'GRNDETAILS',
          p_returnvalue: grnValue,
          p_username: this.authService.isLogIntType().companyid.toString()
         }
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
               const rows: any[] = res.data ?? [];
            if (!rows.length) return;
            this.applyGrnDetailsToForm(rows);
            },
            error: (error) => {
                console.error(error);
            }
        })
        this.poSelected = true;
    }

  private applyGrnDetailsToForm(rows: any[]): void {
    const header = rows[0];
    this.poSelected = true;
    this.transationid = header.grn_id;

    this.grnForm.patchValue({
        p_grn_id: header.grn_id,
        p_grndate: header.grn_date ? new Date(header.grn_date) : null,
        p_pono: header.po_id,
        p_podate: header.po_date ? new Date(header.po_date) : null,
        p_project: header.project_name ?? '',
        p_project_id: header.project_id ?? null,
        p_vendor: header.suppliername ?? '',
        p_vendor_id: header.vendor_id ?? header.supplier_id ?? null,
        // p_location: header.delivery_location ?? '',
        p_location: header.location ?? '',                        
        p_contactperson: header.companycontactperson ?? '',         
        p_contactno: header.companycontactphone ?? '',     
        status: header.status ?? ''
    });

    // ── Patch Delivery tab fields from the first saved delivery entry ──────
    const delivery = header.delivery?.[0];
    if (delivery) {
        this.grnForm.patchValue({
            p_challanno: delivery.delivery_challan_no ?? '',
            p_challandate: delivery.delivery_challan_date ? new Date(delivery.delivery_challan_date) : null,
            p_vehicleno: delivery.vehicle_number ?? '',
            p_drivername: delivery.driver_name ?? '',
            p_drivermobile: delivery.driver_mobile ?? ''
        });
    }

    // ── Patch Remarks tab fields from the first saved remarks entry ────────
    const remark = header.remarks?.[0];
    if (remark) {
        this.grnForm.patchValue({
            p_received_by: remark.received_by ?? null,
            p_remarks: remark.remarks ?? ''
        });
    }

    // ── Patch Documents tab display names from saved documents ─────────────
    const documents: any[] = header.documents ?? [];
    if (documents.length) {
        const findDoc = (type: string) => documents.find((d) => d.document_type === type);

        const challanDoc = findDoc('DELIVERY_CHALLAN');
        const qualityDoc = findDoc('QUALITY_REPORT');
        const materialDocs = documents.filter((d) => d.document_type === 'MATERIAL_PHOTO');
        const otherDocs = documents.filter((d) => d.document_type === 'OTHER');

        this.fileNames = {
            challan: challanDoc?.document_name ?? '',
            qualityreport: qualityDoc?.document_name ?? '',
            material: materialDocs.length ? `${materialDocs.length} file(s) selected` : '',
            other: otherDocs.length ? `${otherDocs.length} file(s) selected` : ''
        };

        this.uploadedFiles = {
            challan: challanDoc?.document_path ?? null,
            qualityreport: qualityDoc?.document_path ?? null,
            material: materialDocs.length ? materialDocs.map((d) => d.document_path) : null,
            other: otherDocs.length ? otherDocs.map((d) => d.document_path) : null
        };
    } else {
        this.fileNames = { challan: '', material: '', qualityreport: '', other: '' };
        this.uploadedFiles = { challan: null, material: null, qualityreport: null, other: null };
    }

    // Re-fetch the full PO item list so we have ordered/pending qty context,
    // then overlay the saved GRN line-item quantities onto the matching rows.
    const poPayload = {
        p_returntype: 'PODETAILS',
        p_returnvalue: header.po_no,
        p_username: this.authService.isLogIntType().companyid.toString()
    };
    this.inventoryService.Getreturndropdowndetails(poPayload).subscribe({
        next: (poRes: any) => {
            this.mapItemsFromPODetails(poRes.data ?? []);
            this.overlayGrnItemQuantities(rows);
        },
        error: (err) => console.error('Error fetching PO details for GRN:', err)
    });
}

private overlayGrnItemQuantities(grnRows: any[]): void {
    const byPoDetail = new Map<number, any>();
    grnRows.forEach((r) => {
        if (r.po_detail_id != null) byPoDetail.set(r.po_detail_id, r);
    });

    this.itemOptionslist = this.itemOptionslist.map((item) => {
        const g = byPoDetail.get(item.purchasedetailid);
        if (!g) return item;

        return {
            ...item,
            grndetailid: g.grn_detail_id ?? null,
            itemid: g.item_id ?? item.itemid,
            uomid: g.uom_id ?? item.uomid,
            receivedqty: g.received_qty ?? item.receivedqty,
            acceptedqty: g.accepted_qty ?? item.acceptedqty,
            rejectedqty: g.rejected_qty ?? item.rejectedqty,
            qualityreport: g.quality ?? item.qualityreport,
            rowremarks: g.detail_remarks ?? item.rowremarks,
            batchno: g.batch_no ?? item.batchno ?? '',
            batchdate: g.batch_date ? new Date(g.batch_date) : item.batchdate,
            expirydate: g.expiry_date ? new Date(g.expiry_date) : item.expirydate
        };
    });
}
    // ── File preview (opens the base64 file in a new tab) ──────────────────
    previewFile(base64: string | null): void {
        if (!base64) {
            this.messageService.add({ severity: 'info', summary: 'No File', detail: 'No file selected to preview.', life: 2000 });
            return;
        }
        window.open(base64, '_blank');
    }

    // ── File upload (converts every file to base64) ────────────────────────
    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    async onFileSelect(event: Event, type: 'challan' | 'material' | 'qualityreport' | 'other'): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        try {
            if (type === 'challan') {
                const base64 = await this.fileToBase64(input.files[0]);
                this.uploadedFiles.challan = base64;
                this.fileNames.challan = input.files[0].name;
            } else if (type === 'qualityreport') {
                const base64 = await this.fileToBase64(input.files[0]);
                this.uploadedFiles.qualityreport = base64;
                this.fileNames.qualityreport = input.files[0].name;
            } else if (type === 'material') {
                const files = Array.from(input.files);
                this.uploadedFiles.material = await Promise.all(files.map(f => this.fileToBase64(f)));
                this.fileNames.material = `${files.length} file(s) selected`;
            } else {
                const files = Array.from(input.files);
                this.uploadedFiles.other = await Promise.all(files.map(f => this.fileToBase64(f)));
                this.fileNames.other = `${files.length} file(s) selected`;
            }
        } catch (err) {
            console.error('File conversion failed:', err);
            this.messageService.add({
                severity: 'error',
                summary: 'Upload Failed',
                detail: 'Could not read the selected file(s).',
                life: 3000
            });
        }
    }

    // ── Qty logic ──────────────────────────────────────────────────────────
    onReceivedQtyChange(product: any): void {
        const received = Number(product.receivedqty || 0);
        if (received > product.pendingqty) product.receivedqty = product.pendingqty;
        product.rejectedqty = 0;
    }

    onAcceptedQtyChange(product: any): void {
        const received = Number(product.receivedqty || 0);
        if (product.acceptedqty === null || product.acceptedqty === undefined) {
        product.rejectedqty = 0;
        return;
    }

    const accepted = Number(product.acceptedqty);
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

    get isHeaderReady(): boolean {
    const receivedQtyValid =
        this.itemOptionslist.length > 0 &&
        this.itemOptionslist.every(
            item =>
                item.receivedqty !== null &&
                item.receivedqty !== undefined &&
                Number(item.receivedqty) > 0
        );

    return (
        this.poSelected &&
        this.grnForm.get('p_grndate')?.valid === true &&
        this.grnForm.get('p_pono')?.valid === true &&
        !!this.grnForm.get('p_project')?.value &&
        !!this.grnForm.get('p_vendor')?.value &&
        !!this.grnForm.get('p_location')?.value &&
        receivedQtyValid
    );
}

get isDeliveryReady(): boolean {
    return (
        !!this.grnForm.get('p_challanno')?.value &&
        !!this.grnForm.get('p_challandate')?.value &&
        this.grnForm.get('p_drivermobile')?.valid === true
    );
}

get isRemarksReady(): boolean {
    return !!this.grnForm.get('p_received_by')?.value;
}

get isDocumentsReady(): boolean {
    const challanOk = !!this.uploadedFiles.challan;
    const materialOk = !!(this.uploadedFiles.material && this.uploadedFiles.material.length);
    const qualityOk = !this.isQualityReportAttachmentRequired || !!this.uploadedFiles.qualityreport;
    return challanOk && materialOk && qualityOk;
}

    // ── Submit ─────────────────────────────────────────────────────────────
    onSubmit(): void {
        this.grnForm.markAllAsTouched();
    
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
            message: 'Do you want to save this GRN?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => this.submitGrnHeader(this.grnForm.value)
        });
    }

    submitGrnHeader(value: any): void {
        const isUpdate = !!this.transationid;
        const payload:GrnHeader= {
            p_grn_id: isUpdate ? this.transationid : 0,
            p_grn_date: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || this.datePipe.transform(this.grnForm.get('p_grndate')?.value, 'yyyy-MM-dd') || '2026-08-28',
            p_po_id: value.p_pono,
            p_po_date: this.datePipe.transform(value.p_podate, 'yyyy-MM-dd') || '',
            p_company_id: this.authService.isLogIntType().companyid,
            p_project_id: value.p_project_id,
            p_vendor_id: value.p_vendor_id,
            p_status: isUpdate ? 'UPDATE' : 'SUBMIT',
            p_items_json: this.buildItemsJson(),
            p_loginuser: this.authService.isLogIntType().userid,
        };

        this.workService.upsertGrn(payload).subscribe({
            next: (res) => {
                if(res.data.success){
                this.messageService.add({
                    severity: 'success',
                    summary: res.data.msg
                });
                this.grnForm.patchValue({
                    p_grn_id: res.data.grn_id,
                    status: res.data.tran_status
                });
                this.transationid = res.data.grn_id;
               this.onGetGRN();
            }
        else{
            this.messageService.add({
                severity: 'error',
                summary:res.data.msg
            });
        }
    },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Submit Failed',
                    detail: 'Unable to submit GRN header.',
                    life: 3000
                });
            }
        });
    }

 private buildItemsJson(): GrnItem[] {
    return this.itemOptionslist.map((item) => {
        const receivedQty = item.receivedqty != null ? Number(item.receivedqty) : 0;
        const hasAcceptedQty = item.acceptedqty !== null && item.acceptedqty !== undefined && item.acceptedqty !== '';
        const acceptedQty = hasAcceptedQty ? Number(item.acceptedqty) : receivedQty;

        return {
            po_detail_id: item.purchasedetailid,
            item_id: item.itemid,
            uom_id: item.uomid,
            received_qty: receivedQty,
            accepted_qty: acceptedQty,
            rejected_qty: item.rejectedqty != null ? Number(item.rejectedqty) : 0,
            rate: Number(item.rate) || 0,
            batch_no: item.batchno ?? '',
            batch_date: item.batchdate
                ? (this.datePipe.transform(item.batchdate, 'yyyy-MM-dd HH:mm:ss') ?? '')
                : '',
            expiry_date: item.expirydate
                ? this.datePipe.transform(item.expirydate, 'yyyy-MM-dd HH:mm:ss')
                : null,
            quality: item.qualityreport ?? 'N',
            remarks: item.rowremarks ?? ''
        };
    });
}

    onGetPONO(): void {
        const payload = {
            p_returntype: 'PONO',
            p_returnvalue: this.authService.isLogIntType().companyid.toString(),
            p_username: this.authService.isLogIntType().userid.toString()
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: res => {
                this.ponoOptions = res.data;
            }
        });
    }

    onPOChange(event: any): void {
        const poId = event.value;
        if (!poId) {
            this.poSelected = false;
            this.itemOptionslist = [];
            return;
        }

        const po = this.ponoOptions.find((p) => p['po_id'] === poId);
        if (!po) return;

        const payload = {
            p_returntype: 'PODETAILS',
            p_returnvalue: po['po_no'],
            p_username: this.authService.isLogIntType().companyid.toString()
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => this.applyPODetailsToForm(res.data ?? []),
            error: (err: any) => {
                console.error('Error fetching PO details:', err);
                this.messageService.add({ severity: 'error', summary: 'Failed to load PO details', life: 2500 });
            }
        });
    }

    private applyPODetailsToForm(rows: any[]): void {
        if (!rows.length) {
            this.poSelected = false;
            this.itemOptionslist = [];
            return;
        }

        const header = rows[0];

        this.grnForm.patchValue({
            p_podate: header.po_date ? new Date(header.po_date) : null,
            p_project: header.project_name ?? '',
            p_project_id: header.project_id ?? null,
            p_vendor: header.suppliername ?? null,
             p_vendor_id: header.vendor_id ?? header.supplier_id ?? null,
            p_location: header.delivery_location ?? '',
            p_contactperson: header.suppliercontactperson ?? '',
            p_contactno: header.suppliercontactphone ?? ''
        });

        this.mapItemsFromPODetails(rows);

        this.poSelected = true;
    }

    private mapItemsFromPODetails(rows: any[]): void {
        this.itemOptionslist = rows.map((row) => {
            const orderedqty = Number(row.po_qty || 0);
            const previouslyreceived = 0; // not returned by PODETAILS — swap in a real field if your API has one
            const pendingqty = orderedqty - previouslyreceived;

            return {
                purchasedetailid: row.po_detail_id,
                itemid: row.item_id ?? null,
                uomid: row.uom_id ?? null,
                categoryname: row.category_name ?? row.item_category_id ?? '',
                itemname: row.item_name ?? row.item_id ?? '',
                uomname: row.uom_name ?? row.uom_id ?? '',
                orderedqty,
                previouslyreceived,
                pendingqty,
                receivedqty: null,
                acceptedqty: null,
                rejectedqty: null,
                qualityreport: 'N',
                rate: Number(row.rate || 0),
                rowremarks: row.detail_remarks ?? '',
                  grndetailid: null,                   
            batchno: '',
            batchdate: null as Date | null,
            expirydate: null as Date | null
            };
        });
    }

    // ── Delivery tab: submit / reset ─────────────────────────────────────
    submitDelivery(): void {
        ['p_challanno', 'p_challandate', 'p_vehicleno', 'p_drivername', 'p_drivermobile']
            .forEach(c => this.grnForm.get(c)?.markAsTouched());

        if (
            this.grnForm.get('p_challanno')?.invalid ||
            this.grnForm.get('p_challandate')?.invalid ||
            this.grnForm.get('p_drivermobile')?.invalid
        ) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Failed',
                detail: 'Please fill all required delivery fields.',
                life: 3000
            });
            return;
        }

        const payload: GrnDelivery = {
            p_operation: 'INSERT',
            p_delivery_id: null,
            p_grn_id: this.transationid ?? null,
            p_po_id: this.grnForm.get('p_pono')?.value ?? null,
            p_challan_no: this.grnForm.get('p_challanno')?.value ?? '',
            p_challan_date: this.datePipe.transform(this.grnForm.get('p_challandate')?.value, 'yyyy-MM-dd') ?? '',
            p_vehicle_no: this.grnForm.get('p_vehicleno')?.value ?? '',
            p_driver_name: this.grnForm.get('p_drivername')?.value ?? '',
            p_driver_mobile: this.grnForm.get('p_drivermobile')?.value ?? '',
            p_remarks: '',
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertGrnDelivery(payload).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success', summary: res.data.msg
                });
            },
            error: (err) => {
                console.error('Delivery submit failed:', err);
                this.messageService.add({
                    severity: 'error', summary: 'Submit Failed', detail: 'Unable to submit delivery details.', life: 3000
                });
            }
        });
    }

    resetDelivery(): void {
        this.grnForm.patchValue({
            p_challanno: '',
            p_challandate: null,
            p_vehicleno: '',
            p_drivername: '',
            p_drivermobile: ''
        });
        ['p_challanno', 'p_challandate', 'p_vehicleno', 'p_drivername', 'p_drivermobile']
            .forEach(c => this.grnForm.get(c)?.markAsUntouched());
    }

    // ── Remarks tab: submit / reset ──────────────────────────────────────
    submitRemarks(): void {
        this.grnForm.get('p_received_by')?.markAsTouched();

        if (this.grnForm.get('p_received_by')?.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Failed',
                detail: 'Received By is required.',
                life: 3000
            });
            return;
        }

        const payload: GrnRemarks = {
            p_operation: 'INSERT',
            p_grn_remark_id: 0,
            p_grn_id: this.transationid ?? null,
            p_po_id: this.grnForm.get('p_pono')?.value ?? null,
            p_received_by: this.grnForm.get('p_received_by')?.value ?? null,
            p_remarks: this.grnForm.get('p_remarks')?.value ?? '',
            p_loginuser: this.userId.toString()
        };

        this.workService.upsertGrnRemarks(payload).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success', summary: res.data.msg
                });
            },
            error: (err) => {
                console.error('Remarks submit failed:', err);
                this.messageService.add({
                    severity: 'error', summary: 'Submit Failed', detail: 'Unable to submit remarks.', life: 3000
                });
            }
        });
    }

    resetRemarks(): void {
        this.grnForm.patchValue({ p_received_by: null, p_remarks: '' });
        this.grnForm.get('p_received_by')?.markAsUntouched();
    }

    // ── Documents tab: submit / reset ────────────────────────────────────
    submitDocuments(): void {
        if (this.isQualityReportAttachmentRequired && !this.uploadedFiles.qualityreport) {
            this.messageService.add({
                severity: 'error',
                summary: 'Quality Report Required',
                detail: 'Attach a quality report file when any item has Quality Report = Y.',
                life: 3000
            });
            return;
        }

        const documents: GrnDocumentItem[] = [];

        if (this.uploadedFiles.challan) {
            documents.push({
                document_type: 'DELIVERY_CHALLAN',
                document_name: this.fileNames.challan,
                document_path: this.uploadedFiles.challan
            });
        }
        if (this.uploadedFiles.material?.length) {
            this.uploadedFiles.material.forEach((base64, i) => documents.push({
                document_type: 'MATERIAL_PHOTO',
                document_name: `material-photo-${i + 1}`,
                document_path: base64
            }));
        }
        if (this.uploadedFiles.qualityreport) {
            documents.push({
                document_type: 'QUALITY_REPORT',
                document_name: this.fileNames.qualityreport,
                document_path: this.uploadedFiles.qualityreport
            });
        }
        if (this.uploadedFiles.other?.length) {
            this.uploadedFiles.other.forEach((base64, i) => documents.push({
                document_type: 'OTHER',
                document_name: `other-doc-${i + 1}`,
                document_path: base64
            }));
        }

        if (!documents.length) {
            this.messageService.add({
                severity: 'error',
                summary: 'No Documents',
                detail: 'Please upload at least one document.',
                life: 3000
            });
            return;
        }

        const payload: GrnDocuments = {
            p_operation: 'SAVE',
            p_document_id: 0,
            p_grn_id: this.transationid ?? null,
            p_po_id: this.grnForm.get('p_pono')?.value ?? null,
            p_documents: documents,
            p_loginuser: this.userId.toString()
        };

        this.workService.upsertGrnDocuments(payload).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success', summary: res.data.msg
                });
            },
            error: (err) => {
                console.error('Documents submit failed:', err);
                this.messageService.add({
                    severity: 'error', summary: 'Submit Failed', detail: 'Unable to submit documents.', life: 3000
                });
            }
        });
    }

    resetDocuments(): void {
        this.fileNames = { challan: '', material: '', qualityreport: '', other: '' };
        this.uploadedFiles = { challan: null, material: null, qualityreport: null, other: null };
    }

    // ── Delete item ────────────────────────────────────────────────────────
    deleteItem(product: any): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete <b>${product.itemname}</b>?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => this.OnDeleteItem(product.purchasedetailid)
        });
    }

    OnDeleteItem(id: any): void {

    }

    // ── Misc ───────────────────────────────────────────────────────────────
    populateStockForm(data: any, itemsData: any[]): void {
        this.transationid = data.purchaseid;
        this.poSelected = true;
        this.grnForm.patchValue({
            p_grn_id: data.purchaseid || 0,
            p_grndate: data.invoicedate ? new Date(data.invoicedate) : new Date(),
            p_remarks: data.remark || '',
            p_pono: data.vendorid || null,
            p_worklocation: data.worklocation || '',
            p_deliveryterms: data.delivery_terms || '',
            p_poreference: data.po_reference || '',
            p_contactperson: data.contact_person || '',
            p_contactno: data.contact_no || '',
            p_amountpaid: (data.total_paid || 0).toFixed(2),
            grandTotal: (data.total_cost || 0).toFixed(2)
        });
        if (itemsData?.length) {
            this.itemOptionslist = itemsData.map(item => ({
                ...item,
                orderedqty: item.orderedqty || item.quantity || 0,
                previouslyreceived: item.previouslyreceived || 0,
                pendingqty: item.pendingqty || item.quantity || 0,
                receivedqty: item.receivedqty || 0,
                acceptedqty: item.acceptedqty || 0,
                rejectedqty: item.rejectedqty || 0,
                qualityreport: item.qualityreport || 'N',
                rate: Number(item.rate || 0),
                rowremarks: item.rowremarks || item.remarks || ''
            }));
        }
    }

    reset(): void {
        this.grnForm.reset(
            { p_grndate: this.dateTime }
        );
        this.itemOptionslist = [];
        this.poSelected = false;
        this.backshow = false;
        this.fileNames = { challan: '', material: '', qualityreport: '', other: '' };
        this.uploadedFiles = { challan: null, material: null, qualityreport: null, other: null };
    }

    back(): void {
        this.route.navigate(['/layout/inventory/transaction']);
    }

    setupBackButtonListener(): void {
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }

    allowOnlyNumbers(event: any): void {
        const input = event.target as HTMLInputElement;
        if (input.value.length >= 10) { event.preventDefault(); return; }
        if (!/^[0-9]$/.test(String.fromCharCode(event.which))) event.preventDefault();
    }
}