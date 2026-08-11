import { environment } from "@/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ShareService } from "./shared.service";
import { MaterialRequisitionPayload, PurchaseDraftPayload, PurchaseOrderPayload, UpserWorkList } from "../models/authmodel/work.model";
import { catchError, Observable, throwError } from "rxjs";
import { API_ENDPOINTS } from "../config/api-endpoints";

@Injectable({ providedIn: 'root' })
export class WorkService {
    private baseUrl = environment.baseurl;
      private url= environment.baseurl;
      constructor(private http: HttpClient,public shareservice:ShareService) {}
    
      upsertWorkListing(payload:UpserWorkList):Observable<any>{
        let payloaddata = this.shareservice.GetApiBody(payload)
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertworklisting}`;
        return this.http.post<any>(url,payloaddata).pipe(catchError(error=>{
            return throwError(()=>error)
        }))
      }

      upsertMaterialForecast(payload:MaterialRequisitionPayload):Observable<any>{
        let payloaddata = this.shareservice.GetApiBody(payload)
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertmaterialforecast}`;
        return this.http.post<any>(url,payloaddata).pipe(catchError(error=>{
            return throwError(()=>error)
        }))
      }

      upsertPODraft(payload:PurchaseDraftPayload):Observable<any>{
        let payloaddata = this.shareservice.GetApiBody(payload)
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpurchasedraft}`;
        return this.http.post<any>(url,payloaddata).pipe(catchError(error=>{
            return throwError(()=>error)
        }))
      }

      upsertPurchaseOrder(payload:PurchaseOrderPayload):Observable<any>{
        let payloaddata = this.shareservice.GetApiBody(payload)
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpurchaseorder}`;
        return this.http.post<any>(url,payloaddata).pipe(catchError(error=>{
            return throwError(()=>error)
        }))
      }
}
