import { Component, OnInit } from '@angular/core';
import { WorkService } from '@/core/services/work.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DatePicker } from 'primeng/datepicker';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';

@Component({
    selector: 'app-mics-purchase',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, InputNumberModule, CalendarModule, DropdownModule, TableModule, FileUploadModule, TooltipModule, ToastModule, DatePicker],
    providers: [MessageService],
    templateUrl: './mics-purchase.component.html',
    styleUrl: './mics-purchase.component.scss'
})
export class MicsPurchaseComponent implements OnInit {
    form!: FormGroup;
    itemOptions: any[] = [];
    siteOptions: any[] = [];
    purchaseNoOptions: any[] = [];
    uploadedFileName = '';
    uploadedFileBase64 = '';
    uploadedFileUrl = '';
    companyId = '';
    userId = '';

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private workService: WorkService
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            purchaseNo: [null],
            purchaseDate: [{ value: new Date(), disabled: true }, Validators.required],
            site: [null, Validators.required],
            vendor: [null, Validators.required],
            remarks: [''],
            status: [''],
            p_itemdata: [null],
            items: this.fb.array([])
        });
        this.companyId = this.authService.isLogIntType().companyid.toString();
        this.userId = this.authService.isLogIntType().userid.toString();
        this.loadPurchaseNoOptions();
        this.OnGetItem();
        this.onGetProject();
    }

    get statusColor(): string {
        const status = (this.form.get('status')?.value || '').toUpperCase();
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
            default:
                return 'grey';
        }
    }

     OnGetItem(): void {
        const paylaod = {
            p_returntype: 'ITEMALL',
            p_returnvalue: this.companyId,
            p_username: this.userId
        };
        this.inventoryService.Getreturndropdowndetails(paylaod).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.error(err)
        });
    }

    onGetProject(): void {
        const companyId = this.companyId;
        const payload = {
            returnType: 'ACTIVEPROJECT',
            returnValue: '',
            username: '',
            option1: companyId,
            option2: null
        };
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                this.siteOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    loadPurchaseNoOptions(): void {
       const payload = {
            p_returntype: 'MISCPURCHASELIST',
            p_username: this.companyId
       }
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                const rows = Array.isArray(res?.data) ? res.data : [];
                this.purchaseNoOptions = rows.map((row: any) => ({
                    ...row,
                    misc_purchase_no: row.misc_purchase_no ?? row.purchase_no ?? row.purchaseNo ?? row.miscpurchase_no ?? row.miscpurchase_no ?? row.value ?? ''
                }));
            },
            error: (err) => {
                console.error('Error fetching misc purchase numbers:', err);
                this.purchaseNoOptions = [];
            }
        });
    }

    onPurchaseChange(event: any): void {
      const payload = {
        p_returntype: 'MISCPURCHASEDETAILS',
        p_returnvalue: event?.value.toString() ?? '',
        p_username: this.companyId
      };
      this.inventoryService.Getreturndropdowndetails(payload).subscribe({
          next: (res) => {
            const data = Array.isArray(res?.data) ? res.data[0] : res?.data ?? {};
            const attachmentValue = data?.p_attachment ?? data?.attachment ?? data?.file_url ?? data?.attachment_url ?? data?.attachmentLink ?? '';

            if (attachmentValue) {
                this.setAttachmentFromServer(attachmentValue);
            } else {
                this.uploadedFileBase64 = '';
                this.uploadedFileUrl = '';
                this.uploadedFileName = '';
            }

            this.form.patchValue({
                purchaseDate: data?.purchase_date ? new Date(data.purchase_date) : this.form.get('purchaseDate')?.value,
                site: data?.project_id ?? null,
                vendor: data?.vendor_name ?? '',
                remarks: data?.remarks ?? '',
                status: data?.status ?? ''
            });

            this.mapMiscItemsToFormArray(Array.isArray(data?.items) ? data.items : []);
          },
          error: (err) => console.error('Error fetching misc purchase details:', err)
      });
    }

    private mapMiscItemsToFormArray(rows: any[]): void {
        this.items.clear();
        rows.forEach((row) => {
            this.items.push(
                this.fb.group({
                    misc_purchase_detail_id: [row.misc_purchase_detail_id ?? 0],
                    item_id: [row.item_id ?? null],
                    item_description: [row.item_description ?? ''],
                    category_id: [row.category_id ?? null],
                    category: [row.category_name ?? ''],
                    uom_id: [row.uom_id ?? null],
                    uom: [row.uom_name ?? ''],
                    quantity: [row.quantity ?? null, [Validators.min(0)]],
                    rate: [row.rate ?? 0, [Validators.min(0)]],
                    remarks: [row.remarks ?? '']
                })
            );
        });
    }

    get items(): FormArray {
        return this.form.get('items') as FormArray;
    }

    buildItemRow(): FormGroup {
        return this.fb.group({
            misc_purchase_detail_id: [0],
            item_id: [null],
            item_description: [''],
            category_id: [null],
            category: [''],
            uom_id: [null],
            uom: [''],
            quantity: [null, [Validators.min(0)]],
            rate: [0, [Validators.min(0)]],
            remarks: ['']
        });
    }

    removeItem(index: number): void {
        this.items.removeAt(index);
    }

    rowAmount(index: number): number {
        const row = this.items.at(index).value;
        const qty = Number(row.quantity) || 0;
        const rate = Number(row.rate) || 0;
        return qty * rate;
    }

    get totalAmount(): number {
        return this.items.controls.reduce((sum, _ctrl, i) => sum + this.rowAmount(i), 0);
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input?.files?.[0] ?? null;

        this.uploadedFileName = file ? file.name : '';
        this.uploadedFileUrl = '';
        this.uploadedFileBase64 = '';

        if (!file) {
            input.value = '';
            return;
        }

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImage = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type) || /\.(png|jpe?g)$/i.test(file.name);

        if (!isPdf && !isImage) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Unsupported file',
                detail: 'Please select a PDF, JPG, JPEG, or PNG file.'
            });
            input.value = '';
            this.uploadedFileName = '';
            return;
        }

        this.readFileAsBase64(file).then((base64) => {
            this.uploadedFileBase64 = base64;
        }).catch(() => {
            this.messageService.add({
                severity: 'error',
                summary: 'File read failed',
                detail: 'Could not read the selected file.'
            });
        });
    }

   previewAttachment(): void {
    // A real hosted URL (e.g. returned by the server after save/reload) can
    // be opened directly.
    if (this.uploadedFileUrl && !/^data:/i.test(this.uploadedFileUrl)) {
        const win = window.open(this.uploadedFileUrl, '_blank', 'noopener,noreferrer');
        if (!win) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Popup blocked',
                detail: 'Please allow pop-ups to preview the attachment.'
            });
        }
        return;
    }
 
    // Otherwise we only have the base64 data URL from the file the user just
    // picked — convert it to a Blob and preview via an object URL.
    const dataUrl = this.uploadedFileBase64 || this.uploadedFileUrl;
    if (!dataUrl) {
        this.messageService.add({
            severity: 'warn',
            summary: 'No attachment',
            detail: 'There is no attachment to preview.'
        });
        return;
    }
 
    const blob = this.dataUrlToBlob(dataUrl);
    if (!blob) {
        this.messageService.add({
            severity: 'error',
            summary: 'Preview failed',
            detail: 'The attachment could not be opened.'
        });
        return;
    }
 
    const blobUrl = URL.createObjectURL(blob);
    const previewWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
 
    if (!previewWindow) {
        URL.revokeObjectURL(blobUrl);
        this.messageService.add({
            severity: 'warn',
            summary: 'Popup blocked',
            detail: 'Please allow pop-ups to preview the attachment.'
        });
        return;
    }
 
    // Give the new tab time to load the blob before releasing it.
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

