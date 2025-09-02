// co2-rent-data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CO2RentDataItem {
  jahr: number;
  preisTonneCO2: number;
  wert: number; // Property value in €
  mieteinnahme: number; // Rental income in €
  mietrendite: number; // Rental yield in %
  co2EmissionsTons: number; // CO2 emissions in tons
  isHighlighted?: boolean; // For years 2025, 2032, 2033, 2040
}

export interface CO2TaxProjection {
  year: number;
  costPerYear: number;
  costPerTonne: number;
  description: string;
  isEstimate: boolean;
  source: string;
}

export interface RentYieldData {
  year: number;
  yieldPercentage: number;
  decline: number;
}

@Injectable({
  providedIn: 'root'
})
export class Co2RentDataService {
  
  // CO2 Tax data from your image (2025-2040)
  private co2RentData: CO2RentDataItem[] = [
    {
      jahr: 2025,
      preisTonneCO2: 55.00,
      wert: 500000, // Example property value
      mieteinnahme: 36000, // Example rental income
      mietrendite: 7.2,
      co2EmissionsTons: 8.5,
      isHighlighted: true
    },
    {
      jahr: 2026,
      preisTonneCO2: 65.00,
      wert: 495000,
      mieteinnahme: 35500,
      mietrendite: 7.2,
      co2EmissionsTons: 8.3
    },
    {
      jahr: 2027,
      preisTonneCO2: 75.00,
      wert: 490000,
      mieteinnahme: 35000,
      mietrendite: 7.1,
      co2EmissionsTons: 8.1
    },
    {
      jahr: 2028,
      preisTonneCO2: 120.00,
      wert: 485000,
      mieteinnahme: 34500,
      mietrendite: 7.1,
      co2EmissionsTons: 7.9
    },
    {
      jahr: 2029,
      preisTonneCO2: 160.00,
      wert: 480000,
      mieteinnahme: 34000,
      mietrendite: 7.1,
      co2EmissionsTons: 7.7
    },
    {
      jahr: 2030,
      preisTonneCO2: 200.00,
      wert: 475000,
      mieteinnahme: 33500,
      mietrendite: 7.1,
      co2EmissionsTons: 7.5
    },
    {
      jahr: 2031,
      preisTonneCO2: 210.00,
      wert: 470000,
      mieteinnahme: 33000,
      mietrendite: 7.0,
      co2EmissionsTons: 7.3
    },
    {
      jahr: 2032,
      preisTonneCO2: 220.00,
      wert: 465000,
      mieteinnahme: 32500,
      mietrendite: 7.0,
      co2EmissionsTons: 7.1,
      isHighlighted: true
    },
    {
      jahr: 2033,
      preisTonneCO2: 230.00,
      wert: 460000,
      mieteinnahme: 32000,
      mietrendite: 7.0,
      co2EmissionsTons: 6.9,
      isHighlighted: true
    },
    {
      jahr: 2034,
      preisTonneCO2: 240.00,
      wert: 455000,
      mieteinnahme: 31500,
      mietrendite: 6.9,
      co2EmissionsTons: 6.7
    },
    {
      jahr: 2035,
      preisTonneCO2: 250.00,
      wert: 450000,
      mieteinnahme: 31000,
      mietrendite: 6.9,
      co2EmissionsTons: 6.5
    },
    {
      jahr: 2036,
      preisTonneCO2: 260.00,
      wert: 445000,
      mieteinnahme: 30500,
      mietrendite: 6.9,
      co2EmissionsTons: 6.3
    },
    {
      jahr: 2037,
      preisTonneCO2: 270.00,
      wert: 440000,
      mieteinnahme: 30000,
      mietrendite: 6.8,
      co2EmissionsTons: 6.1
    },
    {
      jahr: 2038,
      preisTonneCO2: 280.00,
      wert: 435000,
      mieteinnahme: 29500,
      mietrendite: 6.8,
      co2EmissionsTons: 5.9
    },
    {
      jahr: 2039,
      preisTonneCO2: 290.00,
      wert: 430000,
      mieteinnahme: 29000,
      mietrendite: 6.7,
      co2EmissionsTons: 5.7
    },
    {
      jahr: 2040,
      preisTonneCO2: 300.00,
      wert: 425000,
      mieteinnahme: 28500,
      mietrendite: 6.7,
      co2EmissionsTons: 5.5,
      isHighlighted: true
    }
  ];

  // BehaviorSubjects for reactive data
  private co2RentDataSubject = new BehaviorSubject<CO2RentDataItem[]>(this.co2RentData);
  private co2TaxProjectionsSubject = new BehaviorSubject<CO2TaxProjection[]>(this.getCO2TaxProjections());

  constructor() {}

  /**
   * Get all CO2 and rent data
   */
  getCO2RentData(): Observable<CO2RentDataItem[]> {
    return this.co2RentDataSubject.asObservable();
  }

