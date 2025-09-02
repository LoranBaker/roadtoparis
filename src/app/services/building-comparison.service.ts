// building-comparison.service.ts - Updated with removed comparison subtitle text
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EnergyPerformanceService } from './energy-performance.service';

export interface EnergyClassData {
  class: string;
  percentage: number;
  color: string;
  description: string;
}

export interface EnvironmentalImpact {
  title: string;
  value: string;
  unit: string;
  description: string;
  icon: string;
  type: 'car' | 'tree' | 'co2';
}

export interface SavingsPotential {
  title: string;
  value: string;
  unit: string;
  description: string;
  type: 'energy' | 'cost' | 'co2';
}

export interface FundingOption {
  title: string;
  description: string;
  amount: string;
  details: string;
  logo?: string;
}

export interface BuildingComparisonData {
  currentBuildingClass: string;
  currentBuildingPercentage: number;
  comparisonTitle: string;
  comparisonSubtitle: string;
  savingsTitle: string;
  fundingTitle: string;
  disclaimerText: string;
}

@Injectable({
  providedIn: 'root'
})
export class BuildingComparisonService {
  
  // BehaviorSubjects for reactive data - Updated with exact data from image
  private energyClassDataSubject = new BehaviorSubject<EnergyClassData[]>([
    { 
      class: 'A+', 
      percentage: 2.7, 
      color: '#22c55e', 
      description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die höchste Energieeffizienzklasse mit 2,7% der Gebäude in der BRD.' 
    },
    { 
      class: 'A', 
      percentage: 3.5, 
      color: '#84cc16', 
      description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die höchsten Energieeffizienzklassen. Nur 2,7% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' 
    },
    { 
      class: 'B', 
      percentage: 7.0, 
      color: '#eab308', 
      description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in eine hohe Energieeffizienzklasse. 6,2% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' 
    },
    { 
      class: 'C', 
      percentage: 14.4, 
      color: '#f97316', 
      description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die mittleren Energieeffizienzklassen. 13,2% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' 
    },
    { 
      class: 'D', 
      percentage: 20.8, 
      color: '#ef4444', 
      description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die mittleren Energieeffizienzklassen. 27,6% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' 
    },
    { 
      class: 'E', 
      percentage: 15.8, 
      color: '#dc2626', 
      description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in eine schlechte Energieeffizienzklasse. 48,4% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' 
    },
    { 
      class: 'F', 
      percentage: 13.5, 
      color: '#991b1b', 
      description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die schlechten Energieeffizienzklassen. 64,2% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' 
    },
    { 
      class: 'G', 
      percentage: 9.8, 
      color: '#7f1d1d', 
      description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die schlechtesten Energieeffizienzklassen. 77,7% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' 
    },
    { 
      class: 'H', 
      percentage: 12.5, 
      color: '#450a0a', 
      description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die schlechteste Energieeffizienzklasse. 87,5% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' 
    }
  ]);

  private environmentalImpactsSubject = new BehaviorSubject<EnvironmentalImpact[]>([]);

  private savingsPotentialsSubject = new BehaviorSubject<SavingsPotential[]>([
    {
      title: '85.000 kWh',
      value: '85.000',
      unit: 'kWh',
      description: 'Jährliche Energieeinsparungen - Die geschätzte Energieeinsparung, die Ihr Gebäude mit der Strategie von Envalpro erzielen kann.',
      type: 'energy'
    },
    {
      title: '7.980 €',
      value: '7.980',
      unit: '€',
      description: 'Jährliche betriebliche Einsparungen - Die geschätzten Einsparungen beim Energieverbrauch des Gebäudes und bei der CO₂-Steuer* (*Jahr 2030 wird als Basis herangezogen)',
      type: 'cost'
    },
    {
      title: '14.000 KG CO₂',
      value: '14.000',
      unit: 'KG CO₂',
      description: 'Jährliche CO2-Reduzierung - Die geschätzte Reduzierung der CO₂-Emissionen, die Ihr Gebäude mit der Strategie von ENVALPRO erreichen kann.',
      type: 'co2'
    }
  ]);

  private fundingOptionsSubject = new BehaviorSubject<FundingOption[]>([
    {
      title: 'von 15% bis 45%',
      description: 'der Kosten bei Erreichung Effizienzhaus-Niveau',
      amount: '*begrenzt auf 150.000 € / Effizienzhaus 45 EE',
      details: 'Förderhöchstgrenze für Einzelmaßnahmen für WE.'
    },
    {
      title: '60tsd €',
      description: '(90tsd € mit Heizung)',
      amount: 'KfW',
      details: 'Förderhöchstgrenze für Einzelmaßnahmen für WE.'
    }
  ]);

