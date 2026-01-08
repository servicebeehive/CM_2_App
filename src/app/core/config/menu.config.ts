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
                        label: 'Bulk Upload',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/layout/settings/bulk-upload']
                    },
                    {
                        label: 'Category Master',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/settings/category-formate', 'categorymaster']
                    },
                    {
                        label: 'Customer Master',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/settings/category-formate', 'customermaster']
                    },
                    {
                        label: 'Tax Master',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/settings/category-formate', 'taxmaster']
                    },
                    {
                        label: 'Supplier Master',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/settings/category-formate', 'suppliermaster']
                    },
                    {
                        label: 'UOM Master',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/settings/category-formate', 'uommaster']
                    }
                ]
            }
        ]
    },
    {
        label: 'SECURITY',
        icon: 'pi pi-cog',
        items: [
            {
                label: 'System Security',
                icon: 'pi pi-fw pi-cog',
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
                        label: 'UserType',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/layout/settings/category-formate', 'usertype']
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
        label: 'POS',
        icon: 'pi pi-shopping-cart',
        items: [
            {
                label: 'Point of Sale',
                icon: 'pi pi-fw pi-desktop',
                routerLink: ['/layout/pos/overview'],
                items: [
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
