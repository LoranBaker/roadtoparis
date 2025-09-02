import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EmissionData {
  Year: string;
  DE: number;
}

export interface PropertyTypeConfig {
  propertyType: 'single' | 'multi';
  displayName: string;
}

export interface DecarbonizationPath {
  year: string;
  emissions: number;
  energy: number;
  propertyType: 'single' | 'multi';
}

// New interface for bar chart data
export interface BarChartData {
  year: string;
  emissions: number;
  energy: number;
  propertyType: 'single' | 'multi';
  category: 'historical' | 'current' | 'projected'; // To distinguish different data types
  label: string; // Display label for the bar
}

// Combined chart data interface
export interface ChartDataset {
  lineData: DecarbonizationPath[];
  barData: BarChartData[];
}

@Injectable({
  providedIn: 'root'
})
export class EmissionDataService {
  private readonly singleFamilyUrl = 'assets/single_family_data.json';
  private readonly multiFamilyUrl = 'assets/multi_family_data.json';
  private readonly singleFamilyEnergyUrl = 'assets/single_family_energy_data.json';
  private readonly multiFamilyEnergyUrl = 'assets/multi_family_energy_data.json';
  private readonly propertyTypeConfigUrl = 'assets/property_type_config.json';

  constructor(private http: HttpClient) {}

  /**
   * Get property type configuration from API
   */
  getPropertyTypeConfig(): Observable<PropertyTypeConfig> {
    return this.http.get<PropertyTypeConfig>(this.propertyTypeConfigUrl);
  }

  /**
   * Load emission data based on property type
   */
  private loadEmissionDataByType(propertyType: 'single' | 'multi'): Observable<EmissionData[]> {
    const url = propertyType === 'single' ? this.singleFamilyUrl : this.multiFamilyUrl;
    return this.http.get<EmissionData[]>(url);
  }

  /**
   * Load energy data based on property type
   */
  private loadEnergyDataByType(propertyType: 'single' | 'multi'): Observable<EmissionData[]> {
    const url = propertyType === 'single' ? this.singleFamilyEnergyUrl : this.multiFamilyEnergyUrl;
    return this.http.get<EmissionData[]>(url);
  }

  /**
   * Generate dummy bar data for 2025-2027
   * This will be replaced with actual API data later
   */
  private generateBarData(propertyType: 'single' | 'multi'): BarChartData[] {
    const baseEmissions = propertyType === 'single' ? 48 : 52;
    const baseEnergy = propertyType === 'single' ? 170 : 185;

    return [
      {
        year: '2025',
        emissions: baseEmissions,
        energy: baseEnergy,
        propertyType,
        category: 'current',
        label: 'Ist-Zustand 2025'
      },
    ];
  }

  /**
   * Load combined decarbonization path data for a specific property type (2025-2040)
   */
  loadDecarbonizationPath(propertyType: 'single' | 'multi'): Observable<DecarbonizationPath[]> {
    const emissionData$ = this.loadEmissionDataByType(propertyType);
    const energyData$ = this.loadEnergyDataByType(propertyType);

    // Use forkJoin to combine both observables
    return forkJoin({
      emissions: emissionData$,
      energy: energyData$
    }).pipe(
      map(({ emissions, energy }) => {
        // Filter data for 2025-2040 range and combine emission and energy data
        const filteredEmissions = emissions.filter(emission => {
          const year = parseInt(emission.Year);
          return year >= 2025 && year <= 2040;
        });

        const filteredEnergy = energy.filter(energyItem => {
          const year = parseInt(energyItem.Year);
          return year >= 2025 && year <= 2040;
        });

        // Create a map of energy data by year for easy lookup
        const energyByYear = new Map<string, number>();
        filteredEnergy.forEach(energyItem => {
          energyByYear.set(energyItem.Year, energyItem.DE);
        });

        // Combine emission and energy data
        return filteredEmissions.map(emission => ({
          year: emission.Year,
          emissions: emission.DE,
          energy: energyByYear.get(emission.Year) || 0, // Use actual energy data from JSON
          propertyType
        }));
      })
    );
  }

  /**
   * Load combined chart data (both line and bar data)
   */
  loadChartDataset(propertyType: 'single' | 'multi'): Observable<ChartDataset> {
    return this.loadDecarbonizationPath(propertyType).pipe(
      map(lineData => ({
        lineData,
        barData: this.generateBarData(propertyType)
      }))
    );
  }

  /**
   * Get chart data for a specific property type and metric
   */
  getChartData(propertyType: 'single' | 'multi', metric: 'emissions' | 'energy'): Observable<{
    labels: string[];
    data: number[];
    propertyType: 'single' | 'multi';
    metric: 'emissions' | 'energy';
  }> {
    return this.loadDecarbonizationPath(propertyType).pipe(
      map(data => ({
        labels: data.map(d => d.year),
        data: data.map(d => metric === 'emissions' ? d.emissions : d.energy),
        propertyType,
        metric
      }))
    );
  }

  /**
   * Get combined chart data with both line and bar datasets
   */
  getCombinedChartData(propertyType: 'single' | 'multi', metric: 'emissions' | 'energy'): Observable<{
    labels: string[];
    lineData: number[];
    barData: number[];
    barLabels: string[];
    propertyType: 'single' | 'multi';
    metric: 'emissions' | 'energy';
  }> {
    return this.loadChartDataset(propertyType).pipe(
      map(dataset => {
        const { lineData, barData } = dataset;
        
        // Create combined labels (unique years from both datasets)
        const allYears = [...new Set([
          ...barData.map(d => d.year),
          ...lineData.map(d => d.year)
        ])].sort();

        const lineValues = lineData.map(d => metric === 'emissions' ? d.emissions : d.energy);
        const barValues = barData.map(d => metric === 'emissions' ? d.emissions : d.energy);
        const barLabelValues = barData.map(d => d.label);

        return {
          labels: allYears,
          lineData: lineValues,
          barData: barValues,
          barLabels: barLabelValues,
          propertyType,
          metric
        };
      })
    );
  }
}