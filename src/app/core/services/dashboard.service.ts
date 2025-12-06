import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {


  
  private baseUrl = environment.baseurl;
  constructor(public httpClient:HttpClient) {

  }
    GettopBarCard(payload:any):Observable<any>{
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.dashboardservice.topbar}`;
    return this.httpClient.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
}
