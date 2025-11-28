import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = environment.baseurl;
  constructor(public httpClient:HttpClient) {

  }
    getcalculatedMRP(payload:any):Observable<any>{
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.sales.getcalculatedMRP}`;
    return this.httpClient.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }

}
