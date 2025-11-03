import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { InputText } from 'primeng/inputtext';

@Component({
    selector: 'app-global-filter',
    imports: [FormsModule, InputText],
    template: `
        <div class="flex items-center gap-2 mb-4 w-full">
            <i class="pi pi -search text-gray-600"></i>
            <input type="text" pInputText [placeholder]="placeholder" [ngModel]="value" (input)="onInput($event)" class="w-full p-inputtext-sm" />
        </div>
    `,
    styleUrl: './global-filter.component.scss'
})
export class GlobalFilterComponent {
    @Input() placeholder: string = 'Search...';
    @Input() value: string = '';
    @Output() valueChange = new EventEmitter<string>();

    private inputSubject = new Subject<string>();

    constructor() {
        // Debounce input changes by 300ms for better performance
        this.inputSubject.pipe(debounceTime(300)).subscribe((val) => {
            this.valueChange.emit(val);
        });
    }

    onInput(event: any) {
        const inputValue = event.target.value;
        this.value = inputValue;
        this.inputSubject.next(inputValue);
        this.valueChange.emit(this.value);
    }
}
