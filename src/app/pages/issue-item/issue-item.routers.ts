import { MaterialIssueComponent } from "./material-issue/material-issue.component";
import { MaterialReturnComponent } from "./material-return/material-return.component";
import { MaterialTransferComponent } from "./material-transfer/material-transfer.component";
import { MaterialIndentComponent } from "./material-indent/material-indent.component";
import { CreateMaterialTransferComponent } from "./create-material-transfer/create-material-transfer.component";

export default[
    { path: 'material-issue', component: MaterialTransferComponent, data: { transactionType: 'issue' } },
    { path: 'material-return', component: MaterialTransferComponent, data: { transactionType: 'return' } },
    { path: 'material-transfer', component: MaterialTransferComponent, data: { transactionType: 'transfer' } },
    { path: 'material-indent', component: MaterialTransferComponent, data: { transactionType: 'indent' } },
    { path: 'create-material-indent', component: MaterialIndentComponent },
    { path: 'create-material-issue', component: MaterialIssueComponent },
    { path: 'create-material-return', component: MaterialReturnComponent },
    { path: 'create-material-transfer', component: CreateMaterialTransferComponent }
]