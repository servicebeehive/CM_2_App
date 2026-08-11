import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { Landing } from '@/pages/landing/landing';
import { Notfound } from '@/pages/notfound/notfound';
import { AuthGuard } from '@/core/guards/auth.guard';
import { RoleGaurd } from '@/core/guards/role.guard';


export const appRoutes: Routes = [
    {
        path: 'layout',
        component: AppLayout,
        children: [
             {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./app/pages/dashboards/ecommercedashboard').then((c) => c.EcommerceDashboard),
                canActivate:[AuthGuard],
                data: { breadcrumb: 'Dashboard',expectedRole:'admin'},
            },
              
            // {
            //     path: 'dashboard-banking',
            //     loadComponent: () => import('./app/pages/dashboards/bankingdashboard').then(c => c.BankingDashboard),
            //     data: { breadcrumb: 'Banking Dashboard' },
            // },
            // {
            //     path: 'uikit',
            //     data: { breadcrumb: 'UI Kit' },
            //     loadChildren: () => import('@/pages/uikit/uikit.routes'),
            // },
            // {
            //     path: 'documentation',
            //     data: { breadcrumb: 'Documentation' },
            //     loadComponent: () => import('./app/pages/documentation/documentation').then(c => c.Documentation)
            // },

            {
                path: 'products',
                loadChildren: () => import('@/pages/products/product.routers'),
                canActivate: [AuthGuard]
            },
            {
                path: 'inventory',
                loadChildren: () => import('@/pages/inventory/inventory.routers'),
                canActivate: [AuthGuard]
            },
             {
                path: 'purchase',
                loadChildren: () => import('@/pages/purchase/purchase.routers'),
                canActivate: [AuthGuard]
            },
            {
                path: 'issue-item',
                loadChildren: () => import('@/pages/issue-item/issue-item.routers'),
                canActivate: [AuthGuard]
            },
            {
                path: 'pos',
                loadChildren: () => import('@/pages/pos/pos.routers'),
                canActivate: [AuthGuard]
            },
            {
                path: 'reports',
                loadChildren: () => import('@/pages/reports/reports.router'),
                canActivate: [AuthGuard]
            },

            {
                path: 'settings',
                loadChildren: () => import('@/pages/settings/settings.routers'),
                canActivate: [AuthGuard]
            },
             {
                path: 'security',
                loadChildren: () => import('@/pages/security/security.routers'),
                canActivate: [AuthGuard]
            }
        ]
    },
    //  { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    {
        path: '',
        loadChildren: () => import('@/pages/auth/auth.routes'),
    },
    { path: '**', redirectTo: '/notfound' }
];
