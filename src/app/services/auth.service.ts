// auth.service.ts - Enhanced with automatic token refresh on 401 errors
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { tap, switchMap, catchError, map, retry, retryWhen, delayWhen, take } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private accessToken: string | null = null;
  private tokenSubject = new BehaviorSubject<string>('');
  private tokenExpiryTime: number | null = null;
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only try to load token in browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredToken();
    }
  }

  /** ✅ Safe localStorage operations */
  private getStorageItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage access failed:', error);
        return null;
      }
    }
    return null;
  }

  private setStorageItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('localStorage write failed:', error);
      }
    }
  }

  private removeStorageItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('localStorage remove failed:', error);
      }
    }
  }

  /** ✅ Load stored token on service initialization */
  private loadStoredToken(): void {
    const storedToken = this.getStorageItem('access_token');
    const storedExpiry = this.getStorageItem('token_expiry');
    
    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      const now = Date.now();
      
      // Only use stored token if it's not expired (with 5 minute buffer)
      if (expiryTime > now + (5 * 60 * 1000)) {
        this.accessToken = storedToken;
        this.tokenExpiryTime = expiryTime;
        this.tokenSubject.next(storedToken);
        console.log('Loaded valid token from storage');
      } else {
        console.log('Stored token expired, will refresh');
        this.clearStoredToken();
      }
    }
  }

  /** ✅ Check if current token is expired or about to expire */
  private isTokenExpired(): boolean {
    if (!this.accessToken || !this.tokenExpiryTime) {
      return true;
    }
    
    // Consider token expired if it expires within the next 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return this.tokenExpiryTime <= Date.now() + bufferTime;
  }

  /** ✅ Clear stored token data */
  private clearStoredToken(): void {
    this.accessToken = null;
    this.tokenExpiryTime = null;
    this.removeStorageItem('access_token');
    this.removeStorageItem('token_expiry');
  }

  /** ✅ Retrieve the access token (refresh if needed) */
  getAccessToken(): Observable<string> {
    // If we have a valid token, return it
    if (this.accessToken && !this.isTokenExpired()) {
      return of(this.accessToken);
    }

    // If already refreshing, wait for the refresh to complete
    if (this.isRefreshing) {
      return this.refreshTokenSubject.asObservable().pipe(
        take(1),
        switchMap(token => token ? of(token) : this.refreshToken())
      );
    }

    // Refresh the token
    return this.refreshToken();
  }

  /** ✅ Refresh the OAuth2 Token with improved error handling */
  refreshToken(): Observable<string> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.asObservable().pipe(take(1));
    }

    this.isRefreshing = true;
    console.log('Refreshing access token...');

    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', environment.auth.clientId);
    body.set('client_secret', environment.auth.clientSecret);

    return this.http.post<TokenResponse>(environment.auth.tokenUrl, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    }).pipe(
      // Retry on network errors, but not on auth errors
      retryWhen(errors =>
        errors.pipe(
          delayWhen((error: HttpErrorResponse) => {
            // Only retry on network errors (status 0) or server errors (5xx)
            if (error.status === 0 || (error.status >= 500 && error.status < 600)) {
              console.warn('Network/server error during token refresh, retrying...', error.status);
              return timer(1000); // Wait 1 second before retry
            }
            // Don't retry on client errors (4xx)
            return throwError(() => error);
          }),
          take(3) // Maximum 3 retries
        )
      ),
      map(response => {
        if (!response || !response.access_token) {
          throw new Error('Invalid token response: no access token received');
        }
        return response;
      }),
      tap(response => {
        this.accessToken = response.access_token;
        
        // Calculate expiry time (default to 1 hour if not provided)
        const expiresInSeconds = response.expires_in || 3600;
        this.tokenExpiryTime = Date.now() + (expiresInSeconds * 1000);
        
        // Store token and expiry
        this.setStorageItem('access_token', this.accessToken);
        this.setStorageItem('token_expiry', this.tokenExpiryTime.toString());
        
        // Notify subscribers
        this.tokenSubject.next(this.accessToken);
        this.refreshTokenSubject.next(this.accessToken);
        
        console.log('Token refreshed successfully, expires at:', new Date(this.tokenExpiryTime));
      }),
      map(response => response.access_token),
      catchError(error => {
        console.error('Token refresh failed:', error);
        
        // Clear any invalid stored tokens
        this.clearStoredToken();
        this.tokenSubject.next('');
        this.refreshTokenSubject.next('');
        
        // Provide more specific error messages
        let errorMessage = 'Authentication failed';
        if (error instanceof HttpErrorResponse) {
          switch (error.status) {
            case 0:
              errorMessage = 'Network error - please check your connection';
              break;
            case 401:
              errorMessage = 'Invalid client credentials';
              break;
            case 403:
              errorMessage = 'Access forbidden - check API permissions';
              break;
            case 429:
              errorMessage = 'Rate limit exceeded - please try again later';
              break;
            case 500:
              errorMessage = 'Server error - please try again later';
              break;
            default:
              errorMessage = `Authentication failed (${error.status})`;
          }
        }
        
        return throwError(() => new Error(errorMessage));
      }),
      tap({
        complete: () => {
          this.isRefreshing = false;
        },
        error: () => {
          this.isRefreshing = false;
        }
      })
    );
  }

  /** ✅ Handle 401 errors by refreshing token and retrying */
  handleUnauthorizedError(): Observable<string> {
    console.log('Handling 401 error - clearing current token and refreshing');
    
    // Clear the current token since it's invalid
    this.clearStoredToken();
    this.tokenSubject.next('');
    
    // Force refresh
    return this.refreshToken();
  }

  /** ✅ Get current token without refresh (for checking) */
  getCurrentToken(): string | null {
    return this.accessToken;
  }

  /** ✅ Check if we have a valid token */
  isAuthenticated(): boolean {
    return !!(this.accessToken && !this.isTokenExpired());
  }

  /** ✅ Get token expiry information */
  getTokenInfo(): { hasToken: boolean; isExpired: boolean; expiresAt: Date | null } {
    return {
      hasToken: !!this.accessToken,
      isExpired: this.isTokenExpired(),
      expiresAt: this.tokenExpiryTime ? new Date(this.tokenExpiryTime) : null
    };
  }

  /** ✅ Clear token on logout */
  logout(): void {
    console.log('Logging out - clearing all tokens');
    this.clearStoredToken();
    this.tokenSubject.next('');
    this.refreshTokenSubject.next('');
    this.isRefreshing = false;
  }

  /** ✅ Observable for token changes */
  get token$(): Observable<string> {
    return this.tokenSubject.asObservable();
  }
}