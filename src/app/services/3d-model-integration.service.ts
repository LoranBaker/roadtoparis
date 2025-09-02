// 3d-model-integration.service.ts - Fixed to match original Building3DService behavior
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError, timer } from 'rxjs';
import { map, switchMap, catchError, tap, retry, retryWhen, delayWhen, take } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { environment } from '../../enviroments/enviroment';

export interface Building3DModel {
  buildingId: string;
  objData: string;
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  metadata?: {
    vertexCount: number;
    faceCount: number;
    size: number;
  };
}

export interface AddressSearchResult {
  buildingId: string;
  address: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  hasModel: boolean;
}

export interface RequestDebugInfo {
  url: string;
  headers: { [key: string]: string };
  timestamp: Date;
  attempt: number;
  response?: {
    status: number;
    statusText: string;
    headers: { [key: string]: string };
    body?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class Model3DIntegrationService {
  private baseUrl = environment.api.baseUrl;
  
  // Cache for loaded models
  private modelCache = new Map<string, Building3DModel>();
  
  // Loading state management
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Debug information storage
  private requestDebugLog: RequestDebugInfo[] = [];
  
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * 🔍 DEBUG: Get detailed request debug information
   */
  getRequestDebugLog(): RequestDebugInfo[] {
    return [...this.requestDebugLog];
  }

  /**
   * 🔍 DEBUG: Clear debug log
   */
  clearDebugLog(): void {
    this.requestDebugLog = [];
  }

  /**
   * 🔍 DEBUG: Get latest request info for building ID
   */
  getLatestRequestForBuilding(buildingId: string): RequestDebugInfo | null {
    return this.requestDebugLog
      .filter(req => req.url.includes(buildingId))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] || null;
  }

  /**
   * ✅ Enhanced HTTP request matching original Building3DService exactly
   */
  private makeAuthenticatedRequest<T>(
    url: string, 
    options: { headers?: HttpHeaders; responseType?: any } = {}
  ): Observable<T> {
    return this.authService.getAccessToken().pipe(
      switchMap(token => {
        // EXACTLY match original service headers
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'X-API-Key': environment.api.apiKey,
          ...options.headers?.keys().reduce((acc, key) => {
            acc[key] = options.headers!.get(key) || '';
            return acc;
          }, {} as any)
        });

        const requestOptions = {
          ...options,
          headers
        };

        // 🔍 DEBUG: Log detailed request information
        const debugInfo: RequestDebugInfo = {
          url,
          headers: this.headersToObject(headers),
          timestamp: new Date(),
          attempt: this.requestDebugLog.filter(r => r.url === url).length + 1
        };

        //

        // Store debug info
        this.requestDebugLog.push(debugInfo);

        return this.http.get<T>(url, requestOptions).pipe(
          tap(response => {
            // 🔍 DEBUG: Log successful response
            debugInfo.response = {
              status: 200,
              statusText: 'OK',
              headers: {},
              body: typeof response === 'string' ? `${response.length} characters` : response
            };
            //
          }),
          catchError((error: HttpErrorResponse) => {
            // 🔍 DEBUG: Log error response
            debugInfo.response = {
              status: error.status,
              statusText: error.statusText,
              headers: this.headersToObject(error.headers),
              body: error.error
            };
            //
            return throwError(() => error);
          })
        );
      }),
      // EXACTLY match original retry logic
      retryWhen(errors =>
        errors.pipe(
          switchMap((error: HttpErrorResponse, index) => {
            //
            
            // Handle 401 Unauthorized errors - EXACTLY like original
            if (error.status === 401 && index < 2) {
              //
              return this.authService.handleUnauthorizedError().pipe(
                delayWhen(() => new Promise(resolve => setTimeout(resolve, 1000))) // Small delay
              );
            }
            
            // Handle network errors (but limit retries) - EXACTLY like original
            if (error.status === 0 && index < 1) {
              //
              return new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Don't retry other errors - EXACTLY like original
            return throwError(() => error);
          }),
          take(3) // Maximum 3 total attempts - EXACTLY like original
        )
      ),
      catchError((error: HttpErrorResponse) => {
        //
        
        // EXACTLY match original error message logic
        let errorMessage = 'Unbekannter Fehler';
        if (error.status === 0) {
          errorMessage = 'Netzwerkfehler - Bitte prüfen Sie Ihre Internetverbindung';
        } else if (error.status === 401) {
          errorMessage = 'Authentifizierungsfehler - Bitte versuchen Sie es später erneut';
        } else if (error.status === 403) {
          errorMessage = 'Zugriff verweigert - Unzureichende Berechtigung';
        } else if (error.status === 404) {
          errorMessage = 'Keine Daten gefunden';
        } else if (error.status === 429) {
          errorMessage = 'Zu viele Anfragen - Bitte warten Sie einen Moment';
        } else if (error.status >= 500) {
          errorMessage = 'Serverfehler - Bitte versuchen Sie es später erneut';
        }
        
        this.errorSubject.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * 🔍 DEBUG: Convert HttpHeaders to plain object for logging
   */
  private headersToObject(headers: HttpHeaders): { [key: string]: string } {
    const headerObj: { [key: string]: string } = {};
    if (headers) {
      headers.keys().forEach(key => {
        headerObj[key] = headers.get(key) || '';
      });
    }
    return headerObj;
  }

  /**
   * 🔍 DEBUG: Make a direct comparison request (like Postman)
   */
  makeDirectRequest(buildingId: string): Observable<any> {
    const url = `${this.baseUrl}/building-models?buildingIds=${encodeURIComponent(buildingId)}`;
    
    //
    
    return this.authService.getAccessToken().pipe(
      switchMap(token => {
        // Minimal headers like Postman might use - EXACTLY like original
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'X-API-Key': environment.api.apiKey
        });

        //

        return this.http.get(url, { 
          headers, 
          responseType: 'text',
          observe: 'response' // Get full response including headers
        }).pipe(
          tap(response => {
          //
          }),
          map(response => response.body),
          catchError(error => {
            //
            return throwError(() => error);
          })
        );
      })
    );
  }

  /**
   * ✅ Get 3D model - EXACTLY matching original Building3DService behavior
   */
  getBuilding3DModel(buildingId: string): Observable<Building3DModel | null> {
    // Only make API calls in browser - EXACTLY like original
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    if (!buildingId || buildingId.trim().length === 0) {
      return of(null);
    }

    // Check cache first - EXACTLY like original
    if (this.modelCache.has(buildingId)) {
      return of(this.modelCache.get(buildingId)!);
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const url = `${this.baseUrl}/building-models?buildingIds=${encodeURIComponent(buildingId)}`;

    return this.makeAuthenticatedRequest<string>(url, { responseType: 'text' }).pipe(
      map(objData => {
        if (!objData || objData.trim().length === 0) {
          throw new Error('Empty model data received');
        }

        // Basic validation of OBJ data - EXACTLY like original
        if (!objData.includes('v ') && !objData.includes('f ')) {
          throw new Error('Invalid OBJ format - no vertices or faces found');
        }

        const model: Building3DModel = {
          buildingId,
          objData,
          metadata: this.extractModelMetadata(objData)
        };

        //

        // Cache the model - EXACTLY like original
        this.modelCache.set(buildingId, model);
        
        return model;
      }),
      tap({
        next: () => this.loadingSubject.next(false),
        error: () => this.loadingSubject.next(false)
      }),
      catchError(error => {
        //
        this.loadingSubject.next(false);
        return of(null);  // EXACTLY like original - return null on error
      })
    );
  }

  /**
   * ✅ Search for buildings by address - EXACTLY matching original
   */
  searchBuildingsByAddress(address: string): Observable<AddressSearchResult[]> {
    // Only make API calls in browser - EXACTLY like original
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    if (!address || address.trim().length === 0) {
      return of([]);
    }

    //
    this.errorSubject.next(null);

    const url = `${this.baseUrl}/buildings?address=${encodeURIComponent(address.trim())}`;
    
    return this.makeAuthenticatedRequest<any>(url).pipe(
      map(response => {
        //
        
        if (!response || !response.features || !Array.isArray(response.features)) {
          //
          return [];
        }

        if (response.features.length === 0) {
          //
          return [];
        }

        const results = response.features.map((feature: any, index: number): AddressSearchResult | null => {
          try {
            const props = feature.properties || {};
            const coords = feature.geometry?.coordinates || [0, 0];
            
            const result: AddressSearchResult = {
              buildingId: props.buildingId || `unknown_${index}`,
              address: this.constructAddress(props),
              coordinates: {
                lat: coords[1] || 0,
                lon: coords[0] || 0
              },
              hasModel: !!props.buildingId
            };
            
            //
            return result;
          } catch (err) {
            console.warn('⚠️ Error processing feature:', feature, err);
            return null;
          }
        }).filter((result: AddressSearchResult | null): result is AddressSearchResult => result !== null);

        //
        return results;
      }),
      catchError(error => {
        //
        return of([]);
      })
    );
  }

  /**
   * ✅ Get the first available building ID for an address - EXACTLY like original
   */
  getBuildingIdByAddress(address: string): Observable<string | null> {
    return this.searchBuildingsByAddress(address).pipe(
      map(results => {
        const buildingWithModel = results.find(r => r.hasModel && r.buildingId);
        return buildingWithModel?.buildingId || null;
      })
    );
  }

  /**
   * ✅ Check if a 3D model is available for an address - EXACTLY like original
   */
  hasModelForAddress(address: string): Observable<boolean> {
    return this.searchBuildingsByAddress(address).pipe(
      map(results => {
        const hasModel = results.some(r => r.hasModel);
        return hasModel;
      })
    );
  }

  /**
   * ✅ Clear the model cache - EXACTLY like original
   */
  clearCache(): void {
    //
    this.modelCache.clear();
  }

  /**
   * ✅ Get cache size info - enhanced for debugging
   */
  getCacheInfo(): { count: number; buildingIds: string[] } {
    return {
      count: this.modelCache.size,
      buildingIds: Array.from(this.modelCache.keys())
    };
  }

  /**
   * ✅ Extract metadata from OBJ data - EXACTLY like original
   */
  private extractModelMetadata(objData: string): Building3DModel['metadata'] {
    const lines = objData.split('\n');
    let vertexCount = 0;
    let faceCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('v ')) {
        vertexCount++;
      } else if (trimmed.startsWith('f ')) {
        faceCount++;
      }
    }

    return {
      vertexCount,
      faceCount,
      size: objData.length
    };
  }

  /**
   * ✅ Construct address string from building properties - EXACTLY like original
   */
  private constructAddress(props: any): string {
    const parts = [];
    
    if (props.street) parts.push(props.street);
    if (props.houseNumber) parts.push(props.houseNumber);
    if (props.postalCode) parts.push(props.postalCode);
    if (props.place) parts.push(props.place);
    
    return parts.join(' ') || 'Unbekannte Adresse';
  }

  /**
   * ✅ Reset loading and error states - EXACTLY like original
   */
  resetState(): void {
    //
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
  }

  /**
   * ✅ Get current authentication status - EXACTLY like original
   */
  getAuthStatus(): { isAuthenticated: boolean; tokenInfo: any } {
    return {
      isAuthenticated: this.authService.isAuthenticated(),
      tokenInfo: this.authService.getTokenInfo()
    };
  }

  /**
   * ✅ Manually refresh authentication token - EXACTLY like original
   */
  refreshAuth(): Observable<boolean> {
    return this.authService.refreshToken().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}