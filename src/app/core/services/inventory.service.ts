import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StockIn } from '@/types/stockin.model';
import { SaleHeader, StockHeader } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  getcalculatedMRP(apibody: { p_returntype: string; p_returnvalue: string; clientcode: string; uname: string; p_loginuser: string; "x-access-token": string | null; }) {
    throw new Error('Method not implemented.');
  }
  productItem=[];

  private baseUrl = environment.baseurl;
  private url= environment.baseurl;
  constructor(private http: HttpClient) {}

  /** Get all items */
  getAllItems(): Observable<StockIn[]> {
    // const url = `${this.baseUrl}${API_ENDPOINTS.inventory.base}`;
    return this.http.get<StockIn[]>(this.url).pipe(
      catchError(this.handleError)
    );
  }

  /** Get item by ID */
  getItemById(id: number): Observable<any> {
    const url = `${this.baseUrl}${API_ENDPOINTS.inventory.item(id)}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  /** Create new item */
  addItem(payload: any): Observable<any> {
    const url = `${this.baseUrl}${API_ENDPOINTS.inventory.base}`;
    return this.http.post<any>(url, payload).pipe(
      catchError(this.handleError)
    );
  }

  /** Update item */
  updateItem(id: number, payload: any): Observable<any> {
    const url = `${this.baseUrl}${API_ENDPOINTS.inventory.item(id)}`;
    return this.http.put<any>(url, payload).pipe(
      catchError(this.handleError)
    );
  }

  /** Delete item */
  deleteItem(id: number): Observable<any> {
    const url = `${this.baseUrl}${API_ENDPOINTS.inventory.item(id)}`;
    return this.http.delete<any>(url).pipe(
      catchError(this.handleError)
    );
  }


  OnPurchesHeaderCreate(payload:StockHeader):Observable<any>{
    console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.insertpurchaseheader}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }

  OnUserHeaderCreate(payload:StockHeader):Observable<any>{
    console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.user.getuserdetails}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
   OnSalesHeaderCreate(payload:SaleHeader):Observable<any>{
    console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.inserttransactiondetails}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
Oninsertitemdetails(payload:any):Observable<any>{
    console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.insertitemdetails}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
  OninsertSalesDetails(payload:any):Observable<any>{
    console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.inserttransactiondetails}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
  getdropdowndetails(payload:any):Observable<any>{
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.getdropdowndetails}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
  Getreturndropdowndetails(payload:any):Observable<any>{
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.returndropdowndetails}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
DeletStockinitem(payload:any):Observable<any>{
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.deletepurchasedetails}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
  }
getadjustmentdata(payload:any):Observable<any>{
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.adjustmentlist}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
}

getupdatedata(payload:any):Observable<any>{
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.updateitemlist}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
}
getinvoicedetail(payload:any):Observable<any>{
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.getinvoicedetail}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)
}

gettransactiondetail(payload:any):Observable<any>{
  let url=`${this.baseUrl}${API_ENDPOINTS.inventory.gettransactiondetails}`;
  return this.http.post<any>(url,payload).pipe(catchError(error=>{
    return throwError(()=>error)
  }),
  )
}
gettransactionreportdetail(payload:any):Observable<any>{
  let url=`${this.baseUrl}${API_ENDPOINTS.inventory.gettransactionreport}`;
  return this.http.post<any>(url,payload).pipe(catchError(error=>{
    return throwError(()=>error)
  }),
  )
}

updatestockadjustment(payload:any):Observable<any>{
    // console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.updatestockadjustment}`;
    return this.http.post<any>(url,payload).pipe(catchError(error=>{
        return throwError(()=>error)
    }),

)

}

  /** 🔹 Common error handler */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API error occurred:', error);

    // Example: transform error into readable message
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Client-side / network error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Server returned code ${error.status}, message: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
