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
import { GrnDelivery, GrnDocumentItem, GrnDocuments, GrnHeader, GrnRemarks } from '@/core/models/authmodel/work.model';

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
    productForm!: FormGroup;
    poSelected = false;
    public transationid: any;
    backshow = false;
    dateTime = new Date();

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
    purchaseIdOptions: any[] = [];
    indentNoOptions: any[] = [];

    // Rows shown in the "saved entries" table under each tab
    deliveryList: { challanno: string; challandate: string; vehicleno: string; drivername: string; drivermobile: string }[] = [];
    remarksList: { receivedby: any; remarks: string }[] = [];
    documentsList: { type: string; name: string; path: string }[] = [];

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
        this.productForm = this.fb.group({
            // Top 3 (always visible)
            p_tranpurchaseid: [null],
            p_grndate: [this.dateTime, Validators.required],
            p_poid: [null, Validators.required], // PO Number

            // Tab 1: Purchase Order
            p_podate: [null],
            p_project: ['', Validators.required],
            p_vendor: [null, Validators.required],
            p_location: [null, Validators.required],
            p_worklocation: [''],
            p_deliveryterms: [''],
            p_poreference: [''],
            p_contactperson: [''],
            p_contactno: [''],

            // Tab 2: Delivery
            p_challanno: ['', Validators.required],
            p_challandate: [null, Validators.required],
            p_vehicleno: [''],
            p_drivername: [''],
            p_drivermobile: ['', Validators.pattern(/^[6-9]\d{9}$/)],

            // Tab 3: Remarks
            p_indentno: [null, Validators.required],
            p_remarks: ['', Validators.maxLength(500)],

            // Internal
            grandTotal: [0],
            p_amountpaid: [0]
        });
    }

    // ── GRN No dropdown: load a saved GRN ─────────────────────────────────
    purchaseIdDetails(event: any): void {
        this.transationid = event.value;
        const selected = this.purchaseIdOptions.find(item => item.purchaseid == event.value);
        if (!selected) return;

        this.productForm.patchValue({
            p_poid: selected.vendorid,
            p_grndate: selected.invoicedate ? new Date(selected.invoicedate) : null,
            p_remarks: selected.remark,
            grandTotal: this.grandTotal.toFixed(2),
            p_amountpaid: (selected.total_paid || 0).toFixed(2)
        });

        this.poSelected = true;
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

    get isHeaderReady(): boolean {
        return this.poSelected && ['p_grndate', 'p_poid', 'p_project', 'p_vendor', 'p_location']
            .every(controlName => this.productForm.get(controlName)?.valid);
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    onSubmit(): void {
        this.productForm.markAllAsTouched();
        // if (this.productForm.invalid) {
        //     this.messageService.add({
        //         severity: 'error',
        //         summary: 'Validation Failed',
        //         detail: 'Please fill all required fields across all tabs.',
        //         life: 3000
        //     });
        //     return;
        // }

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
            accept: () => this.submitGrnHeader(this.productForm.value)
        });
    }

    submitGrnHeader(value: any): void {
        console.log('Submitting GRN header with value:', value);
        const payload:GrnHeader= {
            p_operation: 'INSERT',
            p_grn_id: 0,
            p_grn_date: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || this.datePipe.transform(this.productForm.get('p_grndate')?.value, 'yyyy-MM-dd') || '2026-08-28',
            p_po_id: value.p_poid,
            p_po_date: this.datePipe.transform(value.p_podate, 'yyyy-MM-dd') || '',
            p_company_id: this.authService.isLogIntType().companyid,
            p_project_id: value.p_project_id,
            p_vendor_id: value.p_vendor_id,
            p_status: 'SUBMIT',
            p_loginuser: 1,
        };

        this.workService.upsertGrnHeader(payload).subscribe({
            next: (res) => {
                console.log('GRN header created:', res);
                this.messageService.add({
                    severity: 'success',
                    summary: 'GRN Header Saved',
                    detail: 'GRN header submitted successfully.',
                    life: 3000
                });
            },
            error: (err) => {
                console.error('GRN header submit failed:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Submit Failed',
                    detail: 'Unable to submit GRN header.',
                    life: 3000
                });
            }
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

        this.productForm.patchValue({
            p_podate: header.po_date ? new Date(header.po_date) : null,
            p_project: header.project_name ?? '',
            p_vendor: header.suppliername ?? null,
            p_location: header.delivery_location ?? ''
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
                rowremarks: row.detail_remarks ?? ''
            };
        });
    }

    // ── Delivery tab: submit / reset ─────────────────────────────────────
    submitDelivery(): void {
        ['p_challanno', 'p_challandate', 'p_vehicleno', 'p_drivername', 'p_drivermobile']
            .forEach(c => this.productForm.get(c)?.markAsTouched());

        if (
            this.productForm.get('p_challanno')?.invalid ||
            this.productForm.get('p_challandate')?.invalid ||
            this.productForm.get('p_drivermobile')?.invalid
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
            p_po_id: this.productForm.get('p_poid')?.value ?? null,
            p_challan_no: this.productForm.get('p_challanno')?.value ?? '',
            p_challan_date: this.datePipe.transform(this.productForm.get('p_challandate')?.value, 'yyyy-MM-dd') ?? '',
            p_vehicle_no: this.productForm.get('p_vehicleno')?.value ?? '',
            p_driver_name: this.productForm.get('p_drivername')?.value ?? '',
            p_driver_mobile: this.productForm.get('p_drivermobile')?.value ?? '',
            p_remarks: '',
            p_loginuser: 1
        };

        this.workService.upsertGrnDelivery(payload).subscribe({
            next: () => {
                this.deliveryList.push({
                    challanno: payload.p_challan_no,
                    challandate: payload.p_challan_date,
                    vehicleno: payload.p_vehicle_no,
                    drivername: payload.p_driver_name,
                    drivermobile: payload.p_driver_mobile
                });
                this.messageService.add({
                    severity: 'success', summary: 'Delivery Saved', detail: 'Delivery details submitted successfully.', life: 3000
                });
                this.resetDelivery();
            },
            error: (err) => {
                console.error('Delivery submit failed:', err);
                this.messageService.add({
                    severity: 'error', summary: 'Submit Failed', detail: 'Unable to submit delivery details.', life: 3000
                });
            }
        });
    }

    removeDeliveryRow(index: number): void {
        this.deliveryList.splice(index, 1);
    }

    resetDelivery(): void {
        this.productForm.patchValue({
            p_challanno: '',
            p_challandate: null,
            p_vehicleno: '',
            p_drivername: '',
            p_drivermobile: ''
        });
        ['p_challanno', 'p_challandate', 'p_vehicleno', 'p_drivername', 'p_drivermobile']
            .forEach(c => this.productForm.get(c)?.markAsUntouched());
    }

    // ── Remarks tab: submit / reset ──────────────────────────────────────
    submitRemarks(): void {
        this.productForm.get('p_indentno')?.markAsTouched();

        if (this.productForm.get('p_indentno')?.invalid) {
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
            p_grn_remark_id: null,
            p_grn_id: this.transationid ?? null,
            p_po_id: this.productForm.get('p_poid')?.value ?? null,
            p_received_by: this.productForm.get('p_indentno')?.value ?? null,
            p_remarks: this.productForm.get('p_remarks')?.value ?? '',
            p_loginuser: 1
        };

        this.workService.upsertGrnRemarks(payload).subscribe({
            next: () => {
                this.remarksList.push({
                    receivedby: payload.p_received_by,
                    remarks: payload.p_remarks
                });
                this.messageService.add({
                    severity: 'success', summary: 'Remarks Saved', detail: 'Remarks submitted successfully.', life: 3000
                });
                this.resetRemarks();
            },
            error: (err) => {
                console.error('Remarks submit failed:', err);
                this.messageService.add({
                    severity: 'error', summary: 'Submit Failed', detail: 'Unable to submit remarks.', life: 3000
                });
            }
        });
    }

    removeRemarksRow(index: number): void {
        this.remarksList.splice(index, 1);
    }

    resetRemarks(): void {
        this.productForm.patchValue({ p_indentno: null, p_remarks: '' });
        this.productForm.get('p_indentno')?.markAsUntouched();
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
            p_document_id: null,
            p_grn_id: this.transationid ?? null,
            p_po_id: this.productForm.get('p_poid')?.value ?? null,
            p_documents: documents,
            p_loginuser: 1
        };

        this.workService.upsertGrnDocuments(payload).subscribe({
            next: () => {
                documents.forEach(doc => this.documentsList.push({
                    type: doc.document_type,
                    name: doc.document_name,
                    path: doc.document_path
                }));
                this.messageService.add({
                    severity: 'success', summary: 'Documents Saved', detail: 'Documents submitted successfully.', life: 3000
                });
                this.resetDocuments();
            },
            error: (err) => {
                console.error('Documents submit failed:', err);
                this.messageService.add({
                    severity: 'error', summary: 'Submit Failed', detail: 'Unable to submit documents.', life: 3000
                });
            }
        });
    }

    removeDocumentRow(index: number): void {
        this.documentsList.splice(index, 1);
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
        this.productForm.patchValue({
            p_tranpurchaseid: data.purchaseid || 0,
            p_grndate: data.invoicedate ? new Date(data.invoicedate) : new Date(),
            p_remarks: data.remark || '',
            p_poid: data.vendorid || null,
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
        this.productForm.reset(
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