import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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

// ── Replace with your real service ───────────────────────────────────────────
import { InventoryService } from '@/core/services/inventory.service';
import { WorkService } from '@/core/services/work.service';
import { AuthService } from '@/core/services/auth.service';
import { MaterialIssue } from '@/core/models/authmodel/work.model';

@Component({
    selector: 'app-material-issue',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, ConfirmDialogModule, DatePickerModule, DialogModule, DropdownModule, InputNumberModule, InputTextModule, TableModule, TooltipModule],
    templateUrl: './material-issue.component.html',
    styleUrl: './material-issue.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class MaterialIssueComponent implements OnInit {
    minForm!: FormGroup;
    today: Date = new Date();
    issueItems: any[] = [];
    selectedItemId: number | null = null;

    minOptions: { minno: string; [key: string]: any }[] = [];
    projectOptions: any[] = [];
    towerOptions: any[] = [];
    levelOptions: { label: string; value: string }[] = [];
    pourOptions: { label: string; value: string }[] = [];
    workList: any[] = [];
    storeOptions: { label: string; value: string }[] = [];
    requestReferenceOptions: { label: string; value: string }[] = [];
    requestedByOptions: { label: string; value: string }[] = [];
    indentOptions: any[] = [];

    // ── MIN counter (replace with backend auto-increment) ──────────────────
    private editingMinId: number | null = null;
    private companyId = '';
    private userId = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private inventoryService: InventoryService,
        private workService: WorkService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        public datePipe: DatePipe
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
            p_issueno: [{ value: '', disabled: false }],
            p_indent: [null, Validators.required],
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
            status: ''
        });
    }

    hasCopyableData(): boolean {
        const v = this.minForm.getRawValue();
        return !!(v.p_project || v.p_tower || v.p_level || v.p_pour || v.p_requestreference || v.p_requestedby || v.p_remarks || this.issueItems.length > 0);
    }

    get statusColor(): string {
        const status = (this.minForm.get('status')?.value || '').toUpperCase();
        switch (status) {
            case 'APPROVED':
                return 'green';
            case 'SUBMITTED':
                return 'blue';
            case 'REJECTED':
                return 'red';
            case 'CANCELLED':
                return 'red';
            case 'PARTIALLY RECEIVED':
                return 'purple';
            case 'DRAFT':
                return 'grey';
            case 'APPROVAL PENDING':
                return 'orange';
            default:
                return 'grey';
        }
    }

    private loadDropdowns(): void {
        this.loadMINList();
        this.loadProjects();
        this.loadRequestedBy();
        this.onGetIndent();
    }

    private loadMINList(): void {
        const payload = { p_returntype: 'MINLIST', p_username: this.companyId };
        this.inventoryService.getdropdowndetails(payload).subscribe({
            next: (res) => {
                this.minOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    private onGetIndent(): void {
        const payload = { p_returntype: 'INDENTLIST', p_returnvalue: this.companyId, p_username: this.userId };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.indentOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    private loadProjects(): void {
        const payload = { returnType: 'ACTIVEPROJECT', returnValue: '', username: '', option1: this.companyId, option2: null };
        this.inventoryService.getparameterbased(payload).subscribe({ next: (res: any) => (this.projectOptions = res.data ?? []), error: (err) => console.error(err) });
    }

    onIndentChange(event: any): void {
        if (!event.value) return;
        const indentValue = this.indentOptions.find((option) => option.indent_id === event.value);
        const payload = {
            p_returntype: 'INDENTDETAILS',
            p_returnvalue: indentValue?.indent_no,
            p_username: this.authService.isLogIntType().companyid.toString()
        };
        this.inventoryService.Getreturndropdowndetails(payload).subscribe((res) => {
            const rows: any[] = res.data ?? [];
            if (!rows.length) return;

            const header = rows[0];

            // Patch everything that doesn't depend on cascading dropdown options first
            this.minForm.patchValue({
                p_issuedate: header.indent_date ? new Date(header.indent_date) : this.today,
                p_project: header.project_id ?? null,
                p_requestedby: header.requested_by != null ? Number(header.requested_by) : null,
                p_remarks: header.remarks ?? ''
            });

            // Tower needs towerOptions populated first — load work-list for this project,
            // build towerOptions, THEN patch p_tower once options exist (same fix as Material Indent).
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

                        this.minForm.patchValue({ p_tower: towerId });

                        // Level/Pour: no data present on INDENTDETAILS (project_activity is null,
                        // no separate level/pour keys), so these stay unset until backend provides them.
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
                .filter((r) => r.item_id != null)
                .map((r) => {
                    return {
                        itemid: r.item_id,
                        itemcode: r.item_code ?? r.item_id,
                        itemname: r.item_name,
                        categoryid: r.item_category_id,
                        categoryname: r.category_name,
                        uom: r.uom_name,
                        uomid: r.uom_id,
                        currentstock: r.current_stock ?? 0,
                        bufferqty: Number(r.current_stock - r.available_qty) ?? 0,
                        requestedqty: r.requested_qty ?? 0,
                        issueqty: 0, // user enters actual issue qty here — indent's issue_qty is a plan, not the real issue
                        balance: r.requested_qty ?? 0,
                        availableqty: r.available_qty ?? 0,
                        remarks: r.detail_remarks ?? '',
                        rate: r.rate ?? 0, // ⚠️ not present in this response
                        amount: 0,
                        indentdetailid: r.indent_detail_id ?? null
                    };
                });
        });
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

    // ── MIN dropdown: load a submitted MIN back into the form ──────────────
    // ── MIN dropdown: load a submitted MIN back into the form ──────────────
    onMINSelect(event: any): void {
        if (!event.value) return;

        const payload = {
            p_returntype: 'MINDETAILS',
            p_returnvalue: event.value,
            p_username: this.authService.isLogIntType().companyid.toString()
        };

        this.inventoryService.Getreturndropdowndetails(payload).subscribe((res) => {
            const rows: any[] = res.data ?? [];
            if (!rows.length) return;

            const header = rows[0];
            this.editingMinId = header.min_id ?? null;
            
            this.minForm.patchValue({
                p_issuedate: header.issue_date ? new Date(header.issue_date) : null,
                p_project: header.project_id ?? null,
                p_requestedby: header.requested_by != null ? Number(header.requested_by) : null,
                p_remarks: header.remarks ?? '',
                status: header.status ?? '',
                p_indent: header.indent_id
            });
            
            // Tower needs towerOptions populated first
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

                        this.minForm.patchValue({ p_tower: towerId });

                        if (towerId) {
                            this.levelOptions = this.workList
                                .filter((work) => work.tower_block_id === towerId)
                                .reduce((levels: any[], work) => {
                                    if (!levels.some((level) => level.value === work.level_name)) levels.push({ label: work.level_name, value: work.level_name });
                                    return levels;
                                }, []);

                            // Pour options too, then patch level & pour once options exist
                            this.pourOptions = this.workList
                                .filter((work) => work.tower_block_id === towerId && work.level_name === header.level_name)
                                .reduce((pours: any[], work) => {
                                    if (!pours.some((pour) => pour.value === work.pour_name)) pours.push({ label: work.pour_name, value: work.pour_name });
                                    return pours;
                                }, []);

                            this.minForm.patchValue({
                                p_level: header.level_name ?? null,
                                p_pour: header.pour_name ?? null
                            });
                        }
                    },
                    error: (err) => console.error(err)
                });
            }

            // ── Patch item rows from the flattened response ─────────────────────
            this.issueItems = rows
                .filter((r) => r.item_id != null)
                .map((r) => {
                    const requestedqty = r.requested_qty ?? 0;
                    const issueqty = r.issued_qty ?? 0;
                    return {
                        itemid: r.item_id,
                        itemcode: r.item_code ?? r.item_id,
                        itemname: r.item_name,
                        categoryid: r.item_category_id,
                        categoryname: r.category_name,
                        uom: r.uom_name,
                        uomid: r.uom_id,
                        currentstock: r.current_stock ?? 0,
                        availableqty: r.available_qty ?? 0,
                        bufferqty: Number(r.current_stock ?? 0) - Number(r.available_qty ?? 0),
                        reservedqty: r.reserved_qty ?? 0,
                        requestedqty,
                        issueqty,
                        balance: requestedqty - issueqty,
                        remarks: r.detail_remarks ?? '',
                        rate: r.rate ?? 0,
                        amount: r.amount ?? issueqty * (r.rate ?? 0),
                        mindetailid: r.min_detail_id ?? null
                    };
                });
        });
    }

    // ── Table qty logic ────────────────────────────────────────────────────
    onIssueQtyChange(item: any): void {
        const issued = Number(item.issueqty || 0);
        const available = Number(item.availableqty || 0);

        // Cap at available
        if (issued > available) {
            item.issueqty = available;
        }
        if (issued < 0) {
            item.issueqty = 0;
        }

        item.balance = Number(item.requestedqty || 0) - Number(item.issueqty || 0);
        item.amount = Number(item.issueqty || 0) * Number(item.rate || 0);
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

    // ── Totals ─────────────────────────────────────────────────────────────
    get totalRequestedQty(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.requestedqty) || 0), 0);
    }

    get totalIssueQty(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.issueqty) || 0), 0);
    }

    get totalBalance(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.balance) || 0), 0);
    }

    get totalIssueValue(): number {
        return this.issueItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    }

    // ── Submit ─────────────────────────────────────────────────────────────
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

    private determineActionStatus(): 'PARTIALLY ISSUED' | 'FULLY ISSUED' {
        const totalRequested = this.totalRequestedQty;
        const totalBalance = this.totalBalance;

        return totalBalance <= 0 ? 'FULLY ISSUED' : 'PARTIALLY ISSUED';
    }

    private saveMIN(): void {
        const formVal = this.minForm.getRawValue();
        const isEdit = this.editingMinId != null;
        const actionStatus = this.determineActionStatus();

        const itemsPayload = this.issueItems.map((it) => ({
            item_category_id: it['categoryid'] ?? null,
            item_id: it.itemid,
            uom_id: it['uomid'] ?? null,
            current_stock: it.currentstock,
            reserved_qty: it.reservedqty,
            available_qty: it.availableqty,
            requested_qty: it.requestedqty,
            issued_qty: it.issueqty,
            balance_qty: it.balance,
            rate: 0,
            amount: 0,
            remarks: ''
        }));

        const payload: MaterialIssue = {
            p_action: actionStatus,
            p_operation: isEdit ? 'UPDATE' : 'INSERT',
            p_min_id: isEdit ? this.editingMinId : null,
            p_indent_id: formVal.p_indent,
            p_issue_date: this.datePipe.transform(formVal.p_issuedate, 'yyyy-MM-dd'),
            p_company_id: Number(this.companyId),
            p_project_id: formVal.p_project,
            p_tower_block_id: formVal.p_tower,
            p_level_name: formVal.p_level,
            p_pour_name: formVal.p_pour,
            p_requested_by: formVal.p_requestedby,
            p_issued_by: Number(this.userId),
            p_remarks: formVal.p_remarks,
            p_items_json: itemsPayload,
            p_loginuser: Number(this.userId)
        };

        this.workService.upsertMaterialIssue(payload).subscribe({
            next: (res: any) => {
                const minno = res?.data?.minno ?? res?.data; // adjust based on actual return shape of fn_upsert_material_issue
                if (res.data.success) {
                    this.messageService.add({
                        severity: 'success',
                        summary: res.data.status,
                        detail: res.data.msg
                    });
                    this.minForm.patchValue({ p_issueno: res.data.min_no, status: res.data.status });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.data.msg
                    });
                }
                this.loadMINList();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save Material Issue Note. Please try again.',
                    life: 3000
                });
                console.error(err);
            }
        });
    }

    // ── Reset ──────────────────────────────────────────────────────────────
    onReset(): void {
        const currentUser = this.authService.isLogIntType()?.username || 'Current User';
        this.minForm.reset({ p_issuedate: this.today });
        this.minForm.patchValue({ p_issuedby: currentUser });
        this.issueItems = [];
    }
}
