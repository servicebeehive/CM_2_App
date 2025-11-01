import { Component, computed } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { BadgeModule } from 'primeng/badge';
import { LayoutService } from '@/layout/service/layout.service';
import { AuthService } from '@/core/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: '[app-profilesidebar]',
    imports: [
        ButtonModule,
        DrawerModule,
        BadgeModule,
    ],
    template: `
        <p-drawer
            [visible]="visible()"
            (onHide)="onDrawerHide()"
            position="right"
            [transitionOptions]="'.3s cubic-bezier(0, 0, 0.2, 1)'"
            styleClass="layout-profile-sidebar w-full sm:w-25rem"
        >
            <div class="flex flex-col mx-auto md:mx-0">
                <span class="mb-2 font-semibold">Welcome</span>
                <span
                    class="text-surface-500 dark:text-surface-400 font-medium mb-8"
                    >Arushi</span
                >

                <ul class="list-none m-0 p-0">
                    <li>
                        <a
                            class="cursor-pointer flex mb-4 p-4 items-center border border-surface-200 dark:border-surface-700 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150"
                        >
                            <span>
                                <i class="pi pi-user text-xl text-primary"></i>
                            </span>
                            <div class="ml-4">
                                <span class="mb-2 font-semibold">Profile</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a
                            class="cursor-pointer flex mb-4 p-4 items-center border border-surface-200 dark:border-surface-700 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150"
                        >
                            <span>
                                <i class="pi pi-cog text-xl text-primary"></i>
                            </span>
                            <div class="ml-4">
                                <span class="mb-2 font-semibold">Settings</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a (click)="LogOut()"
                            class="cursor-pointer flex mb-4 p-4 items-center border border-surface-200 dark:border-surface-700 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150"
                        >
                            <span>
                                <i
                                    class="pi pi-power-off text-xl text-primary"
                                ></i>
                            </span>
                            <div class="ml-4">
                                <span class="mb-2 font-semibold">Sign Out</span>
                            </div>
                        </a>
                    </li>
                </ul>
            </div>




        </p-drawer>
    `,
})
export class AppProfileSidebar {
    constructor(public layoutService: LayoutService,public authservice:AuthService, public router:Router) {}

    visible = computed(
        () => this.layoutService.layoutState().profileSidebarVisible,
    );
LogOut(){
    this.authservice.clearToken()
    this.router.navigate([''])
}
    onDrawerHide() {
        this.layoutService.layoutState.update((state) => ({
            ...state,
            profileSidebarVisible: false,
        }));
    }
}
