import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { authLogin } from '../models/authmodel/auth.model';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { environment } from '@/environments/environment';
import { ShareService } from './shared.service';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'app_token';
  private readonly user_info = 'user_info';
  private baseUrl = environment.baseurl;

  constructor(private httpclient: HttpClient, private shareService:ShareService ) {}

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.user_info)
  }

  // ✅ Login API and store data in localStorage using ShareService
  isLoggedIn(loginBody: authLogin): Observable<authLogin> {
    const url = `${this.baseUrl}${API_ENDPOINTS.auth.login}`;
    return this.httpclient.post<authLogin>(url, loginBody).pipe(
      tap((res: any) => {
        if (res?.success && res?.data) {
          // Save token separately (optional)
          const token = res.data.usertoken;
          if (token) {
            this.setToken(token);
          }

          // ✅ Save full user info in localStorage
          this.shareService.setUserData(res.data);

          console.log('Login success! Token and user data saved ✅');
        }
      }),
      catchError(error => {
        console.error('Login failed ❌', error);
        return throwError(() => error);
      })
    );
  }
}
