import { environment } from "@/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ShareService } from "./shared.service";
import { MaterialRequisitionPayload, MiscPurchase, PurchaseDraftPayload, PurchaseOrderPayload, UpsertRfqPayload, UpserWorkList } from "../models/authmodel/work.model";
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

      upsertPOPerforma(payload: any): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpoperforma}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError(error => throwError(() => error)));
      }

      upsertPOInvoice(payload: any): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpoinvoice}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError(error => throwError(() => error)));
      }

      upsertPOPayment(payload: any): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpopayment}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError(error => throwError(() => error)));
      }

      upsertRFQ(payload:UpsertRfqPayload):Observable<any>{
        let payloaddata = this.shareservice.GetApiBody(payload)
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertrfq}`;
        return this.http.post<any>(url,payloaddata).pipe(catchError(error=>{
            return throwError(()=>error)
        }))
      }

      sendVendorMail(payload: any): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.sendrfqmail}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError(error => throwError(() => error)));
      }

      sendRfqMail(payload: any): Observable<any> {
        return this.sendVendorMail(payload);
      }

      upsertRfqVendorComparison(payload: any): Observable<any> {
    let payloaddata = this.shareservice.GetApiBody(payload);
    let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertrfqvendorcomparison}`;
    return this.http.post<any>(url, payloaddata).pipe(
        catchError((error) => throwError(() => error))
    );
}

getRfqVendorComparison(payload: any): Observable<any> {
    let payloaddata = this.shareservice.GetApiBody(payload);
    let url = `${this.baseUrl}${API_ENDPOINTS.work.getrfqvendorcomparison}`;
    return this.http.post<any>(url, payloaddata).pipe(
        catchError((error) => throwError(() => error))
    );
}

upsertMiscPurchase(payload: MiscPurchase): Observable<any> {
    const payloaddata = this.shareservice.GetApiBody(payload);
    const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertmiscpurchase}`;
    return this.http.post<any>(url, payloaddata).pipe(catchError(error => throwError(() => error)));
  }

}
