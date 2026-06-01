import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';



@Component({
  selector: 'app-rented',
  imports:[CommonModule,
       ],
  templateUrl: './rented.component.html',
  styleUrls: ['./rented.component.scss'],
})
export class RentedComponent  implements OnInit {

  // rentForm!:FormGroup;
purchaseIdOptions:any[]=[]
vendorOptions:any[]=[]
itemOptionslist:any[]=[]
  constructor(
   
  ) { }

  ngOnInit() {
   
  }

  purchaseIdDetails(event:any){

  }
  onSubmit(){

  }

}
