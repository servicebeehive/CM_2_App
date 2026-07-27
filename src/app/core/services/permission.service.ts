// permission.service.ts
import { Injectable } from '@angular/core';
import { forkJoin, Observable, BehaviorSubject } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { AuthService } from '@/core/services/auth.service';
import { InventoryService } from './inventory.service';
import { DropdownParamter } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {

    private permissionsCache$: Observable<string[]> | null = null;
    private loadedPermissions: string[] | null = null;

    constructor(
        private inventoryService: InventoryService,
        private authService: AuthService
    ) {}

    getAllowedPermissions(): Observable<string[]> {
        if (this.permissionsCache$) return this.permissionsCache$;
        
        const userType = this.authService.isLogIntType().permissiontype;
        const companyId = this.authService.isLogIntType()?.companyid.toString();
        const allPermissionPayload = {
            p_returntype: 'ACCESSPERMISSION', p_returnvalue: 'W', p_username: companyId
        };
        const accessControlPayload = {
            p_returntype: 'ACCESSCONTROL', p_returnvalue: userType, p_username: companyId
        };

        this.permissionsCache$ = forkJoin({
            allPermissions: this.inventoryService.Getreturndropdowndetails(allPermissionPayload),
            userAccess: this.inventoryService.Getreturndropdowndetails(accessControlPayload)
        }).pipe(
            map(({ allPermissions, userAccess }) => {
                const excluded = new Set(
                    userAccess.data
                        .filter((i: any) => i.permission_type === 'W')
                        .map((i: any) => i.access_name)
                );
                return allPermissions.data
                    .filter((i: any) => !excluded.has(i.access_name))
                    .map((i: any) => i.access_name);
            }),
            tap(permissions => this.loadedPermissions = permissions), // store sync snapshot
            shareReplay(1)
        );

        return this.permissionsCache$;
    }

    clearCache(): void {
        this.permissionsCache$ = null;
        this.loadedPermissions = null;
    }
}