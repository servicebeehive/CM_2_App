import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let headers: HttpHeaders = req.headers;

    // 🔹 Attach token if available
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // 🔹 Handle content-type (default JSON)
    if (!headers.has('Content-Type') && !(req.body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }

    // 🔹 Example: always accept JSON response
    if (!headers.has('Accept')) {
      headers = headers.set('Accept', 'application/json');
    }

    const clonedReq = req.clone({ headers });

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMsg = 'An unknown error occurred!';

        if (error.error instanceof ErrorEvent) {
          errorMsg = `Client error: ${error.error.message}`;
        } else {
          switch (error.status) {
            case 0:
              errorMsg = 'Network error: Please check your internet connection.';
              break;
            case 400:
              errorMsg = error.error?.message || 'Bad Request!';
              break;
            case 401:
              errorMsg = 'Unauthorized! Please log in again.';
              this.authService.clearToken();
              this.router.navigate(['/login']);
              break;
            case 403:
              errorMsg = 'Forbidden! You do not have permission.';
              break;
            case 404:
              errorMsg = 'Resource not found!';
              break;
            case 500:
              errorMsg = 'Internal Server Error!';
              break;
          }
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMsg,
          life: 4000
        });

        return throwError(() => error);
      })
    );
  }
}
