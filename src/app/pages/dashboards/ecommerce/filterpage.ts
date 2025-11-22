import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { SelectModule } from 'primeng/select';

@Component({
    standalone: true,
    selector: 'app-filter-page',
    imports: [DropdownModule, ReactiveFormsModule,FormsModule],
    template: `
      <div class="grid grid-cols-12 gap-8 w-full">

            <!-- 1st Filter Card -->
            <div class="col-span-12 md:col-span-6 xl:col-span-3">
                <div class="card h-full flex items-center justify-center p-4">
                    <p-dropdown 
                        [options]="warehouseOptions" 
                        [(ngModel)] ="selectedFilter1" 
                        class="w-full"
                        optionLabel="label"
                        placeholder="Warehouse">
                    </p-dropdown>
                </div>
            </div>

            <!-- 2nd Filter Card -->
            <div class="col-span-12 md:col-span-6 xl:col-span-3">
                <div class="card h-full flex items-center justify-center p-4">
                    <p-dropdown 
                        [options]="periodOptions" 
                        [(ngModel)]="selectedFilter2" 
                        class="w-full"
                        optionLabel="label"
                        placeholder="Period">
                    </p-dropdown>
                </div>
            </div>

            <!-- Category Filter Card -->
            <div class="col-span-12 md:col-span-6 xl:col-span-3">
                <div class="card h-full flex items-center justify-center p-4">
                    <p-dropdown 
                        [options]="categoryOptions" 
                        [(ngModel)]="category" 
                        class="w-full"
                        filter="true"
                        [showClear]="true"
                        optionLabel="fieldname"
                        optionValue="fieldid"
                        placeholder="Category">
                    </p-dropdown>
                </div>
            </div>

            <!-- Item Filter Card -->
            <div class="col-span-12 md:col-span-6 xl:col-span-3">
                <div class="card h-full flex items-center justify-center p-4">
                    <p-dropdown 
                        [options]="itemOptions" 
                        [(ngModel)]="item" 
                        class="w-full"
                        optionLabel="itemname"
                        optionValue="itemid"
                        placeholder="Item">
                    </p-dropdown>
                </div>
            </div>

        </div>
    `
})
export class FilterPage {
    // Filter 1 Options (Weeks)
    warehouseOptions: any[] = [
        { label: 'Warehouse 1' },
        { label: 'Warehouse 2' },
    ];
    
    // Filter 2 Options (Months)
    periodOptions: any[] = [
        { label: 'Weekly' },
        { label: 'Monthly' },
        { label: 'Quaterly' },
        { label: 'Yearly' },
    ];
    
    // Filter 3 Options (Categories)
     categoryOptions = [];
    
    // Filter 4 Options (Status)
    itemOptions = [];

    selectedFilter1: any;
    selectedFilter2: any;
    category: any;
    item: any;

    ngOnInit() {
        this.loadAllDropdowns();
    }
    constructor( private stockInService:InventoryService, private authService:AuthService){}
    onFilterChange() {
        // Handle filter changes here
    }
     createDropdownPayload(returnType: string) {
        return {
            uname: 'admin',
            p_username: 'admin',
            p_returntype: returnType,
            clientcode: 'CG01-SE',
            'x-access-token': this.authService.getToken()
        };
    }
     OnGetItem() {
    const payload = this.createDropdownPayload("ITEM");
    this.stockInService.getdropdowndetails(payload).subscribe({
      next: (res) => this.itemOptions = res.data,
      error: (err) => console.log(err)
    });
  }
   OnGetCategory() {
        const payload = this.createDropdownPayload('CATEGORY');
        this.stockInService.getdropdowndetails(payload).subscribe({
            next: (res) => (this.categoryOptions = res.data),
            error: (err) => console.log(err)
        });
    } 

    loadAllDropdowns() {
    this.OnGetItem();
    this.OnGetCategory();
  }
}