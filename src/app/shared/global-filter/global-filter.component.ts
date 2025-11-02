import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-global-filter',
  imports: [FormsModule],
  templateUrl: './global-filter.component.html',
  styleUrl: './global-filter.component.scss'
})
export class GlobalFilterComponent {
@Input() placeholder:string='Search...';
@Input() value:string='';
@Output() valueChange=new EventEmitter<string>();

  private inputSubject = new Subject<string>();

  constructor() {
    // Debounce input changes by 300ms for better performance
    this.inputSubject.pipe(debounceTime(300)).subscribe((val) => {
      this.valueChange.emit(val);
    });
  }
  
onInput(event:any){
  const inputValue=event.target.value;
  this.value=inputValue;
  this.inputSubject.next(inputValue);
}

}
