import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShareService } from './shared.service';
import { GrnDelivery, GrnDocuments, GrnHeader, GrnRemarks, MaterialRequisitionPayload, MiscPurchase, PurchaseDraftPayload, PurchaseOrderPayload, UpsertRfqPayload, UpserWorkList, CancelPOPayload, MaterialIssue, MaterialIndent, MaterialReturn, MaterialTransfer, UpdateMailStatus } from '../models/authmodel/work.model';
import { catchError, Observable, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({ providedIn: 'root' })
export class WorkService {
    private baseUrl = environment.baseurl;
    private url = environment.baseurl;
    constructor(
        private http: HttpClient,
        public shareservice: ShareService
    ) {}

    upsertWorkListing(payload: UpserWorkList): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertworklisting}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    upsertMaterialForecast(payload: MaterialRequisitionPayload): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertmaterialforecast}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    upsertPODraft(payload: PurchaseDraftPayload): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpurchasedraft}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    upsertPurchaseOrder(payload: PurchaseOrderPayload): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpurchaseorder}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    cancelPurchaseOrder(payload: CancelPOPayload): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.cancelpo}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertPOPerforma(payload: any): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpoperforma}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertPOInvoice(payload: any): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpoinvoice}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertPOPayment(payload: any): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertpopayment}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertRFQ(payload: UpsertRfqPayload): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertrfq}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    sendVendorMail(payload: any): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.sendrfqmail}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    sendRfqMail(payload: any): Observable<any> {
        return this.sendVendorMail(payload);
    }

    upsertRfqVendorComparison(payload: any): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.work.upsertrfqvendorcomparison}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    getRfqVendorComparison(payload: any): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.work.getrfqvendorcomparison}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertMiscPurchase(payload: MiscPurchase): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertmiscpurchase}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertGrn(payload: GrnHeader): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertgrn}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertGrnDelivery(payload: GrnDelivery): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertgrndelivery}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertGrnRemarks(payload: GrnRemarks): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertgrnremarks}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }
    
    upsertGrnDocuments(payload: GrnDocuments): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertgrndocuments}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertMaterialIssue(payload: MaterialIssue): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertmaterialissue}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertMaterialIndent(payload: MaterialIndent): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertmaterialindent}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertMaterialReturn(payload: MaterialReturn): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertmaterialreturn}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    upsertMaterialTransfer(payload: MaterialTransfer): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.upsertmaterialtransfer}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    getProjectListRbac(payload: any): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.getprojectlistrbac}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

     updateMailStatus(payload: UpdateMailStatus): Observable<any> {
        const payloaddata = this.shareservice.GetApiBody(payload);
        const url = `${this.baseUrl}${API_ENDPOINTS.work.updatemailstatus}`;
        return this.http.post<any>(url, payloaddata).pipe(catchError((error) => throwError(() => error)));
    }

    updateMailStatusesFromSend(
        mailRows: Array<{ mailLogId: number | string | null | undefined; vendorId: number | string | null | undefined }>,
        response: any,
        updatedBy: number | null,
        sendError?: any
    ): number {
        const results: any[] = Array.isArray(response?.data) ? response.data : response?.data ? [response.data] : [];
        const hasVendorIds = results.some((result) => result?.vendorId != null || result?.vendor_id != null);
        let sentCount = 0;

        mailRows.forEach((mailRow, index) => {
            if (mailRow.mailLogId == null || mailRow.mailLogId === '') return;

            const result = results.find((item) => {
                const resultVendorId = item?.vendorId ?? item?.vendor_id;
                return resultVendorId != null && String(resultVendorId) === String(mailRow.vendorId);
            }) ?? (!hasVendorIds ? results[index] : undefined);
            const isSent = !sendError && String(result?.status ?? '').toUpperCase() === 'SENT';
            if (isSent) sentCount++;

            const error = sendError ?? result?.error ?? result?.error_message ?? result?.errorMessage ?? result?.message ?? response?.error;
            this.updateMailStatus({
                p_mail_log_id: Number(mailRow.mailLogId),
                p_status: isSent ? 'SENT' : 'FAILED',
                p_error_message: isSent ? null : this.getMailFailureMessage(error, result ? `Vendor mail status: ${result.status ?? 'unknown'}` : 'No vendor result returned'),
                p_updated_by: updatedBy
            }).subscribe({
                error: (statusError) => console.error('Failed to update mail status:', statusError)
            });
        });

        return sentCount;
    }

    getMailFailureMessage(error: any, fallback = 'Mail send failed'): string {
        const message = typeof error === 'string'
            ? error
            : error?.error?.error ?? error?.error?.message ?? error?.error?.detail ?? error?.message ?? error?.error ?? error?.detail ?? error?.statusText;

        if (typeof message === 'string' && message.trim()) return message.trim();
        if (message != null) {
            try {
                return JSON.stringify(message);
            } catch {
                return fallback;
            }
        }
        return fallback;
    }
}
