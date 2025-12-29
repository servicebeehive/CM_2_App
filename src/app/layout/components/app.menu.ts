import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/core/services/auth.service';
import { ADMIN_MENU_MODEL, SALES_MANAGER_MENU_MODEL, SALES_REP_MENU_MODEL, STORE_OWNER_MENU_MODEL } from '@/core/config/menu.config';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule,],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li
                app-menuitem
                *ngIf="!item.separator"
                [item]="item"
                [index]="i"
                [root]="true"
            ></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `,
})
export class AppMenu {
    model: any[] = [];
    public role:string=''
    constructor(public userservice:AuthService){
      
    }

    ngOnInit() {

       const userType:any = this.userservice.isLogIntType();  
      this.role=userType.usertypecode
  console.log("User Type:", userType);

  if (this.role === 'Admin') {
    this.model = ADMIN_MENU_MODEL;
  } 
  else if (this.role === 'SalesManager') {
    this.model = SALES_MANAGER_MENU_MODEL;
  } 
  else if(this.role === 'StoreOwner'){
     this.model= STORE_OWNER_MENU_MODEL;
  }
  else {
    // default fallback
    this.model = SALES_REP_MENU_MODEL;
  }
    



    }
}
