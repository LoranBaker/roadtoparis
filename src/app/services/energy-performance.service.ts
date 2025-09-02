// energy-performance.service.ts - Updated with new address
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';

export interface PropertyData {
  usage: string;
  rentableArea: number;
  commercialArea: number;
  livingArea: number;
  buildYear: number;
  energyCarrier: string;
}

export interface EnergyData {
  consumption: number;
  co2Emissions: number;
  co2PerM2: number;
  kwhPerM2: number;
}

export interface PropertyAddress {
  street: string;
  city: string;
  postalCode: string;
  fullAddress: string;
}

export interface ApiResponse {
  propertyData: PropertyData;
  energyData: EnergyData;
  address: PropertyAddress;
}

@Injectable({
  providedIn: 'root'
})
export class EnergyPerformanceService {
  
  // BehaviorSubjects for reactive data
  private propertyDataSubject = new BehaviorSubject<PropertyData | null>(null);
  private energyDataSubject = new BehaviorSubject<EnergyData | null>(null);
  private addressSubject = new BehaviorSubject<PropertyAddress | null>(null);
  
  // Public observables
  public propertyData$ = this.propertyDataSubject.asObservable();
  public energyData$ = this.energyDataSubject.asObservable();
  public address$ = this.addressSubject.asObservable();

  constructor() {
    // Initialize with new dummy data for Karlstrasse 22 in 65510 Hünstetten
    this.initializeWithDummyData();
  }

  /**
   * Initialize service with new dummy data for Karlstrasse 22
   */
  private initializeWithDummyData(): void {
    const dummyPropertyData: PropertyData = {
      usage: 'Mix / 4 Einh.',
      rentableArea: 370,
      commercialArea: 50,
      livingArea: 320,
      buildYear: 2004,
      energyCarrier: 'Gaszentralhzg.'
    };

    const dummyEnergyData: EnergyData = {
      consumption: 100000,
      co2Emissions: 15000,
      co2PerM2: 30,
      kwhPerM2: 125
    };

    const dummyAddress: PropertyAddress = {
      street: 'Karlstrasse 22',
      city: 'Hünstetten',
      postalCode: '65510',
      fullAddress: 'Karlstrasse 22 in 65510 Hünstetten'
    };

    // Set initial data
    this.propertyDataSubject.next(dummyPropertyData);
    this.energyDataSubject.next(dummyEnergyData);
    this.addressSubject.next(dummyAddress);
  }

  /**
   * Get property and energy data (returns immediately with new dummy data)
   */
  getPropertyEnergyData(propertyId?: string): Observable<ApiResponse> {
    return of({
      propertyData: {
        usage: 'Einfamilienhaus',
        rentableArea: 180,
        commercialArea: 0,
        livingArea: 180,
        buildYear: 1995,
        energyCarrier: 'Wärmepumpe'
      },
      energyData: {
        consumption: 8500,
        co2Emissions: 1200,
        co2PerM2: 6.7,
        kwhPerM2: 47
      },
      address: {
        street: 'Karlstrasse 22',
        city: 'Hünstetten',
        postalCode: '65510',
        fullAddress: 'Karlstrasse 22 in 65510 Hünstetten'
      }
    });
  }

  /**
   * Update property data
   */
  updatePropertyData(propertyData: PropertyData): void {
    this.propertyDataSubject.next(propertyData);
  }

  /**
   * Update energy data
   */
  updateEnergyData(energyData: EnergyData): void {
    this.energyDataSubject.next(energyData);
  }

  /**
   * Update address data
   */
  updateAddress(address: PropertyAddress): void {
    this.addressSubject.next(address);
  }

  /**
   * Get current property data (synchronous)
   */
  getCurrentPropertyData(): PropertyData | null {
    return this.propertyDataSubject.value;
  }

  /**
   * Get current energy data (synchronous)
   */
  getCurrentEnergyData(): EnergyData | null {
    return this.energyDataSubject.value;
  }

  /**
   * Get current address (synchronous)
   */
  getCurrentAddress(): PropertyAddress | null {
    return this.addressSubject.value;
  }

  /**
   * Reset all data to initial state
   */
  resetData(): void {
    this.initializeWithDummyData();
  }

  /**
   * Calculate total area (convenience method)
   */
  calculateTotalArea(): number {
    const propertyData = this.getCurrentPropertyData();
    if (!propertyData) return 0;
    return propertyData.rentableArea + propertyData.commercialArea;
  }

  /**
   * Check if property is residential (convenience method)
   */
  isResidential(): boolean {
    const propertyData = this.getCurrentPropertyData();
    if (!propertyData) return false;
    return propertyData.livingArea > propertyData.commercialArea;
  }

  /**
   * Get building age (convenience method)
   */
  getBuildingAge(): number {
    const propertyData = this.getCurrentPropertyData();
    if (!propertyData) return 0;
    return new Date().getFullYear() - propertyData.buildYear;
  }

  /**
   * Get formatted energy carrier for display (convenience method)
   */
  getFormattedEnergyCarrier(): string {
    const propertyData = this.getCurrentPropertyData();
    if (!propertyData) return '';
    
    const carrierMap: { [key: string]: string } = {
      'Gaszentralhzg.': 'Gas Central Heating',
      'Fernwärme': 'District Heating',
      'Öl': 'Oil Heating',
      'Strom': 'Electric Heating',
      'Wärmepumpe': 'Heat Pump'
    };
    
    return carrierMap[propertyData.energyCarrier] || propertyData.energyCarrier;
  }
}