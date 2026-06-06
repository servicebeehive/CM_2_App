import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { InputText } from 'primeng/inputtext';

@Component({
    selector: 'app-global-filter',
    imports: [FormsModule, InputText],
template: `
    <div class="relative w-full mb-4">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"></i>
        <input type="text" pInputText
               [placeholder]="placeholder"
               [ngModel]="value"
               (input)="onInput($event)"
               class="w-full p-inputtext-sm"
               style="padding-left: 2rem !important" />
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

    onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.inputSubject.next(val);  
}
}