private dataUrlToBlob(dataUrl: string): Blob | null {
    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) return null;
 
    const mimeType = match[1] || 'application/octet-stream';
    const base64 = match[2];
 
    try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new Blob([bytes], { type: mimeType });
    } catch {
        return null;
    }
}

    private readFileAsBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    private setAttachmentFromServer(value: unknown): void {
        if (!value || typeof value !== 'string') {
            return;
        }

        const trimmed = value.trim();
        if (!trimmed) {
            return;
        }

        if (/^data:.*;base64,/.test(trimmed) || /^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed)) {
            this.uploadedFileUrl = trimmed;
            this.uploadedFileBase64 = /^data:.*;base64,/.test(trimmed) ? trimmed : '';
            this.uploadedFileName = this.uploadedFileName || 'attachment';
        }
    }

    onItemChange(event: any): void {
        const selectedItemId = event?.value;
        if (!selectedItemId) return;

     const alreadyAdded = this.items.controls.some((row) => Number(row.get('item_id')?.value) === Number(selectedItemId));
 
    if (alreadyAdded) {
        this.messageService.add({
            severity: 'warn',
            summary: 'Item already added',
            detail: 'This item is already in the list. Update the quantity in the existing row instead.'
        });
        this.form.get('p_itemdata')?.setValue(null, { emitEvent: false });
        return;
    }

        const paylaod = {
            p_returntype: 'ITEMWISE',
            p_returnvalue: selectedItemId.toString(),
            p_username: this.userId
        };

        this.inventoryService.Getreturndropdowndetails(paylaod).subscribe({
            next: (res) => {
                const detail = Array.isArray(res.data) ? res.data[0] : res.data;
                if (!detail) return;

                const lastRow = this.items.length > 0 ? this.items.at(this.items.length - 1) : null;
                const canUseLastRow = !!lastRow && !lastRow.get('item_description')?.value && !lastRow.get('category')?.value && !lastRow.get('uom')?.value;

                let targetRow = canUseLastRow ? lastRow : null;

                if (!targetRow) {
                    this.items.push(this.buildItemRow());
                    targetRow = this.items.at(this.items.length - 1) ?? null;
                }

                targetRow?.patchValue({
                    item_id: detail.itemid ?? null,
                    item_description: detail.item_description,
                    category_id: detail.categoryid ?? null,
                    category: detail.categoryname || '',
                    uom_id: detail.uomid ?? null,
                    uom: detail.uomname || '',
                    quantity: detail.required_qty_net ?? null,
                    rate: detail.rate ?? null,
                    remarks: detail.remarks || ''
                });

                this.form.get('p_itemdata')?.setValue(null, { emitEvent: false });
            },
            error: (err) => console.error(err)
        });
    }

    onReset(): void {
        this.form.reset();
        this.items.clear();
        this.uploadedFileName = '';
        this.uploadedFileBase64 = '';
        this.uploadedFileUrl = '';
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.messageService.add({
                severity: 'error',
                summary: 'Missing information',
                detail: 'Please fill all required fields before saving.'
            });
            return;
        }

        const payload: any = {
            p_operation: 'INSERT' as const,
            p_misc_purchase_id: null,
            p_misc_purchase_no: String(this.form.get('purchaseNo')?.value ?? 0),
            p_purchase_date: this.form.get('purchaseDate')?.value ? new Date(this.form.get('purchaseDate')?.value).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            p_company_id: Number(this.companyId),
            p_project_id: Number(this.form.get('site')?.value),
            p_vendor_name: String(this.form.get('vendor')?.value),
            p_attachment: this.uploadedFileBase64 || this.uploadedFileUrl || this.uploadedFileName || null,
            p_remarks: this.form.get('remarks')?.value,
            p_items_json: this.items.controls.map((row: any) => ({
                misc_purchase_detail_id: Number(row.get('misc_purchase_detail_id')?.value || 0),
                item_id: Number(row.get('item_id')?.value),
                item_description: row.get('item_description')?.value,
                category_id: Number(row.get('category_id')?.value || 0),
                uom_id: Number(row.get('uom_id')?.value || 0),
                quantity: Number(row.get('quantity')?.value || 0),
                rate: Number(row.get('rate')?.value || 0),
                remarks: row.get('remarks')?.value || ''
            })),
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertMiscPurchase(payload).subscribe({
            next: (res) => {
                const responseData = res?.data ?? res ?? {};
                const savedNo = responseData.misc_purchase_no ?? this.form.get('purchaseNo')?.value ?? '';
                const message = responseData.msg || responseData.message || 'Misc Purchase saved successfully';

                if (savedNo) {
                    const exists = this.purchaseNoOptions.some((option) => String(option.misc_purchase_no ?? option.purchase_no ?? '').trim() === String(savedNo).trim());
                    if (!exists) {
                        this.purchaseNoOptions.push({ misc_purchase_no: savedNo, misc_purchase_id: responseData.misc_purchase_id ?? null });
                    }
                    this.form.patchValue({ purchaseNo: savedNo });
                }

               

                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: message
                });
            },
            error: (err) => {
                const message = err?.error?.message || err?.error?.msg || 'Failed to save misc purchase.';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Save failed',
                    detail: message
                });
            }
        });
    }
}
