import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardService } from '@/core/services/dashboard.service';
import { AuthService } from '@/core/services/auth.service';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule, KnobModule, FormsModule ,RouterModule],
    template: ` 
    <div 
        class="col-span-12 md:col-span-6 xl:col-span-3" 
        *ngFor="let card of dashboardCards"
        [routerLink]="card.routerLink"
        style="cursor: pointer;"
    >
        <div class="card h-full">
            
            <span class="font-semibold text-lg flex items-center gap-2">
                <i [class]="card.icon + ' text-2xl text-primary'"></i>
                {{ card.label }}
            </span>

            <div class="flex justify-between items-start mt-4">
                <div class="w-6/12">
                   <span 
    class="text-4xl font-bold"
    [ngClass]="card.value < 0 ? 'text-red-600' : 'text-surface-900 dark:text-surface-0'"
>
                        {{'₹'+ card.value }}
                    </span>
                </div>
            </div>

        </div>
    </div>

`,
    host: {
        '[style.display]': '"contents"'
    }
})
export class StatsWidget implements OnInit {
     public authService = inject(AuthService);
    public getUserDetails = {
    "uname": "admin",
    "p_loginuser": "admin",
    "clientcode": "CG01-SE",
    "x-access-token": this.authService.getToken(),
  };
    knobValue: number = 80;
     dashboardCards:any= [];
  constructor(private OnttopBarService:DashboardService){}
  ngOnInit(): void {
      this.OnGettopBarCard()
  }

  OnGettopBarCard(){
   let  apibody={
    ...this.getUserDetails,
    "p_reporttype": "CARDS",
   "p_warehouse":"",
   "p_period":"MONTH",
   "p_category":null,
   "p_item":null,

   }
    this.OnttopBarService.GettopBarCard(apibody).subscribe({
        next:(res)=>{
            console.log(res)
            const data=res.data[0]
           this.dashboardCards=[
    {
      label: 'Total Purchase',
      icon: 'pi pi-box',
      value:data.totalpurchase,
      routerLink: '/layout/inventory/overview'
    },
  
    {
      label: 'Total Sale',
      icon: 'pi pi-shopping-cart',
      value:data.totalsale,
      routerLink: '/layout/pos/sales'
    },
      {
      label: 'Total Return',
      icon: 'pi pi-arrow-down-left',
      value:data.totalreturn,
      routerLink: '/layout/inventory/stock-in'
    },
       {
      label: 'Total Profit',
      icon: 'pi pi-arrow-up',
      
      value:data.profit,
      routerLink: '/layout/inventory/stock-in'
    },
    
  ];
        },
        error:(error)=>{

        }
    })
  }
}