  private buildingComparisonSubject = new BehaviorSubject<BuildingComparisonData>({
    currentBuildingClass: 'B',
    currentBuildingPercentage: 6.2,
    comparisonTitle: 'Wie schneidet Ihre Immobilie im bundesweiten Vergleich ab?',
    comparisonSubtitle: '', // REMOVED: Text has been cleared
    savingsTitle: 'Das Einsparpotenzial Ihres Gebäudes mit unserer Hilfe',
    fundingTitle: 'Mögliche Förderungen für energieeff. Sanierungsmaßnahmen',
    disclaimerText: 'Die in diesem Bericht berechneten und aufgezeigten Ergebnisse beruhen auf der DIN 18599 Grundlage und dienen als vorläufige Analyse, nach Ihren eingegebenen Daten. Sie ersetzen keine detaillierte Vor-Ort-Begehung Ihrer Immobilie durch einen Energieberater / Energieexperten von ENVALPRO. Änderungen der berechneten Ergebnisse in der vorläufigen Analyse und des berechneten energetischen IST-Zustand und der daraus folgenden Einsparungen sind vorbehalten.'
  });
  
  // Public observables
  public energyClassData$ = this.energyClassDataSubject.asObservable();
  public environmentalImpacts$ = this.environmentalImpactsSubject.asObservable();
  public savingsPotentials$ = this.savingsPotentialsSubject.asObservable();
  public fundingOptions$ = this.fundingOptionsSubject.asObservable();
  public buildingComparison$ = this.buildingComparisonSubject.asObservable();

  constructor(private energyPerformanceService: EnergyPerformanceService) {
    // Initialize environmental impacts with calculated values
    this.calculateEnvironmentalImpacts();
    // Subscribe to energy data changes to recalculate impacts
    this.energyPerformanceService.energyData$.subscribe(energyData => {
      if (energyData) {
        this.calculateEnvironmentalImpacts();
      }
    });
  }

  /**
   * Calculate environmental impacts based on CO₂ emissions from energy performance service
   */
  private calculateEnvironmentalImpacts(): void {
    const energyData = this.energyPerformanceService.getCurrentEnergyData();
    if (!energyData) return;

    const co2Emissions = energyData.co2Emissions; // This is 15000 kg

    // Calculate car kilometers: co2Emissions / 0.12 (kg CO₂ per km)
    const carKilometers = Math.round(co2Emissions / 0.12);
    
    // Calculate trees needed: co2Emissions / 15 (kg CO₂ per tree per year)
    const treesNeeded = Math.round(co2Emissions / 15);
    
    const calculatedImpacts: EnvironmentalImpact[] = [
      {
        title: `${carKilometers.toLocaleString('de-DE')} KM mit PKW`,
        value: carKilometers.toLocaleString('de-DE'),
        unit: 'KM mit PKW',
        description: 'Entspricht der jährlichen Fahrleistung',
        icon: 'M12 14l4-4H8l4 4z',
        type: 'car'
      },
      {
        title: `${treesNeeded.toLocaleString('de-DE')} Bäume die CO₂ aufnehmen`,
        value: treesNeeded.toLocaleString('de-DE'),
        unit: 'Bäume die CO₂ aufnehmen',
        description: 'Anzahl Bäume für CO₂-Kompensation',
        icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        type: 'tree'
      },
      {
        title: '15 Tonnen CO₂ Emissionen',
        value: '15',
        unit: 'Tonnen CO₂ Emissionen',
        description: 'Jährlicher CO₂-Ausstoß des Gebäudes',
        icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
        type: 'co2'
      }
    ];

    this.environmentalImpactsSubject.next(calculatedImpacts);
  }

  /**
   * Update energy class data
   */
  updateEnergyClassData(energyClassData: EnergyClassData[]): void {
    this.energyClassDataSubject.next(energyClassData);
  }

  /**
   * Update environmental impacts (manual override)
   */
  updateEnvironmentalImpacts(environmentalImpacts: EnvironmentalImpact[]): void {
    this.environmentalImpactsSubject.next(environmentalImpacts);
  }

  /**
   * Update savings potentials
   */
  updateSavingsPotentials(savingsPotentials: SavingsPotential[]): void {
    this.savingsPotentialsSubject.next(savingsPotentials);
  }

