import { MaterialIssueComponent } from "./material-issue/material-issue.component";
import { MaterialReturnComponent } from "./material-return/material-return.component";
import { MaterialTransferComponent } from "./material-transfer/material-transfer.component";
import { MaterialIndentComponent } from "./material-indent/material-indent.component";
import { CreateMaterialTransferComponent } from "./create-material-transfer/create-material-transfer.component";

export default[
    { path: 'material-issue', component: MaterialIssueComponent },
    { path: 'material-return', component: MaterialReturnComponent },
    { path: 'material-transfer', component: MaterialTransferComponent },
    { path: 'material-indent', component: MaterialIndentComponent },
    { path: 'create-material-transfer', component: CreateMaterialTransferComponent }
]