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
    gettransactionreport:'/gettrasnactionreport'
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
    getuserdetails:'/getuserdetails'
  }

};


