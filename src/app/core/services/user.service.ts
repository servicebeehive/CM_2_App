import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { GetUserDetail, InsertUserType, RemovedParamterBased, SupplierMaster, UpsertPermission, UserHeader } from '../models/inventory.model';
import { HttpClient } from '@angular/common/http';
import { ShareService } from './shared.service';
import { environment } from '@/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private baseUrl = environment.baseurl;
    private url = environment.baseurl;
    constructor(
        private http: HttpClient,
        public shareservice: ShareService
    ) {}

    OnUserHeaderCreate(payload: GetUserDetail): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.user.getuserdetails}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    OnUserListHeaderCreate(payload: any): Observable<any> {
        console.log(payload);
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.user.updateprofie}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    upsertUserType(payload: InsertUserType): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.user.upsertusertype}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

     upsertSupplierMaster(payload: SupplierMaster): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.user.upsertsuppliermaster}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }


    removeDataParameter(payload: RemovedParamterBased): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.user.removeParamterBased}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

      upsertPofilepermission(payload: UpsertPermission): Observable<any> {
        let payloaddata = this.shareservice.GetApiBody(payload);
        let url = `${this.baseUrl}${API_ENDPOINTS.user.upertprofilepermission}`;
        return this.http.post<any>(url, payloaddata).pipe(
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }
}
