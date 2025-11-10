import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { Landing } from '@/pages/landing/landing';
import { Notfound } from '@/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: 'layout',
        component: AppLayout,
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./app/pages/dashboards/ecommercedashboard').then(c => c.EcommerceDashboard),
                data: { breadcrumb: 'E-Commerce Dashboard' },
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
            },
             {
                path: 'inventory',
                loadChildren: () => import('@/pages/inventory/inventory.routers'),
            },
             {
                path: 'pos',
                loadChildren: () => import('@/pages/pos/pos.routers'),
            },
            {
                path:'reports',
                loadChildren:() => import('@/pages/reports/reports.router'),
            },

            {
                path:'settings',
                loadChildren:() => import('@/pages/settings/settings.routers'),
            },

            // {
            //     path: 'blocks',
            //     data: { breadcrumb: 'Free Blocks' },
            //     loadChildren: () => import('./app/pages/blocks/blocks.routes')
            // },
            // {
            //     path: 'ecommerce',
            //     loadChildren: () =>
            //         import('@/pages/ecommerce/ecommerce.routes'),
            //     data: { breadcrumb: 'E-Commerce' },
            // },
            // {
            //     path: 'profile',
            //     loadChildren: () => import('@/pages/usermanagement/usermanagement.routes'),
            // },
        ],
    },
  //  { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    {
        path: '',
        loadChildren: () => import('@/pages/auth/auth.routes'),
    },
    { path: '**', redirectTo: '/notfound' },
];
