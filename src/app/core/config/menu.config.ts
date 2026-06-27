import { MenuItem } from 'primeng/api';

export const ADMIN_MENU_MODEL: MenuItem[] = [
    {
        label: 'DASHBOARD',
        icon: 'pi pi-home',
        routerLink: ['/'],
        items: [
            {
                label: 'Main Dashboard',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/layout/dashboard']
            }
        ]
    },
    {
        label: 'INVENTORY',
        icon: 'pi pi-chart-bar',
        items: [
            {
                label: 'Inventory Management',
                icon: 'pi pi-fw pi-database',
                routerLink: ['/layout/inventory/overview'],
                items: [
                    //  {
                    //    label: 'Indent',
                    //    icon: 'pi pi-fw pi-file-edit',
                    //    routerLink: ['/layout/inventory/indent']
                    // },
                    {
                       label: 'Work Listing',
                       icon: 'pi pi-fw pi pi-sitemap',
                       routerLink: ['/layout/inventory/work']
                    },
                    {
                       label: 'Material Forcasting',
                       icon: 'pi pi-fw pi pi-sparkles',
                       routerLink: ['/layout/inventory/material-forcasting']
                    },    
                    {
                       label: 'Purchase Order',
                       icon: 'pi pi-fw pi pi-send',
                       routerLink: ['/layout/inventory/purchase-order']
                    },
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
                    }
                ]
            }
        ]
    },
    {
        label: 'PRODUCTS',
        icon: 'pi pi-box',
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
        label: 'DELIVERY',
        icon: 'pi pi pi-truck',
        items: [
            {
                label: 'Delivery Item',
                icon: 'pi pi-fw pi pi-truck',
                routerLink: ['/layout/products/overview'],
                items: [
                    {
                        label: 'GRN',
                        icon: 'pi pi-fw pi-inbox',
                        routerLink: ['/layout/inventory/grn']
                    },
                    {
                        label: 'Quality Inspection',
                        icon: 'pi pi-fw pi pi-search',
                        routerLink: ['/layout/inventory/quality-inspection']
                    }
                ]
            }
        ]
    },
    {
        label: 'Issue',
        icon: 'pi pi-shopping-cart',
        items: [
            {
                label: 'Issue Item',
                icon: 'pi pi-fw pi-desktop',
                routerLink: ['/layout/pos/overview'],
                items: [
                    // {
                    //     label: 'Sales',
                    //     icon: 'pi pi-fw pi-dollar',
                    //     routerLink: ['/layout/pos/sales']
                    // },
                    // {
                    //     label: 'Return',
                    //     icon: 'pi pi-fw pi-arrow-left',
                    //     routerLink: ['/layout/pos/return']
                    // },
                    // {
                    //     label: 'Replace',
                    //     icon: 'pi pi-fw pi-arrow-right-arrow-left',
                    //     routerLink: ['/layout/pos/replace']
                    // },
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
                    // {
                    //     label:'Rent',
                    //     icon:'pi pi-fw pi-file-edit',
                    //     routerLink: ['/layout/pos/rented']
                    // },
                    // {
                    //    label: 'Sales Requisition',
                    //    icon: 'pi pi-fw pi-shopping-bag',
                    //    routerLink: ['/layout/pos/sales-requisition']
                    // },
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
        items: [
            {
                label: 'System Settings',
                icon: 'pi pi-fw pi-cog',
                routerLink: ['/layout/settings/overview'],
                items: [
                    // {
                    //     label: 'Access Control',
                    //     icon: 'pi pi-fw pi-sliders-h',
                    //     routerLink: ['/layout/settings/access-control']
                    // },
                     {
                        label: 'UserType',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/settings/category-formate', 'usertype']
                    },
                    {
                        label: 'Bulk Upload',
                        icon: 'pi pi-fw pi-upload',
                        routerLink: ['/layout/settings/bulk-upload']
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
                        routerLinkActiveOptions:{exact: false}
                    },
                    {
                        label: 'Tax Master',
                        icon: 'pi pi-fw pi-percentage',
                        routerLink: ['/layout/settings/category-formate', 'taxmaster'],
                        routerLinkActiveOptions:{exact: false}
                    },
                    {
                        label: 'Supplier Master',
                        icon: 'pi pi-fw pi-sliders-h',
                        routerLink: ['/layout/settings/category-formate', 'suppliermaster'],
                        routerLinkActiveOptions:{exact:false}
                    },
                    {
                        label: 'UOM Master',
                        icon: 'pi pi-fw pi-briefcase',
                        routerLink: ['/layout/settings/category-formate', 'uommaster'],
                        routerLinkActiveOptions:{exact: false}
                    }
                ]
            }
        ]
    },
    {
        label: 'SECURITY',
        icon: 'pi pi-shield',
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
                      {
                        label: 'My Approval',
                        icon: 'pi pi-fw pi-check-circle',
                        routerLink: ['/layout/settings/my-approval']
                    },
                    //   {
                    //     label: 'My Approval',
                    //     icon: 'pi pi-fw pi-check-circle',
                    //     routerLink: ['/layout/settings/my-approval']
                    // },
                      {
                        label: 'Misc Charges',
                        icon: 'pi pi-fw pi-wallet',
                        routerLink: ['/layout/settings/misc-charges']
                    }
                ]
            }
        ]
    }
];

