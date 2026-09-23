import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventoryService } from '@/core/services/inventory.service';
import { WorkService } from '@/core/services/work.service';
import { AuthService } from '@/core/services/auth.service';
import { getStatusColor } from '@/shared/utils/status-color';
import { MaterialIndent, MaterialIndentItem, MaterialIssue } from '@/core/models/authmodel/work.model';

@Component({
    selector: 'app-material-indent',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, ConfirmDialogModule, DatePickerModule, DialogModule, DropdownModule, InputNumberModule, InputTextModule, TableModule, TooltipModule],
    templateUrl: './material-indent.component.html',
    styleUrl: './material-indent.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class MaterialIndentComponent implements OnInit {
    minForm!: FormGroup;
    today: Date = new Date();
    issueItems: any[] = [];
    selectedItemId: number | null = null;

    indentOptions: any[] = [];
    draftIndentOptions: any[] = [];
    projectOptions: any[] = [];
    towerOptions: any[] = [];
    levelOptions: any[] = [];
    pourOptions: any[] = [];
    workList: any[] = [];
    storeOptions: any[] = [];
    requestReferenceOptions: any[] = [];
    requestedByOptions: any[] = [];
    itemOptions: any[] = [];
    
    // ── MIN counter (replace with backend auto-increment) ──────────────────
    editingIndentId: number | null = null;
    private companyId = '';
    private userId = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private inventoryService: InventoryService,
        private workService: WorkService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        public datePipe: DatePipe,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid?.toString() ?? '';
        this.userId = this.authService.isLogIntType()?.userid?.toString() ?? '';
        this.initForm();
        this.loadDropdowns();
    }

    private initForm(): void {
        const currentUser = this.authService.isLogIntType()?.fullname;

        this.minForm = this.fb.group({
            p_indentno: [{ value: '', disabled: false }],
            p_draft_indent: [''],
            p_issuedate: [this.today, Validators.required],
            p_project: [null, Validators.required],
            p_tower: [null, Validators.required],
            p_level: [null],
            p_pour: [null],
            p_requestreference: [null],
            p_selecteditem: [null],
            p_requestedby: [null, Validators.required],
            p_issuedby: [{ value: currentUser, disabled: true }],
            p_remarks: ['', Validators.maxLength(500)],
            status: ['']
        });
    }

    get statusColor(): string {
        return getStatusColor(this.minForm.get('status')?.value);
    }

    hasCopyableData(): boolean {
        const v = this.minForm.getRawValue();
        return !!(v.p_project || v.p_tower || v.p_level || v.p_pour || v.p_requestreference || v.p_requestedby || v.p_remarks || this.issueItems.length > 0);
    }

    private loadDropdowns(): void {
        this.loadProjects();
        this.loadRequestedBy();
        this.OnGetItem();
        const indentId = this.route.snapshot.queryParamMap.get('indentId');
        this.onGetIndentList(indentId ? Number(indentId) : undefined);
        this.onGetDraftIndentList();
    }

    hasZeroQtyItem(): boolean {
    return this.issueItems.some((it) => !it.requestqty || Number(it.requestqty) <= 0);
}

    onGetIndentList(indentId?: number): void {
        const payload = { p_returntype: 'INDENTLIST', p_returnvalue: this.companyId, p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.indentOptions = res.data ?? [];
                if (indentId) {
                    const option = this.indentOptions.find((item: any) => Number(item.indent_id) === indentId);
                    if (option) this.onIndentChange({ value: option.indent_no });
                }
            },
            error: (err) => console.error(err)
        });
    }

    onBack(): void {
        this.router.navigate(['/layout/issue-item/material-indent']);
    }

    onGetDraftIndentList(): void {
        const payload = { p_returntype: 'INDENTLISTDRAFT', p_returnvalue: this.companyId, p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.draftIndentOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    private loadProjects(): void {
        const payload = { returnType: 'ACTIVEPROJECT', returnValue: '', username: '', option1: this.companyId, option2: null };
        this.inventoryService.getparameterbased(payload).subscribe({ next: (res: any) => (this.projectOptions = res.data ?? []), error: (err) => console.error(err) });
    }

    onProjectChange(event: any): void {
        const projectId = event.value;
        this.workList = [];
        this.towerOptions = [];
        this.levelOptions = [];
        this.pourOptions = [];
        this.minForm.patchValue({ p_tower: null, p_level: null, p_pour: null }, { emitEvent: false });
        if (!projectId) return;

        const payload = { p_returntype: 'WORKLISTDD', p_returnvalue: String(projectId), p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res: any) => {
                this.workList = res.data ?? [];
                const towers = new Map<number, any>();
                this.workList.forEach((work) => towers.set(work.tower_block_id, { tower_id: work.tower_block_id, tower_name: work.tower_name }));
                this.towerOptions = Array.from(towers.values());
            },
            error: (err) => console.error(err)
        });
    }

    onTowerChange(event: any): void {
        const towerId = event.value;
        this.levelOptions = this.workList
            .filter((work) => work.tower_block_id === towerId)
            .reduce((levels: any[], work) => {
                if (!levels.some((level) => level.value === work.level_name)) levels.push({ label: work.level_name, value: work.level_name });
                return levels;
            }, []);
        this.pourOptions = [];
        this.minForm.patchValue({ p_level: null, p_pour: null }, { emitEvent: false });
    }

    onLevelChange(event: any): void {
        const towerId = this.minForm.get('p_tower')?.value;
        this.pourOptions = this.workList
            .filter((work) => work.tower_block_id === towerId && work.level_name === event.value)
            .reduce((pours: any[], work) => {
                if (!pours.some((pour) => pour.value === work.pour_name)) pours.push({ label: work.pour_name, value: work.pour_name });
                return pours;
            }, []);
        this.minForm.patchValue({ p_pour: null }, { emitEvent: false });
    }

    private loadRequestedBy(): void {
        const payload = { p_returntype: 'REQUESTEDBY', p_returnvalue: this.companyId, p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({ next: (res: any) => (this.requestedByOptions = res.data ?? []), error: (err) => console.error(err) });
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

   onIndentChange(event: any): void {
    if (!event.value) return;
    const indentValue = this.indentOptions.find((option) => option.indent_no === event.value);
    const payload = {
        p_returntype: 'INDENTDETAILS',
        p_returnvalue: indentValue?.indent_no,
        p_username: this.authService.isLogIntType().companyid.toString()
    };
    this.inventoryService.Getreturndropdowndetails(payload).subscribe((res) => {
        const rows: any[] = res.data ?? [];
        if (!rows.length) return;
        this.minForm.patchValue({p_draft_indent:''});
        this.onChangePatch(rows);    
    });
}

onChangePatch(rows:any){
       const header = rows[0];
        this.editingIndentId = header.indent_id ?? null;
        
        this.minForm.patchValue({
            p_indentno: header.indent_no ?? '',
            p_issuedate: header.indent_date ? new Date(header.indent_date) : null,
            p_project: header.project_id ?? null,
            p_requestedby: Number(header.requested_by) ?? null,  
            p_remarks: header.remarks ?? '',
            status: header.status ?? ''
        });
       
         const projectId = header.project_id;
        const towerId = header.tower_block_id != null ? Number(header.tower_block_id) : null;
         if (projectId) {
            const workPayload = { p_returntype: 'WORKLISTDD', p_returnvalue: String(projectId), p_username: this.userId };
            this.inventoryService.Getreturndropdowndetails(workPayload).subscribe({
                next: (workRes: any) => {
                    this.workList = workRes.data ?? [];
                    const towers = new Map<number, any>();
                    this.workList.forEach((work) => towers.set(work.tower_block_id, { tower_id: work.tower_block_id, tower_name: work.tower_name }));
                    this.towerOptions = Array.from(towers.values());

                    // Now towerOptions has the matching { tower_id: 29, tower_name: 'Tower 1' } entry
                    this.minForm.patchValue({ p_tower: towerId });

                    // Build Level options for this tower too (Pour will populate similarly if/when
                    // your backend starts returning level/pour data on the indent record)
                    if (towerId) {
                        this.levelOptions = this.workList
                            .filter((work) => work.tower_block_id === towerId)
                            .reduce((levels: any[], work) => {
                                if (!levels.some((level) => level.value === work.level_name)) levels.push({ label: work.level_name, value: work.level_name });
                                return levels;
                            }, []);
                    }
                },
                error: (err) => console.error(err)
            });
        }

        // ── Patch item rows from the flattened response ─────────────────────
        this.issueItems = rows
            .filter((r:any) => r.item_id != null)
            .map((r:any) => {
                return {
                    itemid: r.item_id,
                    itemname: r.item_name,
                    categoryid: r.item_category_id,
                    categoryname: r.category_name,
                    uom: r.uom_name,
                    uomid: r.uom_id,
                    currentstock: r.current_stock ?? 0,
                    bufferqty: Number(r.current_stock - r.available_qty) ?? 0,                          // ⚠️ not present in this response — confirm source
                    availableqty: r.available_qty ?? 0,
                    requestqty: r.requested_qty ?? 0,
                    indentdetailid: r.indent_detail_id ?? null
                };
            });
}

    // ── Table qty logic ────────────────────────────────────────────────────
    onIssueQtyChange(item: any): void {
        const issued = Number(item.requestqty || 0);
        const available = Number(item.availableqty || 0);

        // Cap at available
        if (issued > available) {
            item.requestqty = available;
        }
        if (issued < 0) {
            item.requestqty = 0;
        }

        item.balance = available - Number(item.requestqty);
        item.amount = Number(item.requestqty || 0) * Number(item.rate || 0);
    }

    removeItem(index: number): void {
        this.confirmationService.confirm({
            message: 'Remove this item from the list?',
            header: 'Confirm',
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.issueItems = this.issueItems.filter((_, i) => i !== index);
            }
        });
    }

    onDraftChange(event: any): void {
        if (!event.value) return;
        const draftvalue = this.draftIndentOptions.find((i) => i.indent_id === event.value)?.indent_no;
        const payload = {
            p_returntype: 'INDENTDETAILSDRAFT',
            p_returnvalue: draftvalue,
            p_username: this.companyId
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe((res) => {
           this.minForm.patchValue({ p_indentno: '' });
           this.onChangePatch(res.data)
        });
    }

    deleteDraftItem(item: any, event: Event): void {
        event.stopPropagation();
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this draft item?',
            header: 'Confirm Deletion',
            acceptLabel: 'Yes, Delete',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.draftIndentOptions = this.draftIndentOptions.filter((i) => i.indent_id !== item.indent_id);
            }
        });
    }

    get totalRequestedQty(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.requestedqty) || 0), 0);
    }

    get totalIssueQty(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.requestqty) || 0), 0);
    }

    get totalBalance(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.balance) || 0), 0);
    }

    get totalIssueValue(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    }

    onSubmit(): void {
        this.minForm.markAllAsTouched();
        if (this.issueItems.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Items',
                detail: 'Please add at least one item before submitting.',
                life: 3000
            });
            return;
        }
        this.confirmationService.confirm({
            message: 'Are you sure you want to submit this Material Issue Note?',
            header: 'Confirm Submission',
            acceptLabel: 'Submit',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => this.saveMIN()
        });
    }

    onItemChange(event: any): void {
        if (!event.value) return;

        const payload = { p_returntype: 'ITEMWISE', p_returnvalue: event.value, p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                const item = res.data?.[0];
                if (!item) return;
                this.addItemToTable(item);
            },
            error: (err) => console.error(err)
        });
    }

    private addItemToTable(item: any): void {
        const exists = this.issueItems.find((i) => i.itemid === item.itemid);
        if (exists) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Item',
                detail: `${item.item_description} is already in the list.`,
                life: 2500
            });
            this.selectedItemId = null;
            this.minForm.get('p_selecteditem')?.setValue(null);
            return;
        }

        const newRow: any = {
            itemid: item.itemid,
            itemname: item.item_description,
            categoryid: item.categoryid,
            categoryname: item.categoryname,
            uom: item.uomname,
            uomid: item.uomid,
            currentstock: item.current_stock ?? 0,
            bufferqty: item.buffer_stock ?? 0,
            availableqty: item.available_qty,
            requestedqty: item.requestqty ?? 0,
        };

        this.issueItems = [...this.issueItems, newRow];
        this.selectedItemId = null;
        this.minForm.get('p_selecteditem')?.setValue(null);
    }

    private saveMIN(): void {
        const payload = this.buildIndentPayload('SUBMIT');

        this.workService.upsertMaterialIndent(payload).subscribe({
            next: (res: any) => {
                if (res.data.success) {
                    this.messageService.add({ severity: 'success', summary: 'Submitted', detail: res.data.msg });
                    this.editingIndentId = res.data.indent_id ?? this.editingIndentId;
                    this.minForm.patchValue({ p_indentno: res.data.indent_no ?? '', status: res.data.tran_status ?? 'SUBMITTED' });
                    this.onGetIndentList();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.data.msg });
                }
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit Material Indent.', life: 3000 });
            }
        });
    }

    draftSubmit(): void {
        const payload = this.buildIndentPayload('DRAFT');

        this.workService.upsertMaterialIndent(payload).subscribe({
            next: (res: any) => {
                if (res.data.success) {
                    this.messageService.add({ severity: 'success', summary: 'Draft Saved', detail: res.data.msg });
                    this.minForm.patchValue({p_draft_indent: res.data.indent_id ?? '', status: res.data.status });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.data.msg });
                }
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save draft.', life: 3000 });
            }
        });
    }

    private buildIndentPayload(action: 'DRAFT' | 'SUBMIT'): MaterialIndent {
        const formVal = this.minForm.getRawValue();
        const isEdit = this.editingIndentId != null;
        console.log(this.editingIndentId);
        const itemsPayload: MaterialIndentItem[] = this.issueItems.map((it) => ({
            item_category_id: it['categoryid'] ?? null,
            item_id: it.itemid,
            uom_id: it.uomid,
            current_stock: it.currentstock,
            requested_qty: it.requestqty,
            available_qty: it.availableqty
        }));

        return {
            p_action: action,
            p_operation: isEdit ? 'UPDATE' : 'INSERT',
            p_indent_id: isEdit ? this.editingIndentId : null,
            p_indent_date: this.datePipe.transform(formVal.p_issuedate, 'yyyy-MM-dd'),
            p_company_id: Number(this.companyId),
            p_project_id: formVal.p_project,
            p_tower_block_id: formVal.p_tower,
            p_indent_for: null, 
            p_indent_activty: [formVal.p_pour, formVal.p_level].filter(Boolean).join(' - ') || null , 
            p_requested_by: String(formVal.p_requestedby ?? ''),
            p_created_by: String(this.userId),
            p_remarks: formVal.p_remarks,
            p_items_json: itemsPayload,
            p_loginuser: String(this.userId)
        };
    }

    onReset(): void {
        const currentUser = this.authService.isLogIntType()?.username || 'Current User';
        this.minForm.reset({ p_issuedate: this.today });
        this.minForm.patchValue({ p_issuedby: currentUser });
        this.issueItems = [];
        this.editingIndentId = null;
    }
}