  /**
   * Update funding options
   */
  updateFundingOptions(fundingOptions: FundingOption[]): void {
    this.fundingOptionsSubject.next(fundingOptions);
  }

  /**
   * Update building comparison data
   */
  updateBuildingComparison(buildingComparison: BuildingComparisonData): void {
    this.buildingComparisonSubject.next(buildingComparison);
  }

  /**
   * Get current energy class data (synchronous)
   */
  getCurrentEnergyClassData(): EnergyClassData[] {
    return this.energyClassDataSubject.value;
  }

  /**
   * Get current environmental impacts (synchronous)
   */
  getCurrentEnvironmentalImpacts(): EnvironmentalImpact[] {
    return this.environmentalImpactsSubject.value;
  }

  /**
   * Get current savings potentials (synchronous)
   */
  getCurrentSavingsPotentials(): SavingsPotential[] {
    return this.savingsPotentialsSubject.value;
  }

  /**
   * Get current funding options (synchronous)
   */
  getCurrentFundingOptions(): FundingOption[] {
    return this.fundingOptionsSubject.value;
  }

  /**
   * Get current building comparison (synchronous)
   */
  getCurrentBuildingComparison(): BuildingComparisonData {
    return this.buildingComparisonSubject.value;
  }

  /**
   * Calculate total potential savings (convenience method)
   */
  calculateTotalSavings(): { energy: number, cost: number, co2: number } {
    const savings = this.getCurrentSavingsPotentials();
    return {
      energy: parseInt(savings.find(s => s.type === 'energy')?.value.replace(/\D/g, '') || '0'),
      cost: parseInt(savings.find(s => s.type === 'cost')?.value.replace(/\D/g, '') || '0'),
      co2: parseInt(savings.find(s => s.type === 'co2')?.value.replace(/\D/g, '') || '0')
    };
  }

  /**
   * Get efficiency class color (convenience method)
   */
  getEfficiencyClassColor(className: string): string {
    const classData = this.getCurrentEnergyClassData().find(c => c.class === className);
    return classData?.color || '#gray';
  }

  /**
   * Get building efficiency ranking (convenience method)
   */
  getBuildingEfficiencyRanking(): string {
    const comparison = this.getCurrentBuildingComparison();
    const percentage = comparison.currentBuildingPercentage;
    if (percentage <= 5) return 'Excellent';
    if (percentage <= 15) return 'Very Good';
    if (percentage <= 30) return 'Good';
    if (percentage <= 50) return 'Average';
    return 'Below Average';
  }

  /**
   * Calculate ROI for energy improvements (convenience method)
   */
  calculateROI(investmentCost: number): number {
    const totalSavings = this.calculateTotalSavings();
    if (investmentCost <= 0) return 0;
    return Math.round((totalSavings.cost / investmentCost) * 100);
  }

  /**
   * Get environmental impact equivalent (convenience method)
   */
  getEnvironmentalEquivalent(type: 'car' | 'tree' | 'co2'): string {
    const impacts = this.getCurrentEnvironmentalImpacts();
    const impact = impacts.find(i => i.type === type);
    return impact ? `${impact.value} ${impact.unit}` : 'N/A';
  }

  /**
   * Recalculate environmental impacts (public method for manual refresh)
   */
  recalculateEnvironmentalImpacts(): void {
    this.calculateEnvironmentalImpacts();
  }

  /**
   * Validate energy class data totals to 100% (utility method)
   */
  validateEnergyClassData(): { isValid: boolean, total: number } {
    const data = this.getCurrentEnergyClassData();
    const total = data.reduce((sum, item) => sum + item.percentage, 0);
    return {
      isValid: Math.abs(total - 100) < 0.1, // Allow for floating point precision
      total: Math.round(total * 10) / 10
    };
  }

  /**
   * Get energy class data for specific class (utility method)
   */
  getEnergyClassInfo(className: string): EnergyClassData | undefined {
    return this.getCurrentEnergyClassData().find(c => c.class === className);
  }

  /**
   * Get cumulative percentage up to specific class (utility method)
   */
  getCumulativePercentage(className: string): number {
    const data = this.getCurrentEnergyClassData();
    const classIndex = data.findIndex(c => c.class === className);
    if (classIndex === -1) return 0;
    
    return data.slice(0, classIndex + 1).reduce((sum, item) => sum + item.percentage, 0);
  }
}