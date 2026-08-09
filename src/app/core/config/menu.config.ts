import { MenuItem } from 'primeng/api';

export const MENU_MODEL: any[] = [
    {
        label: 'DASHBOARD',
        icon: 'pi pi-home',
        accessKey: 'Dashboard',
        routerLink: ['/'],
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/layout/dashboard']
            },
            {
                label: 'Main Dashboard',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/layout/dashboard']
            }
        ]
    },
    {
        label: 'PURCHASE',
        icon: 'pi pi-chart-bar',
        accessKey: 'Purchase',
        items: [
            {
                label: 'Purchase Management',
                icon: 'pi pi-fw pi-shopping-cart',
                routerLink: ['/layout/inventory/overview'],
                items: [
                    {
                        label: 'Work Listing',
                        icon: 'pi pi-fw pi pi-sitemap',
                        routerLink: ['/layout/inventory/work']
                    },
                    {
                        label: 'Material Requisition',
                        icon: 'pi pi-fw pi pi-sparkles',
                        routerLink: ['/layout/inventory/material-forcasting']
                    },
                    {
                        label: 'Request For Quote',
                        icon: 'pi pi-fw pi pi-check-circle',
                        routerLink: ['/layout/purchase/rfq']
                    },
                     {
                        label: 'Vendor Comparison',
                        icon: 'pi pi-fw pi pi-truck',
                        routerLink: ['/layout/purchase/vendor-comparison']
                    },
                     {
                        label: 'Purchase Order',
                        icon: 'pi pi-fw pi pi-send',
                        routerLink: ['/layout/inventory/purchase-order']
                    }
                ]
            }
        ]
    },
    {
        label: 'INVENTORY',
        icon: 'pi pi-chart-bar',
        accessKey: 'Inventory',
        items: [
            {
                label: 'Inventory Management',
                icon: 'pi pi-fw pi-database',
                routerLink: ['/layout/inventory/overview'],
                items: [
                    {
                        label: 'Stock In',
                        icon: 'pi pi-fw pi-arrow-down-left',
                        routerLink: ['/layout/inventory/stock-in']
                    },
                    {
                        label: 'Stock Adjustment',
                        icon: 'pi pi-fw pi-wrench',
                        routerLink: ['/layout/inventory/stock-adjustment']
                    },
                    {
                        label: 'Transactions',
                        icon: 'pi pi-fw pi-history',
                        routerLink: ['/layout/inventory/transaction']
                    },
                    {
                        label: 'GRN',
                        icon: 'pi pi-fw pi-inbox',
                        routerLink: ['/layout/inventory/grn']
                    }
                ]
            }
        ]
    },
    {
        label: 'PRODUCTS',
        icon: 'pi pi-box',
        accessKey: 'Products',
        items: [
            {
                label: 'Product Management',
                icon: 'pi pi-fw pi-tags',
                routerLink: ['/layout/products/overview'],
                items: [
                    {
                        label: 'Item List',
                        icon: 'pi pi-fw pi-list-check',
                        routerLink: ['/layout/products/list']
                    }
                ]
            }
        ]
    },
    {
        label: 'POS',
        icon: 'pi pi-shopping-cart',
        accessKey: 'POS',
        items: [
            {
                label: 'POS',
                icon: 'pi pi-fw pi-desktop',
                routerLink: ['/layout/pos/overview'],
                items: [
                    {
                        label: 'Sales',
                        icon: 'pi pi-fw pi-dollar',
                        routerLink: ['/layout/pos/sales']
                    },
                    {
                        label: 'Return',
                        icon: 'pi pi-fw pi-arrow-left',
                        routerLink: ['/layout/pos/return']
                    },
                    {
                        label: 'Replace',
                        icon: 'pi pi-fw pi-arrow-right-arrow-left',
                        routerLink: ['/layout/pos/replace']
                    },
                    {
                        label: 'Invoice',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/pos/invoice']
                    },
                    {
                        label: 'Customer Due',
                        icon: 'pi pi-fw pi-money-bill',
                        routerLink: ['/layout/pos/customer-due']
                    },
                    {
                        label: 'Debit/Credit Link',
                        icon: 'pi pi-fw pi-credit-card',
                        routerLink: ['/layout/pos/credit-note']
                    }
                ]
            }
        ]
    },
    {
        label: 'Issue',
        icon: 'pi pi-shopping-cart',
        accessKey: 'Issue',
        items: [
            {
                label: 'Issue Item',
                icon: 'pi pi-fw pi-desktop',
                routerLink: ['/layout/pos/overview'],
                items: [
                    {
                        label: 'Material Issue',
                        icon: 'pi pi-fw pi-arrow-right-arrow-left',
                        routerLink: ['/layout/inventory/material-issue']
                    },
                    {
                        label: 'Material Return',
                        icon: 'pi pi-fw pi-arrow-left',
                        routerLink: ['/layout/inventory/material-return']
                    },
                    {
                        label: 'Invoice',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/pos/invoice']
                    },
                    {
                        label: 'Debit/Credit Link',
                        icon: 'pi pi-fw pi-credit-card',
                        routerLink: ['/layout/pos/credit-note']
                    }
                ]
            }
        ]
    },
    {
        label: 'REPORTS',
        icon: 'pi pi-calculator',
        accessKey: 'Reports',
        items: [
            {
                label: 'Reports Center',
                icon: 'pi pi-fw pi-chart-bar',
                routerLink: ['/layout/reports/overview'],
                items: [
                    {
                        label: 'Item Report',
                        icon: 'pi pi-fw pi-box',
                        routerLink: ['/layout/reports/item-report']
                    },
                    {
                        label: 'Transaction Report',
                        icon: 'pi pi-fw pi-chart-line',
                        routerLink: ['/layout/reports/transaction-report']
                    },
                    {
                        label: 'P & L',
                        icon: 'pi pi-fw pi-chart-scatter',
                        routerLink: ['/layout/reports/balance-sheet']
                    }
                ]
            }
        ]
    },
    {
        label: 'SETTINGS',
        icon: 'pi pi-cog',
        accessKey: 'Settings',
        items: [
            {
                label: 'System Settings',
                icon: 'pi pi-fw pi-cog',
                routerLink: ['/layout/settings/overview'],
                items: [
                    {
                        label: 'UserType',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/settings/category-formate', 'usertype']
                    },
                    {
                        label: 'Site',
                        icon: 'pi pi-fw pi-file-edit',
                        routerLink: ['/layout/inventory/project']
                    },
                    {
                        label: 'User Management',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/layout/security/user-management']
                    },
                    {
                        label: 'Category Master',
                        icon: 'pi pi-fw pi-sitemap',
                        routerLink: ['/layout/settings/category-formate', 'categorymaster']
                    },
                    {
                        label: 'Customer Master',
                        icon: 'pi pi-fw pi-user',
                        routerLink: ['/layout/settings/category-formate', 'customermaster'],
                        routerLinkActiveOptions: { exact: false }
                    },
                    {
                        label: 'Tax Master',
                        icon: 'pi pi-fw pi-percentage',
                        routerLink: ['/layout/settings/category-formate', 'taxmaster'],
                        routerLinkActiveOptions: { exact: false }
                    },
                    {
                        label: 'Supplier Master',
                        icon: 'pi pi-fw pi-sliders-h',
                        routerLink: ['/layout/settings/category-formate', 'suppliermaster'],
                        routerLinkActiveOptions: { exact: false }
                    },
                    {
                        label: 'UOM Master',
                        icon: 'pi pi-fw pi-briefcase',
                        routerLink: ['/layout/settings/category-formate', 'uommaster'],
                        routerLinkActiveOptions: { exact: false }
                    },
                    {
                        label: 'Rule Detail',
                        icon: 'pi pi-exclamation-triangle',
                        routerLink: ['/layout/settings/rule-detail']
                    },
                    {
                        label: 'Misc Charges',
                        icon: 'pi pi-fw pi-wallet',
                        routerLink: ['/layout/settings/misc-charges']
                    }
                ]
            }
        ]
    },
    {
        label: 'SECURITY',
        icon: 'pi pi-shield',
        accessKey: 'Security',
        items: [
            {
                label: 'System Security',
                icon: 'pi pi-fw pi-shield',
                routerLink: ['/layout/security/overview'],
                items: [
                    {
                        label: 'Access-Control',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/security/access-control']
                    },
                     {
                        label: 'User Management',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/layout/security/user-management']
                    },
                     {
                        label: 'Rule Detail',
                        icon: 'pi pi-exclamation-triangle',
                        routerLink: ['/layout/settings/rule-detail']
                    },
                ]
            }
        ]
    },
    {
        label: 'ACTION',
        icon: 'pi pi-cog',
        accessKey: 'Action',
        items: [
            {
                label: 'Actions',
                icon: 'pi pi-fw pi-pencil',
                routerLink: ['/layout/settings/overview'],
                items: [
                    {
                        label: 'Bulk Upload',
                        icon: 'pi pi-fw pi-upload',
                        routerLink: ['/layout/settings/bulk-upload']
                    },
                    {
                        label: 'My Approval',
                        icon: 'pi pi-fw pi-check-circle',
                        routerLink: ['/layout/settings/my-approval']
                    }
                ]
            }
        ]
    }
];
