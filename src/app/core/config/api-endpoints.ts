export const API_ENDPOINTS = {
  auth: {
    login: '/login',
    register: '/auth/register',
    profile: '/auth/me'
  },
  users: {
    base: '/users',
    details: (id: number) => `/users/${id}`

  },
  inventory: {
    base: '/inventory',
    item: (id: number) => `/inventory/${id}`,
    insertpurchaseheader:'/insertpurchaseheader',
    insertitemdetails:'/insertitemdetails',
    getdropdowndetails:'/getdropdowndetails',
    returndropdowndetails:'/returndropdowndetails',
    adjustmentlist:'/getstockadjustment',
    updateitemlist:'/getitemdetails',
    getinvoicedetail:'/getinvoicedetails',
    deletepurchasedetails:'/deletepurchasedetails',
    updatestockadjustment:'/updatestockadjustment',
    inserttransactiondetails:'/inserttransactiondetails',
    gettransactiondetails:'/gettrasnactiondetails',
    gettransactionreport:'/gettrasnactionreport',
    get_pnl:'/get_pnl',
    updatewriteoffamount:'/fnupdatewriteoffamount'
  },
  sales:{
    getcalculatedMRP:'/getcalculatedMRP'
  },
  orders: {
    base: '/orders',
    byId: (id: number) => `/orders/${id}`
  },
  suppliers: {
    base: '/suppliers'
  },
  dashboardservice: {
    topbar: '/getdashboardreport'
  },
  user:{
    getuserdetails:'/getuserdetails',
     updateprofie:'/updateprofile'
  },
  settings:{
    gettransactionmisc:'/tbltransactionmisc',
    upserttransactionmisc:'/fnupserttransactionmisc',
    deletetransaction:'/fndeletetransaction',
    upsertcustomermaster:'/fnupsertcustomermaster',
    upsertsuppliermaster:'/fnupsertsuppliermaster',
    fnmanageapprovalrulelevels:'/fnmanageapprovalrulelevels',
    approverequest:'/fnapproverequest'
  }
};


