export const API_ENDPOINTS = {
    auth: {
        login: '/beeware/login',
        register: '/beeware/auth/register',
        profile: '/auth/me'
    },
    users: {
        base: '/users',
        details: (id: number) => `/users/${id}`
    },
    inventory: {
        base: '/inventory',
        item: (id: number) => `/beeware/inventory/${id}`,
        insertpurchaseheader: '/beeware/insertpurchaseheader',
        insertitemdetails: '/beeware/insertitemdetails',
        getdropdowndetailsbeeware: '/beeware/getdropdowndetails',
        getdropdowndetailspublic: '/public/getdropdowndetails',
        getparameterbased: '/public/get-data-parameter',
        returndropdowndetails: '/beeware/returndropdowndetails',
        adjustmentlist: '/beeware/getstockadjustment',
        updateitemlist: '/beeware/getitemdetails',
        getinvoicedetail: '/beeware/getinvoicedetails',
        deletepurchasedetails: '/beeware/deletepurchasedetails',
        updatestockadjustment: '/beeware/updatestockadjustment',
        inserttransactiondetails: '/beeware/inserttransactiondetails',
        gettransactiondetails: '/beeware/gettrasnactiondetails',
        gettransactionreport: '/beeware/gettrasnactionreport',
        get_pnl: '/beeware/get_pnl',
        updatewriteoffamount: '/beeware/fnupdatewriteoffamount',
        upsertproject: '/beeware/upsert_project',
        getprojectlist: '/beeware/get_project_list',
        upsertItem: '/beeware/upsert_item'
    },
    work: {
        upsertworklisting: '/beeware/upsert_work_listing',
        upsertmaterialforecast: '/beeware/upsert_material_forecast',
        upsertpurchasedraft: '/beeware/upsert_po_draft',
        upsertpurchaseorder: '/beeware/upsert_purchase_order',
        upsertrfq: '/beeware/upsert_rfq',
        sendrfqmail: '/beeware/send_rfq_mail',
        upsertrfqvendorcomparison: '/beeware/upsert_rfq_vendor_comparison',
        getrfqvendorcomparison: '/beeware/get_rfq_vendor_comparison'
    },
    sales: {
        getcalculatedMRP: '/beeware/getcalculatedMRP'
    },
    orders: {
        base: '/orders',
        byId: (id: number) => `/orders/${id}`
    },
    suppliers: {
        base: '/beeware/suppliers'
    },
    dashboardservice: {
        topbar: '/beeware/getdashboardreport'
    },
    user: {
        getuserdetails: '/beeware/getuserdetails',
        updateprofie: '/public/companydetail/upsert',
        upsertusertype: '/beeware/upsert_user_type',
        removeParamterBased: '/beeware/remove_data_parameter_based',
        upsertsuppliermaster: '/beeware/fnupsertsuppliermaster',
        upertprofilepermission: '/beeware/manage_profile_permissions_bulk'
    },
    settings: {
        gettransactionmisc: '/beeware/tbltransactionmisc',
        upserttransactionmisc: '/beeware/fnupserttransactionmisc',
        deletetransaction: '/beeware/fndeletetransaction',
        upsertcustomermaster: '/beeware/fnupsertcustomermaster',
        upsertsuppliermaster: '/beeware/fnupsertsuppliermaster',
        upsertcategorymaster: '/beeware/upsert_category',
        upsertuommaster: '/beeware/upsert_uom',
        fnmanageapprovalrulelevels: '/beeware/fnmanageapprovalrulelevels',
        approverequest: '/beeware/fnapproverequest'
    }
};
