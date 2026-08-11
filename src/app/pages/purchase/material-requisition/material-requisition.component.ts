import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, ViewChild, ViewChildren, QueryList, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { WorkService } from '@/core/services/work.service';
import { MaterialRequisitionPayload } from '@/core/models/authmodel/work.model';

@Component({
    selector: 'app-material-requisition',
    imports: [CommonModule, ReactiveFormsModule, FormsModule, TableModule, InputTextModule, TextareaModule, ButtonModule, SelectModule, DropdownModule, DatePickerModule, ConfirmDialogModule],
    templateUrl: './material-requisition.component.html',
    styleUrl: './material-requisition.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class MaterialRequisitionComponent {
    @ViewChildren('uomDropdown') uomDropdown!: QueryList<Dropdown>;
    @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;
    isBarcodeScan = false;
    isAutoSelect = false;
    forecastForm!: FormGroup;
    today: Date = new Date();
    isLoadingBills = false;
    itemOptions: any[] = [];
    uomlist: any[] = [];
    requisitionOptions: any[] = [];
    draftRequisitionOptions: any[] = [];
    projectOptions: { label: string; value: any }[] = [{ label: 'Project A', value: 'Project A' }];
    departmentOptions: any[] = [];
    categoryOptions: any[] = [];
    periodOptions: any[] = [];
    towerOptions: any[] = [];
    levelOptions: any[] = [];
    pourOptions: any[] = [];
    priorityOptions: any[] = [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];
    costCenterOptions: any[] = [{ label: 'CC-001 - Civil Works', value: 'CC-001' }];
    itemDetailOptions: any[] = [];
    workList: any[] = [];
    attachmentFile: File | null = null;
    attachmentFileName = '';
    approvedByName = '';
    approvedOnDate = '';
    userId = '';
    companyId = '';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private authService: AuthService,
        private workService: WorkService
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType().companyid.toString();
        this.userId = this.authService.isLogIntType().userid.toString();
        this.loadAllDropdowns();

        this.forecastForm = this.fb.group({
            p_mf_id: [null],
            p_requisitionno: [null],
            p_draft_requisitionno: [null],
            p_mrdate: [this.today],
            p_project: [null, Validators.required],
            p_department: [null],
            p_work: [null, Validators.required],
            p_level: [null, Validators.required],
            p_pour: [null],
            // p_period: [null, Validators.required],
            p_remarks: [''],
            p_itemdata: [null],
            status: [''],
            requestedBy: [''],
            approvedBy: [''],
            approvedOn: [null],
            purpose: [''],
            costCenter: [''],
            priority: [null],
            reference: [''],
            p_priority:[null],
            p_requested: [null, Validators.required],
            p_requiredBy: [null, Validators.required],
            requiredByDate: [null, Validators.required],
            p_items: this.fb.array([])
        });
    }

    get itemArray(): FormArray {
        return this.forecastForm.get('p_items') as FormArray;
    }
    get itemRows(): FormGroup[] {
        return this.itemArray.controls as FormGroup[];
    }

    focusBarcode() {
        if (this.barcodeInput?.nativeElement) {
            this.barcodeInput.nativeElement.focus();
        }
    }

    clearBarcodeInput() {
        if (this.barcodeInput?.nativeElement) {
            this.barcodeInput.nativeElement.value = '';
            this.barcodeInput.nativeElement.focus();
        }
    }

    get approvalStatusClass(): string {
        const status = (this.forecastForm.get('status')?.value || 'pending').toLowerCase();
        return `status-${status}`;
    }

    get totalNetQuantity(): number {
        return this.itemArray.controls.reduce((sum, row) => sum + (Number(row.get('procure_qty')?.value) || 0), 0);
    }

    onAttachmentSelect(event: any) {
        const file = event.target.files[0];
        if (file) this.attachmentFileName = file.name;
    }

    onBarcodeScan(event: Event) {
        this.isBarcodeScan = true;
        const input = event.target as HTMLInputElement;
        const barcode = input?.value?.trim();
        if (!barcode) return;

        const matchedItem = this.itemOptions.find((item) => item.itembarcode === barcode || item.itemsku === barcode || item.itemid == barcode);

        if (!matchedItem) {
            this.messageService.add({
                severity: 'error',
                summary: 'Item Not Found',
                detail: `No item found for ${barcode}`,
                life: 2000
            });
            this.clearBarcodeInput();
            return;
        }

        this.isAutoSelect = true;
        this.forecastForm.get('p_itemdata')?.setValue(matchedItem.itemid);
        this.OnItemChange({ value: matchedItem.itemid });
        this.clearBarcodeInput();
        this.isBarcodeScan = false;
    }

    onAttachment(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input?.files?.[0] ?? null;
        this.attachmentFile = file;
    }

    keepBarcodeFocus(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }
        this.barcodeInput?.nativeElement?.focus();
    }

    loadAllDropdowns(): void {
        this.onGetMFNumberist();
        this.OnGetDraftList();
        this.OnGetItem();
        this.OnGetDepartment();
        this.onGetProject();
        // this.onGetPeriod();
    }

    onProjectChange(data: any) {
        this.OnGetWorkList(data);
    }

    OnGetItem(): void {
        const paylaod = {
            p_returntype: 'ITEMALL',
            p_returnvalue: this.companyId,
            username: this.userId
        };
        this.inventoryService.Getreturndropdowndetails(paylaod).subscribe({
            next: (res) => (this.itemOptions = res.data),
            error: (err) => console.error(err)
        });
    }

    OnGetItemDetail(data: any): void {
        const paylaod = {
            p_returntype: 'ITEMDETAILS',
            p_returnvalue: data.value.toString(),
            username: this.userId
        };
        this.inventoryService.Getreturndropdowndetails(paylaod).subscribe({
            next: (res) => {
                const detail = Array.isArray(res.data) ? res.data[0] : res.data;
                if (!detail) return;
                this.itemArray.push(this.createItemRow(detail));
            },
            error: (err) => console.error(err)
        });
    }

    OnGetWorkList(data: any): void {
        const paylaod = { p_returntype: 'WORKLISTDD', p_returnvalue: data.value.toString(), username: this.userId };
        this.inventoryService.Getreturndropdowndetails(paylaod).subscribe({
            next: (res) => {
                this.workList = res.data || [];
                this.buildTowerOptions();
                this.levelOptions = [];
                this.pourOptions = [];
                this.forecastForm.patchValue({ p_work: null, p_level: null, p_pour: null }, { emitEvent: false });
            },
            error: (err) => console.error(err)
        });
    }

    onGetMFNumberist() {
        const payload = {
            p_returntype: 'MFNUMBER',
            p_returnvalue: this.companyId,
            username: this.userId
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.requisitionOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    OnGetDraftList() {
        const userId = this.authService.isLogIntType().userid.toString();
        const payload = {
            p_returntype: 'MFDRAFT',
            p_returnvalue: this.companyId,
            username: userId
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.draftRequisitionOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    OnGetDepartment(): void {
        const userId = this.authService.isLogIntType().userid.toString();
        const payload = {
            p_returntype: 'DEPARTMENT',
            p_returnvalue: '',
            username: userId
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.departmentOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    onGetProject(): void {
        const companyId = this.authService.isLogIntType().companyid.toString();
        const payload = {
            returnType: 'ACTIVEPROJECT',
            returnValue: '',
            username: '',
            option1: companyId,
            option2: null
        };
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                this.projectOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    // onGetPeriod(): void {
    //     const payload = {
    //         returnType: 'PERIOD',
    //         returnValue: '',
    //         username: '',
    //         option1: null,
    //         option2: null
    //     };
    //     this.inventoryService.getparameterbased(payload).subscribe({
    //         next: (res) => {
    //             const allPeriods: any[] = res.data || [];
    //             this.periodOptions = allPeriods.filter((p) => this.isCurrentOrFuturePeriod(p.period_name));
    //         },
    //         error: (err) => console.error(err)
    //     });
    // }

    // private isCurrentOrFuturePeriod(periodName: string): boolean {
    //     // periodName format: "JAN-26", "APR-26", etc.
    //     const monthMap: Record<string, number> = {
    //         JAN: 0,
    //         FEB: 1,
    //         MAR: 2,
    //         APR: 3,
    //         MAY: 4,
    //         JUN: 5,
    //         JUL: 6,
    //         AUG: 7,
    //         SEP: 8,
    //         OCT: 9,
    //         NOV: 10,
    //         DEC: 11
    //     };

    //     const [monStr, yyStr] = periodName.split('-');
    //     const month = monthMap[monStr.toUpperCase()];
    //     if (month === undefined) return true; // unrecognized format — don't accidentally hide it

    //     const year = 2000 + parseInt(yyStr, 10);
    //     const periodDate = new Date(year, month, 1);

    //     const now = new Date();
    //     const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    //     return periodDate >= currentMonthStart;
    // }

    private buildTowerOptions(): void {
        const seen = new Map<number, any>();
        for (const w of this.workList) {
            if (!seen.has(w.tower_block_id)) {
                seen.set(w.tower_block_id, { tower_id: w.tower_block_id, tower_name: w.tower_name });
            }
        }
        this.towerOptions = Array.from(seen.values());
    }

    onTowerChange(event: any): void {
        const towerId = event.value;
        this.levelOptions = this.workList
            .filter((w) => w.tower_block_id === towerId)
            .reduce((acc: any[], w) => {
                if (!acc.some((l) => l.value === w.level_name)) acc.push({ label: w.level_name, value: w.level_name });
                return acc;
            }, []);
        this.pourOptions = [];
        this.forecastForm.patchValue({ p_level: null, p_pour: null }, { emitEvent: false });
    }

    onLevelChange(event: any): void {
        const towerId = this.forecastForm.get('p_work')?.value;
        const levelName = event.value;
        this.pourOptions = this.workList
            .filter((w) => w.tower_block_id === towerId && w.level_name === levelName)
            .reduce((acc: any[], w) => {
                if (!acc.some((p) => p.value === w.pour_name)) acc.push({ label: w.pour_name, value: w.pour_name });
                return acc;
            }, []);
        this.forecastForm.patchValue({ p_pour: null }, { emitEvent: false });
    }

    onDraftChange(data: any): void {
        const fromRequisition = this.requisitionOptions.find((m: any) => m.mf_id === data.value);
        const fromDraft = this.draftRequisitionOptions.find((m: any) => m.mf_id === data.value);
        const matched = fromRequisition ?? fromDraft;

        if (!matched) {
            console.warn('No matching MF found for value:', data.value);
            return;
        }

        const paylaod = { p_returntype: 'MFDETAILS', p_returnvalue: matched.mf_no, username: this.userId };
        this.inventoryService.Getreturndropdowndetails(paylaod).subscribe({
            next: (res) => {
                const rows: any[] = Array.isArray(res?.data) ? res.data : [];
                if (!rows.length) return;
                const header = rows[0];
                const applyDraft = () => {
                    this.buildTowerOptions();

                    this.levelOptions = this.workList
                        .filter((w) => w.tower_block_id === header.tower_block_id)
                        .reduce((acc: any[], w) => {
                            if (!acc.some((l) => l.value === w.level_name)) acc.push({ label: w.level_name, value: w.level_name });
                            return acc;
                        }, []);

                    this.pourOptions = this.workList
                        .filter((w) => w.tower_block_id === header.tower_block_id && w.level_name === header.level_name)
                        .reduce((acc: any[], w) => {
                            if (!acc.some((p) => p.value === w.pour_name)) acc.push({ label: w.pour_name, value: w.pour_name });
                            return acc;
                        }, []);

                    const resolvedPour = header.pour_name ?? (this.pourOptions.length === 1 ? this.pourOptions[0].value : null);

                    this.forecastForm.patchValue(
                        {
                            p_mf_id: header.mf_id,
                            p_draft_requisitionno: header.mf_no,
                            p_project: header.project_id,
                            p_department: header.department_id,
                            p_work: header.tower_block_id,
                            p_level: header.level_name,
                            p_pour: resolvedPour,
                            p_period: header.forecast_month,
                            p_remarks: header.remarks ?? '',
                            status: header.status
                        },
                        { emitEvent: false }
                    );

                    this.itemArray.clear();
                    rows.forEach((row: any) => {
                        const master = this.itemOptions.find((i) => i.itemid === row.item_id);
                        this.itemArray.push(
                            this.createItemRow({
                                mfdetailid: row.mfdetailid,
                                categoryid: row.item_category_id,
                                item_category: row.categoryname ?? '',
                                itemid: row.item_id,
                                itemname: master?.itemname ?? '',
                                uomid: row.uom_id,
                                uomname: row.uomname ?? '',
                                buffer_stock: row.buffer_stock,
                                currentstock: row.available_stock,
                                pending_qty: row.pending_qty,
                                forecast_qty: row.forecast_qty,
                                remarks: row.itemremark ?? ''
                            })
                        );
                    });
                };

                const hasTower = this.workList.some((w) => w.tower_block_id === header.tower_block_id);
                if (!hasTower) {
                    // workList wasn't loaded for this draft's project yet — fetch it first
                    const wlPayload = { p_returntype: 'WORKLISTDD', p_returnvalue: header.project_id.toString(), username: this.userId };
                    this.inventoryService.Getreturndropdowndetails(wlPayload).subscribe({
                        next: (res2) => {
                            this.workList = res2.data || [];
                            applyDraft();
                        },
                        error: (err) => console.error(err)
                    });
                } else {
                    applyDraft();
                }
            },
            error: (err) => {
                console.error(err);
                const detail = err?.error?.message || 'Failed to load forecast';
                this.messageService.add({ severity: 'error', summary: detail, life: 2500 });
            }
        });
    }

    get isReadOnlyView(): boolean {
        return this.forecastForm.get('status')?.value === 'SUBMITTED';
    }
    createItemRow(data?: any): FormGroup {
        const row = this.fb.group({
            item_category_id: [data?.categoryid ?? null],
            item_category: [data?.item_category ?? ''],
            item_id: [data?.itemid ?? null],
            item_name: [data?.itemname ?? ''],
            uom_id: [data?.uomid ?? null],
            uom_name: [data?.uomname ?? ''],
            buffer_stock: [data?.buffer_stock ?? 0],
            available_stock: [data?.currentstock ?? 0],
            pending_qty: [data?.pending_qty ?? 0],
            forecast_qty: [data?.forecast_qty ?? '', Validators.min(0)],
            procure_qty: [{ value: 0, disabled: true }],
            remarks: [data?.remarks ?? null]
        });

        this.wireProcureQtyCalc(row);
        this.recalculateProcureQty(row);

        return row;
    }

    private wireProcureQtyCalc(row: FormGroup): void {
        row.get('forecast_qty')?.valueChanges.subscribe(() => this.recalculateProcureQty(row));
        row.get('pending_qty')?.valueChanges.subscribe(() => this.recalculateProcureQty(row));
    }

    private recalculateProcureQty(row: FormGroup): void {
        const forecastQty = Number(row.get('forecast_qty')?.value) || 0;
        const pendingQty = Number(row.get('pending_qty')?.value) || 0;
        const availableQty = Number(row.get('available_stock')?.value) || 0;

        const procureQty = Math.max(forecastQty - pendingQty - availableQty, 0);
        row.get('procure_qty')?.setValue(procureQty, { emitEvent: false });
    }

    OnItemChange(event: any): void {
        const item = this.itemOptions.find((i) => i.itemid == event.value);
        if (!item) return;

        const alreadyExists = this.itemArray.controls.some((row) => row.get('item_id')?.value === item.itemid);
        if (alreadyExists) {
            this.messageService.add({ severity: 'warn', summary: 'Duplicate Item', detail: `${item.itemname} is already added.`, life: 2000 });
            this.forecastForm.get('p_itemdata')?.setValue(null, { emitEvent: false });
            this.isAutoSelect = false;
            return;
        }

        this.OnGetItemDetail({ value: item.itemid });
        if (!this.isAutoSelect) {
            this.forecastForm.get('p_itemdata')?.setValue(null, { emitEvent: false });
        }
        this.isAutoSelect = false;
    }

    OnUMO(itemId: any, index: number): void {
        this.inventoryService.getdropdowndetails({ p_returntype: 'SALEUOM', p_returnvalue: itemId }).subscribe({
            next: (res) => {
                if (!res?.data?.length) return;
                this.uomlist[index] = res.data;
                const row = this.itemArray.at(index);
                if (!row.get('uom_id')?.value) {
                    const first = res.data[0];
                    row.patchValue({ uom_id: first.fieldid, uom_name: first.fieldname });
                }
            },
            error: (err) => console.error(err)
        });
    }

    UOMId(event: any, index: number): void {
        const row = this.itemArray.at(index);
        const selectedUom = this.uomlist[index]?.find((u: any) => u.fieldid === event.value);
        if (!selectedUom) return;
        row.patchValue({ uom_id: selectedUom.fieldid, uom_name: selectedUom.fieldname });
    }

    deleteBill(item: any, event: Event) {
        event.stopPropagation();
        this.requisitionOptions = this.requisitionOptions.filter((x) => x.billno !== item.billno);
        if (this.forecastForm.get('p_draft_requisitionno')?.value === item.billno) {
            this.forecastForm.get('p_draft_requisitionno')?.setValue(null);
        }
    }

    removeItem(i: number): void {
        this.confirmationService.confirm({
            message: 'Remove this item from the forecast?',
            header: 'Confirm Delete',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.itemArray.removeAt(i);
                if (this.uomlist?.[i]) this.uomlist.splice(i, 1);
            }
        });
    }

    isSubmitDisabled(): boolean {
        return this.itemArray.length === 0 || !!this.forecastForm.get('p_project')?.invalid || !!this.forecastForm.get('p_work')?.invalid || !!this.forecastForm.get('p_level')?.invalid || !!this.forecastForm.get('p_period')?.invalid;
    }

    private buildPayload(action: 'DRAFT' | 'SUBMIT', operation?: 'INSERT' | 'EDIT' | 'DELETE'): MaterialRequisitionPayload {
        const v = this.forecastForm.value;
        return {
            p_action: action,
            p_operation: operation ?? (v.p_mf_id ? 'EDIT' : 'INSERT'),
            p_mf_id: v.p_mf_id ?? null,
            p_project_id: v.p_project,
            p_department_id: v.p_department,
            p_tower_block_id: v.p_work,
            p_level_name: v.p_level,
            p_forecast_month: v.p_period,
            p_pour_name: v.p_pour,
            p_remarks: v.p_remarks || '',
            p_items: this.itemArray.controls.map((row: any) => ({
                item_category_id: row.get('item_category_id')?.value ?? null,
                item_id: row.get('item_id')?.value,
                uom_id: row.get('uom_id')?.value ?? null,
                buffer_stock: row.get('buffer_stock')?.value ?? 0,
                available_stock: row.get('available_stock')?.value ?? 0,
                pending_qty: row.get('pending_qty')?.value ?? 0,
                forecast_qty: row.get('forecast_qty')?.value ?? 0,
                procure_qty: row.get('procure_qty')?.value ?? 0,
                remarks: row.get('remarks')?.value || ''
            })),
            p_loginuser: this.authService.isLogIntType()?.userid
        };
    }

    submitDraft(): void {
        const v = this.forecastForm.value;
        const operation = v.p_mf_id ? 'EDIT' : 'INSERT';
        this.workService.upsertMaterialForecast(this.buildPayload('DRAFT', operation)).subscribe({
            next: (res) => {
                this.messageService.add({ severity: 'success', summary: res.data.message, life: 2000 });

                if (res.data.status === 'success') {
                    // if (!this.draftRequisitionOptions.some((r) => r.mf_id === newEntry.mf_id)) {
                    //     this.draftRequisitionOptions = [...this.draftRequisitionOptions, newEntry];
                    // }{ mf_id: res.data.mf_id, mf_no: res.data.mf_no };
                    this.OnGetDraftList();
                    const newEntry = this.draftRequisitionOptions.find((u) => u.mf_no === res.data.mf_id);
                    console.log(newEntry);
                    this.forecastForm.patchValue({
                        p_mf_id: res.data.mf_id,
                        p_draft_requisitionno: res.data.mf_id,
                        status: 'Draft'
                    });
                }
            },
            error: (err) => {
                console.error(err);
                const detail = err?.error?.message || 'Failed to save draft';
                this.messageService.add({ severity: 'error', summary: detail, life: 2500 });
            }
        });
    }

    onSubmit(): void {
        if (this.isSubmitDisabled()) {
            this.messageService.add({ severity: 'error', summary: 'Validation Failed', detail: 'Fill all required fields and add at least one item.', life: 2500 });
            return;
        }

        this.confirmationService.confirm({
            message: 'Are you sure you want to submit this forecast?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.workService.upsertMaterialForecast(this.buildPayload('SUBMIT')).subscribe({
                    next: (res) => {
                        if (res.data.status === 'success') {
                            this.messageService.add({ severity: 'success', summary: res.data.message, life: 2000 });
                            const newEntry = { mf_id: res.data.mf_id, mf_no: res.data.mf_no };

                            if (!this.requisitionOptions.some((r) => r.mf_id === newEntry.mf_id)) {
                                this.requisitionOptions = [...this.requisitionOptions, newEntry];
                            }

                            this.forecastForm.patchValue({
                                p_mf_id: res.data.mf_id,
                                p_requisitionno: res.data.mf_id,
                                status: 'Submitted'
                            });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.data.message, life: 2000 });
                        }
                    },
                    error: (res) => {
                        console.error(res);
                        const detail = res?.error?.message || res?.data || 'Something went wrong';
                        this.messageService.add({ severity: 'error', summary: detail, life: 2500 });
                    }
                });
            }
        });
    }

    private buildDeletePayload(mfId: number): MaterialRequisitionPayload {
        return {
            p_action: 'DRAFT',
            p_operation: 'DELETE',
            p_mf_id: mfId,
            p_project_id: null,
            p_department_id: null,
            p_tower_block_id: null,
            p_level_name: null,
            p_forecast_month: null,
            p_pour_name: null,
            p_remarks: null,
            p_items: [],
            p_loginuser: this.authService.isLogIntType()?.userid
        };
    }

    deleteDraftItem(item: any, event: Event): void {
        event.stopPropagation();

        this.confirmationService.confirm({
            message: `Delete draft ${item.mf_no}? This cannot be undone.`,
            header: 'Confirm Delete',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.workService.upsertMaterialForecast(this.buildDeletePayload(item.mf_id)).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: res.data.message, life: 2000 });
                        this.draftRequisitionOptions = this.draftRequisitionOptions.filter((x) => x.mf_id !== item.mf_id);
                    },
                    error: (err) => {
                        console.error(err);
                        const detail = err?.error?.message || 'Failed to delete draft';
                        this.messageService.add({ severity: 'error', summary: detail, life: 2500 });
                    }
                });
            }
        });
    }
    onReset(): void {
        this.forecastForm.reset();
        this.itemArray.clear();
        this.uomlist = [];
        this.forecastForm.get('p_period')?.setValue(null);
    }
}
