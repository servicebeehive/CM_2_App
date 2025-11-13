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
    deletepurchasedetails:'/deletepurchasedetails'
  },
  orders: {
    base: '/orders',
    byId: (id: number) => `/orders/${id}`
  },
  suppliers: {
    base: '/suppliers'
  },


};


