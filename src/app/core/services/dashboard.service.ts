import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { ShareService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {


  
  private baseUrl = environment.baseurl;
  constructor(public httpClient:HttpClient,private shareservice:ShareService) {

  }
    GettopBarCard(payload:any):Observable<any>{
    let payloaddata=this.shareservice.GetApiBody(payload)
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.dashboardservice.topbar}`;
    return this.httpClient.post<any>(url,payloaddata).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
    GetUserBarCard(payload:any):Observable<any>{
  let payloaddata=this.shareservice.GetApiBody(payload)
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.dashboardservice.topbar}`;
    return this.httpClient.post<any>(url,payloaddata).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
}