////Second Menu

export const SALES_MANAGER_MENU_MODEL: MenuItem[] = [
    {
        label: 'DASHBOARD',
        icon: 'pi pi-home',
        routerLink: ['/'],
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/layout/dashboard']
            }
        ]
    },
    {
        label: 'INVENTORY',
        icon: 'pi pi-chart-bar',
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
                    // {
                    //   label: 'Stock Adjustment',
                    //   icon: 'pi pi-fw pi-wrench',
                    //   routerLink: ['/layout/inventory/stock-adjustment'],
                    // },
                    {
                        label: 'Transactions',
                        icon: 'pi pi-fw pi-history',
                        routerLink: ['/layout/inventory/transaction']
                    }
                ]
            }
        ]
    },
    {
        label: 'PRODUCTS',
        icon: 'pi pi-box',
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
        items: [
            {
                label: 'Point of Sale',
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
                    }
                ]
            }
        ]
    },
    {
        label: 'SETTINGS',
        icon: 'pi pi-cog',
        items: [
            {
                label: 'System Settings',
                icon: 'pi pi-fw pi-cog',
                routerLink: ['/layout/settings/overview'],
                items: [
                    {
                        label: 'User Management',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/layout/settings/user-management']
                    }
                ]
            }
        ]
    }
];
export const STORE_OWNER_MENU_MODEL: MenuItem[] = [
    {
        label: 'DASHBOARD',
        icon: 'pi pi-home',
        routerLink: ['/'],
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/layout/dashboard']
            }
        ]
    },
     {
        label: 'INVENTORY',
        icon: 'pi pi-chart-bar',
        items: [
            {
                label: 'Inventory Management',
                icon: 'pi pi-fw pi-database',
                routerLink: ['/layout/inventory/overview'],
                items: [
                    {
                        label: 'Transactions',
                        icon: 'pi pi-fw pi-history',
                        routerLink: ['/layout/inventory/transaction']
                    }
                ]
            }
        ]
    },
    {
        label: 'POS',
        icon: 'pi pi-shopping-cart',
        items: [
            {
                label: 'Point of Sale',
                icon: 'pi pi-fw pi-desktop',
                routerLink: ['/layout/pos/overview'],
                items: [
                      {
                        label: 'Sales',
                        icon: 'pi pi-fw pi-dollar',
                        routerLink: ['/layout/pos/sales']
                    },
                    {
                        label: 'Invoice',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/pos/invoice']
                    }
                ]
            }
        ]
    },
    {
        label: 'REPORTS',
        icon: 'pi pi-calculator',
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
                    }
                ]
            }
        ]
    },
     {
        label: 'SETTINGS',
        icon: 'pi pi-cog',
        items: [
            {
                label: 'System Settings',
                icon: 'pi pi-fw pi-cog',
                routerLink: ['/layout/settings/overview'],
                items: [
                    {
                        label: 'Rule Detail',
                        icon: 'pi pi-exclamation-triangle',
                        routerLink: ['/layout/settings/rule-detail']
                    },
                      {
                        label: 'My Approval',
                        icon: 'pi pi-fw pi-check-circle',
                        routerLink: ['/layout/settings/my-approval']
                    },
                      {
                        label: 'Misc Charges',
                        icon: 'pi pi-fw pi-wallet',
                        routerLink: ['/layout/settings/misc-charges']
                    }
                ]
            }
        ]
    }
];
export const SALES_REP_MENU_MODEL: MenuItem[] = [
    {
        label: 'DASHBOARD',
        icon: 'pi pi-home',
        routerLink: ['/'],
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/layout/dashboard']
            }
        ]
    },
    {
        label: 'INVENTORY',
        icon: 'pi pi-chart-bar',
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
                    // {
                    //   label: 'Stock Adjustment',
                    //   icon: 'pi pi-fw pi-wrench',
                    //   routerLink: ['/layout/inventory/stock-adjustment'],
                    // },
                    {
                        label: 'Transactions',
                        icon: 'pi pi-fw pi-history',
                        routerLink: ['/layout/inventory/transaction']
                    }
                ]
            }
        ]
    },
    {
        label: 'PRODUCTS',
        icon: 'pi pi-box',
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
        items: [
            {
                label: 'Point of Sale',
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
                    // {
                    //   label: 'Replace',
                    //   icon: 'pi pi-fw pi-arrow-right-arrow-left',
                    //   routerLink: ['/layout/pos/replace'],
                    // },
                    {
                        label: 'Invoice',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/pos/invoice']
                    }
                    // {
                    //   label: 'Debit/Credit Link',
                    //   icon: 'pi pi-fw pi-credit-card',
                    //   routerLink: ['/layout/pos/credit-note'],
                    // }
                ]
            }
        ]
    },
    {
        label: 'REPORTS',
        icon: 'pi pi-calculator',
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
                    }
                ]
            }
        ]
    },
    {
        label: 'SETTINGS',
        icon: 'pi pi-cog',
        items: [
            {
                label: 'System Settings',
                icon: 'pi pi-fw pi-cog',
                routerLink: ['/layout/settings/overview'],
                items: [
                    {
                        label: 'User Management',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/layout/settings/user-management']
                    }
                ]
            }
        ]
    }
];
