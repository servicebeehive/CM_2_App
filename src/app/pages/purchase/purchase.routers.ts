import { RfqComponent } from './rfq/rfq.component';
import { VendorComparisonComponent } from './vendor-comparison/vendor-comparison.component';
import { MaterialRequisitionComponent } from '../purchase/material-requisition/material-requisition.component';
import { WorkComponent } from './work-listing/work.component';
import { PurchaseOrderComponent } from './purchase-order/purchase-order.component';

export default [
    { path: 'work', component: WorkComponent },
    { path: 'material-requisition', component: MaterialRequisitionComponent },
    { path: 'rfq', component: RfqComponent },
    { path: 'vendor-comparison', component: VendorComparisonComponent },
    { path: 'purchase-order', component: PurchaseOrderComponent }
];