  /**
   * Get CO2 tax projections for key years
   */
  getCO2TaxProjections(): CO2TaxProjection[] {
    return [
      {
        year: 2026,
        costPerYear: this.calculateYearlyCO2Cost(2026),
        costPerTonne: 65.00,
        description: '65 €/t CO2 im Jahre 2026',
        isEstimate: false,
        source: 'legal'
      },
      {
        year: 2027,
        costPerYear: this.calculateYearlyCO2Cost(2027),
        costPerTonne: 75.00,
        description: '75 €/t CO2 im Jahre 2027*',
        isEstimate: true,
        source: 'tradeable'
      },
      {
        year: 2030,
        costPerYear: this.calculateYearlyCO2Cost(2030),
        costPerTonne: 200.00,
        description: '200 €/t CO2 im Jahre 2030**',
        isEstimate: true,
        source: 'scientific'
      },
      {
        year: 2040,
        costPerYear: this.calculateYearlyCO2Cost(2040),
        costPerTonne: 300.00,
        description: '300 €/t CO2 im Jahre 2040***',
        isEstimate: true,
        source: 'industry'
      }
    ];
  }

  /**
   * Get rent yield data for chart
   */
  getRentYieldData(): RentYieldData[] {
    const baseYield = 7.2; // 2025 baseline
    return [
      {
        year: 2025,
        yieldPercentage: 7.2,
        decline: 0
      },
      {
        year: 2030,
        yieldPercentage: 7.1,
        decline: Math.round(((baseYield - 7.1) / baseYield) * 100)
      },
      {
        year: 2035,
        yieldPercentage: 6.9,
        decline: Math.round(((baseYield - 6.9) / baseYield) * 100)
      },
      {
        year: 2040,
        yieldPercentage: 6.7,
        decline: Math.round(((baseYield - 6.7) / baseYield) * 100)
      }
    ];
  }

  /**
   * Get chart data for CO2 percentage visualization
   */
  getChartDataPoints(): { year: number; percentage: number; cost: number }[] {
    return this.co2RentData.map(item => ({
      year: item.jahr,
      percentage: this.calculateCO2Percentage(item),
      cost: this.calculateYearlyCO2Cost(item.jahr)
    }));
  }

  /**
   * Calculate yearly CO2 cost based on emissions and price per tonne
   */
  private calculateYearlyCO2Cost(year: number): number {
    const data = this.co2RentData.find(item => item.jahr === year);
    if (!data) return 0;
    return Math.round(data.co2EmissionsTons * data.preisTonneCO2);
  }

  /**
   * Calculate CO2 cost as percentage of rental income
   */
  private calculateCO2Percentage(item: CO2RentDataItem): number {
    const yearlyCO2Cost = item.co2EmissionsTons * item.preisTonneCO2;
    return Math.round((yearlyCO2Cost / item.mieteinnahme) * 100 * 10) / 10; // Round to 1 decimal
  }

  /**
   * Update data (for future API integration)
   */
  updateCO2RentData(newData: CO2RentDataItem[]): void {
    this.co2RentData = newData;
    this.co2RentDataSubject.next(newData);
  }

  /**
   * Get data for specific year
   */
  getDataByYear(year: number): CO2RentDataItem | undefined {
    return this.co2RentData.find(item => item.jahr === year);
  }

  /**
   * Get highlighted years data
   */
  getHighlightedYearsData(): CO2RentDataItem[] {
    return this.co2RentData.filter(item => item.isHighlighted);
  }

  /**
   * Format currency values
   */
  formatCurrency(value: number): string {
    return value.toLocaleString('de-DE');
  }

  /**
   * Get CO2 emissions trend
   */
  getCO2EmissionsTrend(): { year: number; emissions: number; reduction: number }[] {
    const baseYear = this.co2RentData[0];
    return this.co2RentData.map(item => ({
      year: item.jahr,
      emissions: item.co2EmissionsTons,
      reduction: Math.round(((baseYear.co2EmissionsTons - item.co2EmissionsTons) / baseYear.co2EmissionsTons) * 100)
    }));
  }

  /**
   * Calculate total CO2 costs over period
   */
  getTotalCO2CostsOverPeriod(startYear: number = 2025, endYear: number = 2040): number {
    return this.co2RentData
      .filter(item => item.jahr >= startYear && item.jahr <= endYear)
      .reduce((total, item) => total + (item.co2EmissionsTons * item.preisTonneCO2), 0);
  }

  /**
   * Get average rent yield decline per year
   */
  getAverageYearlyRentDecline(): number {
    const totalYears = this.co2RentData.length - 1;
    const startYield = this.co2RentData[0].mietrendite;
    const endYield = this.co2RentData[this.co2RentData.length - 1].mietrendite;
    return Math.round(((startYield - endYield) / totalYears) * 100) / 100;
  }
}