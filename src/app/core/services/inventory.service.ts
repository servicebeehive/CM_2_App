import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StockIn } from '@/types/stockin.model';
import { StockHeader } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  productItem=
[
  { "selection":true,
    "code": "123456789123",
    "name": "Anchor Switch 3/4",
    "category": "Switch",
    "curStock": 10,
    "purchasePrice": 10,
    "quantity": 10,
    "total": 10,
    "uom": "Piece",
    "mrp": 10,
    "discount":10,
    "minStock": 10,
    "warPeriod": 2,
    "location": "aaa",
    "action": ""
  },
  {  "selection":true,
    "code": "1234567891244",
    "name": "Wire abc",
    "category": "Wire",
    "curStock": 20,
    "purchasePrice": 40,
    "quantity": 50,
    "total": 100,
    "uom": "Piece",
    "mrp": 70,
    "discount":10,
    "minStock": 10,
    "warPeriod": 2,
    "location": "aaa",
    "action": ""
  },
  {"selection":true,
    "code": "123456789993",
    "name": "Fan",
    "category": "Fan",
    "curStock": 30,
    "purchasePrice": 600,
    "quantity": 30,
    "total": 900,
    "uom": "Piece",
    "mrp": 1000,
    "discount":10,
    "minStock": 5,
    "warPeriod": 2,
    "location": "aaa",
    "action": ""
  },
  {"selection":true,
    "code": "123456789190",
    "name": "LED Bulb",
    "category": "Bulb",
    "curStock": 100,
    "purchasePrice": 50,
    "quantity": 100,
    "total": 700,
    "uom": "Piece",
    "mrp": 80,
    "discount":10,
    "minStock": 10,
    "warPeriod":2,
    "location": "aaa",
    "action": ""
  },
   {"selection":true,
    "code": "123456789993",
    "name": "Fan",
    "category": "Fan",
    "curStock": 30,
    "purchasePrice": 600,
    "quantity": 30,
    "total": 900,
    "uom": "Piece",
    "mrp": 1000,
    "discount":10,
    "minStock": 5,
    "warPeriod": 2,
    "location": "aaa",
    "action": ""
  },
  {"selection":true,
    "code": "123456789190",
    "name": "LED Bulb",
    "category": "Bulb",
    "curStock": 100,
    "purchasePrice": 50,
    "quantity": 100,
    "total": 700,
    "uom": "Piece",
    "mrp": 80,
    "discount":10,
    "minStock": 10,
    "warPeriod":2,
    "location": "aaa",
    "action": ""
  }, {"selection":true,
    "code": "123456789993",
    "name": "Fan",
    "category": "Fan",
    "curStock": 30,
    "purchasePrice": 600,
    "quantity": 30,
    "total": 900,
    "uom": "Piece",
    "mrp": 1000,
    "discount":10,
    "minStock": 5,
    "warPeriod": 2,
    "location": "aaa",
    "action": ""
  },
  {"selection":true,
    "code": "123456789190",
    "name": "LED Bulb",
    "category": "Bulb",
    "curStock": 100,
    "purchasePrice": 50,
    "quantity": 100,
    "total": 700,
    "uom": "Piece",
    "mrp": 80,
    "discount":10,
    "minStock": 10,
    "warPeriod":2,
    "location": "aaa",
    "action": ""
  }
]

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
Oninsertitemdetails(payload:any):Observable<any>{
    console.log(payload)
    let url=`${this.baseUrl}${API_ENDPOINTS.inventory.insertitemdetails}`;
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
