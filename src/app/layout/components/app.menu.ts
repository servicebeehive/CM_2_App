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
        const level0Items = flatData.filter((d) => d.level === 0);

        const headerNameToId = new Map<string, number>();
        level0Items.forEach((d) => {
            headerNameToId.set((d.access_name || '').trim().toLowerCase(), d.permissionid);
        });

        const childrenByHeaderId = new Map<number, Set<string>>();
        flatData
            .filter((d) => d.level !== 0)
            .forEach((d) => {
                if (!childrenByHeaderId.has(d.level)) {
                    childrenByHeaderId.set(d.level, new Set());
                }
                childrenByHeaderId.get(d.level)!.add((d.access_name || '').trim().toLowerCase());
            });

        const allowedHeaderNames = new Set(headerNameToId.keys());

        return menuItems
            .map((item) => {
                const keys: string[] = Array.isArray(item.accessKey) ? item.accessKey : [item.accessKey];
                const matchedKey = keys.find((k) => allowedHeaderNames.has((k || '').trim().toLowerCase()));

                if (!matchedKey) return null; 

                const headerId = headerNameToId.get(matchedKey.trim().toLowerCase())!;
                const allowedChildren = childrenByHeaderId.get(headerId) ?? new Set<string>();

                const filteredItems = this.filterLeafItems(item.items, allowedChildren);

                return { ...item, items: filteredItems };
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