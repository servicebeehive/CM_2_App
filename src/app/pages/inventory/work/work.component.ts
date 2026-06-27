import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

export interface WorkRow {
    project:   string;
    tower:     string;
    level:     string;
    pour:      string;
    completed: boolean;
}

@Component({
    selector: 'app-work',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        DropdownModule,
        DialogModule,
        ConfirmDialogModule,
        CheckboxModule,
        TooltipModule,
        GlobalFilterComponent
    ],
    templateUrl: './work.component.html',
    styleUrls: ['./work.component.scss'],
    providers: [ConfirmationService]
})
export class WorkComponent implements OnInit {

    showGlobalSearch = true;
    globalFilter     = '';

    workList:       WorkRow[] = [];
    filterWorkList: WorkRow[] = [];

    // Index of row being edited (-1 = none)
    editingIndex = -1;

    salesForm!: FormGroup;
    editForm!:  FormGroup;

    projectOptions = [
        { label: 'Project A', value: 'Project A' },
        { label: 'Project B', value: 'Project B' },
        { label: 'Project C', value: 'Project C' }
    ];

    towerOptions = [
        { label: 'Tower A', value: 'Tower A' },
        { label: 'Tower B', value: 'Tower B' },
        { label: 'Block C', value: 'Block C' }
    ];

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.salesForm = this.fb.group({
            p_project: [null, Validators.required],
            p_tower:   [null, Validators.required],
            p_level:   [null, Validators.required],
            p_pour:    [null, Validators.required]
        });

        this.editForm = this.fb.group({
            p_project: [null, Validators.required],
            p_tower:   [null, Validators.required],
            p_level:   [null, Validators.required],
            p_pour:    [null, Validators.required]
        });

        this.filterWorkList = [...this.workList];
    }

    // ── Add ────────────────────────────────────────────────────────────────
   add(): void {
    this.salesForm.markAllAsTouched();
    if (this.salesForm.invalid) return;

    const v = this.salesForm.value;
    this.workList.push({
        project:   v.p_project,
        tower:     v.p_tower,
        level:     v.p_level,
        pour:      v.p_pour,
        completed: false
    });
    this.filterWorkList = [...this.workList];

    this.salesForm.patchValue({
        p_project: null,
        p_tower:   null,
        p_level:   null,
        p_pour:    null
    });
    // Reset touched state so validation clears
    this.salesForm.markAsUntouched();
    this.salesForm.markAsPristine();
}

    get allCompleted(): boolean {
    return this.workList.length > 0 && this.workList.every(r => r.completed);
}

get someCompleted(): boolean {
    return this.workList.some(r => r.completed);
}

    // ── Edit ───────────────────────────────────────────────────────────────
    startEdit(index: number): void {
        this.editingIndex = index;
        const row = this.workList[index];
        this.editForm.patchValue({
            p_project: row.project,
            p_tower:   row.tower,
            p_level:   row.level,
            p_pour:    row.pour
        });
    }

    saveEdit(index: number): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }
        const v = this.editForm.value;
        this.workList[index] = {
            project: v.p_project,
            tower:   v.p_tower,
            level:   v.p_level,
            pour:    v.p_pour,
            completed: v.completed
        };
        this.filterWorkList = [...this.workList];
        this.editingIndex   = -1;
    }

    cancelEdit(): void {
        this.editingIndex = -1;
    }

    // ── Delete ─────────────────────────────────────────────────────────────
    removeItem(index: number): void {
        this.confirmationService.confirm({
            message:                'Are you sure you want to delete this row?',
            header:                 'Confirm Delete',
            acceptLabel:            'Yes',
            rejectLabel:            'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
                this.workList.splice(index, 1);
                this.filterWorkList = [...this.workList];
                if (this.editingIndex === index) this.editingIndex = -1;
            }
        });
    }

    // ── Submit ─────────────────────────────────────────────────────────────
   onSubmit(): void {
    if (this.workList.length === 0) {
        // optionally show a message
        return;
    }
    this.confirmationService.confirm({
        message:                'Are you sure you want to submit?',
        header:                 'Confirm',
        acceptLabel:            'Yes',
        rejectLabel:            'Cancel',
        acceptButtonStyleClass: 'p-button-primary',
        rejectButtonStyleClass: 'p-button-secondary',
        accept: () => {
            console.log('Submitted:', this.workList);
        }
    });
}

// Toggle all checkboxes
toggleAll(checked: boolean): void {
    this.workList.forEach(r => r.completed = checked);
    this.filterWorkList = [...this.workList];
}

// Single row toggle
onCompletedChange(index: number): void {
    // triggers re-evaluation of allCompleted getter
    this.filterWorkList = [...this.workList];
}

    // ── Filter ─────────────────────────────────────────────────────────────
    applyGlobalFilter(): void {
        const val = this.globalFilter?.toLowerCase().trim();
        if (!val) {
            this.filterWorkList = [...this.workList];
            return;
        }
        this.filterWorkList = this.workList.filter(row =>
            Object.values(row).some(v => String(v).toLowerCase().includes(val))
        );
    }

    // ── Reset ──────────────────────────────────────────────────────────────
    onReset(): void {
        this.salesForm.patchValue({
            p_project: null,
            p_tower:   null,
            p_level:   null,
            p_pour:    null
        });
        this.editingIndex   = -1;
        this.filterWorkList = [...this.workList];
    }
}