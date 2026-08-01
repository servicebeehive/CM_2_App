import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from '@/core/services/inventory.service';
import { DropdownParamter } from '@/core/models/inventory.model';
import { MENU_MODEL } from '@/core/config/menu.config';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
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
    industryType = '';
    public role: string = '';

    constructor(
        private authService: AuthService,
        private inventoryService: InventoryService
    ) {}

    ngOnInit() {
        this.industryType = this.authService.isLogIntType()?.industry_type_id.toString();

        const industryMenuPayload = {
            p_returntype: 'ALLMENUINDUSTRY',
            p_returnvalue: '',
            p_username: this.industryType
        };

        this.inventoryService.Getreturndropdowndetails(industryMenuPayload).subscribe({
            next: (res) => {
                const data = res?.data || [];
                this.model = this.buildFilteredMenu(MENU_MODEL, data);
            },
            error: () => {
                this.model = MENU_MODEL;
            }
        });
    }
private buildFilteredMenu(menuItems: any[], flatData: any[]): any[] {
    const childrenByCategory = new Map<string, Set<string>>();
    const categoryByLevel = new Map<number, string>();

    // First pass: infer category per level from well-formed rows (handles bad access_desc rows)
    flatData.forEach((d) => {
        const desc = (d.access_desc || '').trim();
        if (desc.includes(' - ')) {
            const category = desc.split(' - ')[0].trim().toLowerCase();
            if (!categoryByLevel.has(d.level)) {
                categoryByLevel.set(d.level, category);
            }
        }
    });

    flatData.forEach((d) => {
        const desc = (d.access_desc || '').trim();
        const childName = (d.access_name || '').trim().toLowerCase();
        if (!childName) return;

        const category = desc.includes(' - ')
            ? desc.split(' - ')[0].trim().toLowerCase()
            : categoryByLevel.get(d.level) ?? '';

        if (!category) return;

        if (!childrenByCategory.has(category)) {
            childrenByCategory.set(category, new Set());
        }
        childrenByCategory.get(category)!.add(childName);
    });

    return menuItems
        .map((item) => {
            const keys: string[] = Array.isArray(item.accessKey) ? item.accessKey : [item.accessKey];
            const matchedKey = keys.find((k) => childrenByCategory.has((k || '').trim().toLowerCase()));

            if (!matchedKey) return null;

            const allowedChildren = childrenByCategory.get(matchedKey.trim().toLowerCase()) ?? new Set<string>();
            const filteredItems = this.filterLeafItems(item.items, allowedChildren);

            return filteredItems.length > 0 ? { ...item, items: filteredItems } : null;
        })
        .filter(Boolean);
}

private filterLeafItems(items: any[] = [], allowedChildrenLower: Set<string>): any[] {
    return items
        .map((item) => {
            if (item.items?.length > 0) {
                const children = this.filterLeafItems(item.items, allowedChildrenLower);
                return children.length > 0 ? { ...item, items: children } : null;
            }
            return allowedChildrenLower.has((item.label || '').trim().toLowerCase()) ? item : null;
        })
        .filter(Boolean);
}
}