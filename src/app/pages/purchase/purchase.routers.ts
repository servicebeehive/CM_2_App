import { RfqComponent } from './rfq/rfq.component';
import { VendorComparisonComponent } from './vendor-comparison/vendor-comparison.component';
import { MaterialRequisitionComponent } from '../purchase/material-requisition/material-requisition.component';
import { WorkComponent } from './work-listing/work.component';
import { PurchaseOrderComponent } from './purchase-order/purchase-order.component';
import { MicsPurchaseComponent } from './mics-purchase/mics-purchase.component';
import { MaterialTransferComponent } from '../issue-item/material-transfer/material-transfer.component';

export default [
    { path: 'work', component: WorkComponent },
    { path: 'material-requisition', component: MaterialRequisitionComponent },
    { path: 'material-requisition-list', component: MaterialTransferComponent, data: { transactionType: 'requisition' } },
    { path: 'rfq', component: RfqComponent },
    { path: 'vendor-comparison', component: VendorComparisonComponent },
    { path: 'purchase-order', component: PurchaseOrderComponent },
    { path: 'purchase-order-list', component: MaterialTransferComponent, data: { transactionType: 'purchaseOrder' } },
    { path: 'mics-purchase', component: MicsPurchaseComponent },
    { path: 'mics-purchase-list', component: MaterialTransferComponent, data: { transactionType: 'miscPurchase' } },
];
