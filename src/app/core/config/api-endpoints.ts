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
    insertpurchaseheader:'/beeware/insertpurchaseheader',
    insertitemdetails:'/beeware/insertitemdetails',
    getdropdowndetails:'/public/getdropdowndetails',
    getparameterbased:'/public/get-data-parameter',
    returndropdowndetails:'/beeware/returndropdowndetails',
    adjustmentlist:'/beeware/getstockadjustment',
    updateitemlist:'/beeware/getitemdetails',
    getinvoicedetail:'/beeware/getinvoicedetails',
    deletepurchasedetails:'/beeware/deletepurchasedetails',
    updatestockadjustment:'/beeware/updatestockadjustment',
    inserttransactiondetails:'/beeware/inserttransactiondetails',
    gettransactiondetails:'/beeware/gettrasnactiondetails',
    gettransactionreport:'/beeware/gettrasnactionreport',
    get_pnl:'/beeware/get_pnl',
    updatewriteoffamount:'/beeware/fnupdatewriteoffamount'
  },
  work:{
    upsertworklisting:'/beeware/upsert_work_listing',
    upsertmaterialforecast:'/beeware/upsert_material_forecast'
  },
  sales:{
    getcalculatedMRP:'/beeware/getcalculatedMRP'
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
  user:{
    getuserdetails:'/beeware/getuserdetails',
     updateprofie:'/beeware/updateprofile'
  },
  settings:{
    gettransactionmisc:'/beeware/tbltransactionmisc',
    upserttransactionmisc:'/beeware/fnupserttransactionmisc',
    deletetransaction:'/beeware/fndeletetransaction',
    upsertcustomermaster:'/beeware/fnupsertcustomermaster',
    upsertsuppliermaster:'/beeware/fnupsertsuppliermaster',
    fnmanageapprovalrulelevels:'/beeware/fnmanageapprovalrulelevels',
    approverequest:'/beeware/fnapproverequest'
  }
};


