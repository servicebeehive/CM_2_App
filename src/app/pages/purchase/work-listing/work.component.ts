import { UpserWorkList } from '@/core/models/authmodel/work.model';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { WorkService } from '@/core/services/work.service';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
@Component({
    selector: 'app-work',
    imports: [CommonModule, ReactiveFormsModule, FormsModule, TableModule, InputTextModule, ButtonModule, DropdownModule, DialogModule, ConfirmDialogModule, CheckboxModule, TooltipModule, GlobalFilterComponent, ToastModule],
    templateUrl: './work.component.html',
    styleUrls: ['./work.component.scss'],
    providers: [ConfirmationService]
})
export class WorkComponent implements OnInit {
    showGlobalSearch = true;
    globalFilter = '';
    workList: any[] = [];
    filterWorkList: any[] = [];
    editingIndex = -1;
    editingWorkerId:number = 0;

    salesForm!: FormGroup;
    towerOptions = [];
    projectOptions = [];

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private workService: WorkService,
        private authService: AuthService,
        private inventoryService: InventoryService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.salesForm = this.fb.group({
            p_project: [null, Validators.required],
            p_tower: [null, Validators.required],
            p_level: [null, Validators.required],
            p_pour: [null, Validators.required]
        });
        this.loadAllDropdown();
    }

    loadAllDropdown(): void {
        this.loadWorkList();
        this.loadProject();
    }

    loadWorkList(): void {
        const companyId = this.authService.isLogIntType().companyid.toString();
        const userId = this.authService.isLogIntType().userid.toString();
        const payload = {
           p_returntype: 'WORKLIST',
           p_returnvalue: companyId,
           username: userId
        };
       
        this.inventoryService.Getreturndropdowndetails(payload).subscribe({
            next: (res) => {
                this.filterWorkList = res.data;
                this.workList = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    loadProject(): void {
        const companyId = this.authService.isLogIntType().companyid.toString();
        const payload = {
            returnType : 'ACTIVEPROJECT',
            returnValue : '',
            username: '',
            option1: companyId,
            option2: null
        }
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                this.projectOptions = res.data;
            },
            error: (err) => console.error(err)
        });
    }

    loadTower(data:any, patchTowerId?: any): void {
        const companyId = this.authService.isLogIntType().companyid.toString();

        const payload = {
            returnType : 'ALLTOWER',
            returnValue : data.value,
            username: '',
            option1: companyId,
            option2: null
        }
        this.inventoryService.getparameterbased(payload).subscribe({
            next: (res) => {
                this.towerOptions = res.data;
                 if (patchTowerId != null) {
                this.salesForm.patchValue({ p_tower: patchTowerId });
            }
            },
            error: (err) => console.error(err)
        });
    }

    get isEditing(): boolean {
        return this.editingIndex !== -1;
    }

    // ── Add ────────────────────────────────────────────────────────────────
    add(): void {
        this.salesForm.markAllAsTouched();
        if (this.salesForm.invalid) return;
        const userid = this.authService.isLogIntType().userid;
        const v = this.salesForm.value;
        
        const payload: UpserWorkList = {
            p_work_id: this.isEditing ? this.editingWorkerId : 0,
            p_project_id: v.p_project,
            p_tower_block_id: v.p_tower,
            p_level_name: v.p_level,
            p_pour_name: v.p_pour,
            p_user_id: userid,
            p_isactive: 'Y',
            p_status: ''
        };

        this.workService.upsertWorkListing(payload).subscribe({
            next: (res) => {
                if(res.status === 'success'){
                     this.showSuccess( 'success', "Success", res.data.message)
                }else{
                    this.showSuccess(  'success', "Failed", res.data.message )
                }
               
                this.loadWorkList();
                this.editingIndex=-1;
                this.editingWorkerId = 0;
                this.resetForm();
            },
            error: (err) => {
                console.error('Upsert failed', err);
            }
        });

        this.resetForm();
    }
    get allCompleted(): boolean {
        return this.workList.length > 0 && this.workList.every((r) => r.completed);
    }

    get someCompleted(): boolean {
        return this.workList.some((r) => r.completed);
    }

    // ── Edit (loads into top form) ───────────────────────────────────────
      startEdit(index: number): void {
    this.editingIndex = index;
    const row = this.workList[index];
    if (!row) return;
    this.editingWorkerId = row.work_id;
    this.salesForm.patchValue({
        p_project: row.project_id,
        p_level: row.level_name,
        p_pour: row.pour_name
    });
this.loadTower({ value: row.project_id }, row.tower_block_id);
    }

    cancelEdit(): void {
        this.editingIndex = -1;
        this.resetForm();
    }

    // ── Delete ─────────────────────────────────────────────────────────────
   removeItem(index: number): void {
    this.confirmationService.confirm({
        message: 'Are you sure you want to delete this row?',
        header: 'Confirm Delete',
        acceptLabel: 'Yes',
        rejectLabel: 'Cancel',
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-secondary',
        accept: () => {
            this.workList.splice(index, 1);
            this.filterWorkList = [...this.workList];
            if (this.editingIndex === index) {
                this.editingIndex = -1;
                this.resetForm();
            }
        }
    });
}

    // Toggle all checkboxes
    toggleAll(checked: boolean): void {
        this.workList.forEach((r) => (r.completed = checked));
        this.filterWorkList = [...this.workList];
    }

    // Single row toggle
    onCompletedChange(index: number): void {
        this.filterWorkList = [...this.workList];
    }

    // ── Filter ─────────────────────────────────────────────────────────────
    applyGlobalFilter(): void {
        const val = this.globalFilter?.toLowerCase().trim();
        if (!val) {
            this.filterWorkList = [...this.workList];
            return;
        }
        this.filterWorkList = this.workList.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(val)));
    }

    // ── Reset ──────────────────────────────────────────────────────────────
    onReset(): void {
        this.resetForm();
        this.filterWorkList = [...this.workList];
    }

    private resetForm(): void {
      this.salesForm.reset();
    this.editingIndex = -1;
    this.editingWorkerId = 0;
        this.salesForm.markAsUntouched();
        this.salesForm.markAsPristine();
    }

    showSuccess(severity: string, summary: string, message: string) {
        this.messageService.add({ severity: severity , summary: summary, detail: message });
    }
}
