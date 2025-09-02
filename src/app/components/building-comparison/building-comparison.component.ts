// building-comparison.component.ts - Enhanced version with bar chart
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';

// Import Chart.js
import {
  Chart,
  ChartConfiguration,
  ChartData,
  registerables,
  TooltipItem,
  ScriptableContext
} from 'chart.js/auto';

// Import service and interfaces
import {
  BuildingComparisonService,
  EnergyClassData,
  EnvironmentalImpact,
  SavingsPotential,
  FundingOption,
  BuildingComparisonData
} from '../../services/building-comparison.service';

// Register Chart.js components only in browser
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

@Component({
  selector: 'app-building-comparison',
  templateUrl: './building-comparison.component.html',
  styleUrls: ['./building-comparison.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuildingComparisonComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('energyChart', { static: false }) energyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  
  mounted = false;
  cardsVisible = false;
  energyChart: Chart | null = null;
  barChart: Chart | null = null;
  private isBrowser: boolean;

  // Enhanced data from image with exact values
  energyClassData: EnergyClassData[] = [
    { class: 'A+', percentage: 2.7, color: '#22c55e', description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die höchste Energieeffizienzklasse mit 2,7% der Gebäude in der BRD.' },
    { class: 'A', percentage: 3.5, color: '#84cc16', description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die höchsten Energieeffizienzklassen. Nur 2,7% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' },
    { class: 'B', percentage: 7.0, color: '#eab308', description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in eine hohe Energieeffizienzklasse. 6,2% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' },
    { class: 'C', percentage: 14.4, color: '#f97316', description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die mittleren Energieeffizienzklassen. 13,2% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' },
    { class: 'D', percentage: 20.8, color: '#ef4444', description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die mittleren Energieeffizienzklassen. 27,6% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' },
    { class: 'E', percentage: 15.8, color: '#dc2626', description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in eine schlechte Energieeffizienzklasse. 48,4% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' },
    { class: 'F', percentage: 13.5, color: '#991b1b', description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die schlechten Energieeffizienzklassen. 64,2% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' },
    { class: 'G', percentage: 9.8, color: '#7f1d1d', description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die schlechtesten Energieeffizienzklassen. 77,7% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' },
    { class: 'H', percentage: 12.5, color: '#450a0a', description: 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in die schlechteste Energieeffizienzklasse. 87,5% der Gebäude in der BRD haben einen niedrigeren Energiebedarf.' }
  ];

  // Data from service - Initialize with current values immediately
  environmentalImpacts: EnvironmentalImpact[] = [];
  savingsPotentials: SavingsPotential[] = [];
  fundingOptions: FundingOption[] = [];
  buildingComparison: BuildingComparisonData | null = null;

  // Computed properties for template
  get currentBuildingClass(): string {
    return this.buildingComparison?.currentBuildingClass || 'B';
  }

  get currentBuildingPercentage(): number {
    return this.buildingComparison?.currentBuildingPercentage || 6.2;
  }

  get comparisonTitle(): string {
    return this.buildingComparison?.comparisonTitle || 'Wie schneidet Ihre Immobilie im bundesweiten Vergleich ab?';
  }

  get comparisonSubtitle(): string {
    return this.buildingComparison?.comparisonSubtitle || 'Einer Hochrechnung (Basis Energieausweise) zufolge fällt Ihre Immobilie in eine hohe Energieeffizienzklasse.';
  }

  get savingsTitle(): string {
    return this.buildingComparison?.savingsTitle || 'Das Einsparpotenzial Ihres Gebäudes mit unserer Hilfe';
  }

  get fundingTitle(): string {
    return this.buildingComparison?.fundingTitle || 'Mögliche Förderungen für energieeff. Sanierungsmaßnahmen';
  }

  get disclaimerText(): string {
    return this.buildingComparison?.disclaimerText || 'Die in diesem Bericht berechneten und aufgezeigten Ergebnisse beruhen auf der DIN 18599 Grundlage...';
  }

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object,
    private buildingComparisonService: BuildingComparisonService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Initialize data immediately from service
    this.initializeDataFromService();
  }

  ngOnInit(): void {
    this.subscribeToDataChanges();
    this.initializeAnimations();
  }

  ngAfterViewInit(): void {
    // Only initialize charts in browser environment
    if (this.isBrowser) {
      setTimeout(() => {
        this.initializeEnergyChart();
        this.initializeBarChart();
        this.cardsVisible = true;
        this.cdr.detectChanges();
      }, 1200);
    }
  }

  ngOnDestroy(): void {
    // Clean up charts only if they exist
    if (this.isBrowser) {
      if (this.energyChart) {
        this.energyChart.destroy();
      }
      if (this.barChart) {
        this.barChart.destroy();
      }
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize data immediately from service
   */
  private initializeDataFromService(): void {
    // Use enhanced data from image instead of service for energy class data
    this.environmentalImpacts = this.buildingComparisonService.getCurrentEnvironmentalImpacts();
    this.savingsPotentials = this.buildingComparisonService.getCurrentSavingsPotentials();
    this.fundingOptions = this.buildingComparisonService.getCurrentFundingOptions();
    this.buildingComparison = this.buildingComparisonService.getCurrentBuildingComparison();
    
    console.log('Building comparison data initialized:', {
      energyClassData: this.energyClassData,
      environmentalImpacts: this.environmentalImpacts,
      savingsPotentials: this.savingsPotentials,
      fundingOptions: this.fundingOptions,
      buildingComparison: this.buildingComparison
    });
  }

  /**
   * Subscribe to service data changes
   */
  private subscribeToDataChanges(): void {
    // Subscribe to all data streams except energy class data (using enhanced local data)
    combineLatest([
      this.buildingComparisonService.environmentalImpacts$,
      this.buildingComparisonService.savingsPotentials$,
      this.buildingComparisonService.fundingOptions$,
      this.buildingComparisonService.buildingComparison$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([environmentalImpacts, savingsPotentials, fundingOptions, buildingComparison]) => {
      this.environmentalImpacts = environmentalImpacts;
      this.savingsPotentials = savingsPotentials;
      this.fundingOptions = fundingOptions;
      this.buildingComparison = buildingComparison;
      
      // Update charts if they exist and data has changed
      if (this.isBrowser && this.energyChart && this.energyClassData.length > 0) {
        this.updateDoughnutChart();
      }
      if (this.isBrowser && this.barChart && this.energyClassData.length > 0) {
        this.updateBarChart();
      }
      
      this.cdr.detectChanges();
    });
  }

    /**
   * Returns the angle (in degrees) for the arrow overlay to point to the current energy class
   * The doughnut chart covers 180° (from -90° to +90°), so each class gets a segment.
   * The arrow should point to the center of the segment for the current class.
   */
  getEnergyClassArrowAngle(): number {
    // Find index of current class
    const classIndex = this.energyClassData.findIndex(d => d.class === this.currentBuildingClass);
    if (classIndex === -1) return 0;
    // Calculate cumulative percentage up to the current class (excluding current)
    const cumulative = this.energyClassData.slice(0, classIndex).reduce((sum, item) => sum + item.percentage, 0);
    // Add half of the current class's percentage to get the center
    const current = this.energyClassData[classIndex]?.percentage || 0;
    const centerPercent = cumulative + current / 2;
    // 180° covers 100%: so multiply by 1.8
    return -90 + centerPercent * 1.8;
  }

  /**
   * Initialize entrance animations
   */
  private initializeAnimations(): void {
    // Trigger entrance animations after component initialization
    setTimeout(() => {
      this.mounted = true;
      this.cdr.detectChanges();
    }, 100);
  }
/**
 * Get the description for the current building's energy class
 */
getCurrentClassDescription(): string {
  const classData = this.energyClassData.find(c => c.class === this.currentBuildingClass);
  return classData?.description || 'Keine Beschreibung verfügbar.';
}
  /**
   * Check if data is loaded - simplified version
   */
  isDataLoaded(): boolean {
    return !!(this.energyClassData.length > 0 && this.environmentalImpacts.length > 0 && this.buildingComparison);
  }

  private initializeEnergyChart(): void {
    // Double check we're in browser and elements exist
    if (!this.isBrowser || !this.energyChartRef?.nativeElement || this.energyClassData.length === 0) return;

    const ctx = this.energyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Register Chart.js components if not already registered
    if (typeof Chart !== 'undefined') {
      Chart.register(...registerables);
    }

    // Create a doughnut chart that looks like a speedometer
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: this.energyClassData.map(d => `Klasse ${d.class}`),
        datasets: [{
          data: this.energyClassData.map(d => d.percentage),
          backgroundColor: this.energyClassData.map(d => d.color),
          borderColor: this.energyClassData.map(d => d.color),
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        rotation: -90,
        circumference: 180,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 11 },
            padding: { top: 16, bottom: 16, left: 12, right: 12 },
            maxWidth: 300,
            displayColors: false,
            callbacks: {
              title: (context: TooltipItem<'doughnut'>[]) => {
                const energyClass = this.energyClassData[context[0].dataIndex];
                return `Energieklasse ${energyClass.class}`;
              },
              label: (context: TooltipItem<'doughnut'>) => {
                const energyClass = this.energyClassData[context.dataIndex];
                return `Anteil: ${energyClass.percentage}% der Gebäude`;
              },
              afterLabel: (context: TooltipItem<'doughnut'>) => {
                const energyClass = this.energyClassData[context.dataIndex];
                // Split long description into multiple lines for better height
                const maxLength = 50;
                const description = energyClass.description;
                const words = description.split(' ');
                const lines = [];
                let currentLine = '';
                
                for (const word of words) {
                  if ((currentLine + word).length <= maxLength) {
                    currentLine += (currentLine ? ' ' : '') + word;
                  } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                  }
                }
                if (currentLine) lines.push(currentLine);
                
                return lines;
              }
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      } as any
    };

    this.energyChart = new Chart(ctx, config);
  }

  private initializeBarChart(): void {
    // Double check we're in browser and elements exist
    if (!this.isBrowser || !this.barChartRef?.nativeElement || this.energyClassData.length === 0) return;

    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Register Chart.js components if not already registered
    if (typeof Chart !== 'undefined') {
      Chart.register(...registerables);
    }

    // Create a bar chart with enhanced tooltips
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: this.energyClassData.map(d => d.class),
        datasets: [{
          label: 'Anteil der Gebäude (%)',
          data: this.energyClassData.map(d => d.percentage),
          backgroundColor: this.energyClassData.map(d => d.color + '80'), // Add transparency
          borderColor: this.energyClassData.map(d => d.color),
          borderWidth: 2,
          hoverBackgroundColor: this.energyClassData.map(d => d.color),
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 25,
            border: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 12 },
              callback: (value: any) => `${value}%`
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            border: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 14, weight: 'bold' as any }
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            titleFont: { size: 16, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 16,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context: TooltipItem<'bar'>[]) => {
                const energyClass = this.energyClassData[context[0].dataIndex];
                return `Energieeffizienzklasse ${energyClass.class}`;
              },
              label: (context: TooltipItem<'bar'>) => {
                const energyClass = this.energyClassData[context.dataIndex];
                return `${energyClass.percentage}% der Gebäude in Deutschland`;
              },
              afterLabel: (context: TooltipItem<'bar'>) => {
                const energyClass = this.energyClassData[context.dataIndex];
                // Split long description into multiple lines for better readability
                const maxLength = 60;
                const description = energyClass.description;
                const words = description.split(' ');
                const lines = [];
                let currentLine = '';
                
                for (const word of words) {
                  if ((currentLine + word).length <= maxLength) {
                    currentLine += (currentLine ? ' ' : '') + word;
                  } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                  }
                }
                if (currentLine) lines.push(currentLine);
                
                return lines;
              }
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutQuart',
          delay: (context: any) => context.dataIndex * 100 // Staggered animation
        },
        onHover: (event: any, activeElements: any[]) => {
          if (this.barChartRef?.nativeElement) {
            this.barChartRef.nativeElement.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
          }
        }
      }
    };

    this.barChart = new Chart(ctx, config);

    // Highlight current building class
    if (this.currentBuildingClass) {
      const classIndex = this.energyClassData.findIndex(d => d.class === this.currentBuildingClass);
      if (classIndex !== -1 && this.barChart) {
        // Add a special highlight for the current building class
        setTimeout(() => {
          if (this.barChart) {
            this.barChart.setActiveElements([{ datasetIndex: 0, index: classIndex }]);
            this.barChart.update('none');
          }
        }, 2000);
      }
    }
  }

  /**
   * Update existing doughnut chart with new data
   */
  private updateDoughnutChart(): void {
    if (!this.energyChart || this.energyClassData.length === 0) return;

    this.energyChart.data.labels = this.energyClassData.map(d => `Klasse ${d.class}`);
    this.energyChart.data.datasets[0].data = this.energyClassData.map(d => d.percentage);
    this.energyChart.data.datasets[0].backgroundColor = this.energyClassData.map(d => d.color);
    this.energyChart.data.datasets[0].borderColor = this.energyClassData.map(d => d.color);
    this.energyChart.update('active');
  }

  /**
   * Update existing bar chart with new data
   */
  private updateBarChart(): void {
    if (!this.barChart || this.energyClassData.length === 0) return;

    this.barChart.data.labels = this.energyClassData.map(d => d.class);
    this.barChart.data.datasets[0].data = this.energyClassData.map(d => d.percentage);
    this.barChart.data.datasets[0].backgroundColor = this.energyClassData.map(d => d.color + '80');
    this.barChart.data.datasets[0].borderColor = this.energyClassData.map(d => d.color);
    this.barChart.update('active');
  }

  // ... (rest of the methods remain the same as in original component)
  
  /**
   * Get the CSS class for environmental impact cards based on type
   */
  getImpactCardClass(type: string): string {
    switch (type) {
      case 'car':
        return 'from-blue-600/20 to-blue-700/20 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/25';
      case 'tree':
        return 'from-green-600/20 to-green-700/20 border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/25';
      case 'co2':
        return 'from-red-600/20 to-red-700/20 border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/25';
      default:
        return 'from-gray-600/20 to-gray-700/20 border-gray-500/30 hover:border-gray-400/50 hover:shadow-gray-500/25';
    }
  }

  /**
   * Get the CSS class for savings potential cards based on type
   */
  getSavingsCardClass(type: string): string {
    switch (type) {
      case 'energy':
        return 'from-blue-600/20 to-blue-700/20 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/25';
      case 'cost':
        return 'from-green-600/20 to-green-700/20 border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/25';
      case 'co2':
        return 'from-purple-600/20 to-purple-700/20 border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/25';
      default:
        return 'from-gray-600/20 to-gray-700/20 border-gray-500/30 hover:border-gray-400/50 hover:shadow-gray-500/25';
    }
  }

  /**
   * Get the text color class for savings cards based on type
   */
  getSavingsCardTextClass(type: string): string {
    switch (type) {
      case 'energy':
        return 'text-blue-300';
      case 'cost':
        return 'text-green-300';
      case 'co2':
        return 'text-purple-300';
      default:
        return 'text-gray-300';
    }
  }

  /**
   * Get the description text color class for savings cards based on type
   */
  getSavingsCardDescClass(type: string): string {
    switch (type) {
      case 'energy':
        return 'text-blue-200';
      case 'cost':
        return 'text-green-200';
      case 'co2':
        return 'text-purple-200';
      default:
        return 'text-gray-200';
    }
  }

  /**
   * Get the CSS class for funding cards
   */
  getFundingCardClass(): string {
    return 'from-orange-600/20 to-orange-700/20 border-orange-500/30 hover:border-orange-400/50 hover:shadow-orange-500/25';
  }

  /**
   * Get the text color class for funding cards
   */
  getFundingCardTextClass(): string {
    return 'text-orange-300';
  }

  /**
   * Get the description text color class for funding cards
   */
  getFundingCardDescClass(): string {
    return 'text-orange-200';
  }

  /**
   * Get the text color class for impact cards based on type
   */
  getImpactCardTextClass(type: string): string {
    switch (type) {
      case 'car':
        return 'text-blue-300';
      case 'tree':
        return 'text-green-300';
      case 'co2':
        return 'text-red-300';
      default:
        return 'text-gray-300';
    }
  }

  /**
   * Get the description text color class for impact cards based on type
   */
  getImpactCardDescClass(type: string): string {
    switch (type) {
      case 'car':
        return 'text-blue-200';
      case 'tree':
        return 'text-green-200';
      case 'co2':
        return 'text-red-200';
      default:
        return 'text-gray-200';
    }
  }

  /**
   * Track by function for ngFor performance
   */
  trackByIndex(index: number, item: any): number {
    return index;
  }

  /**
   * Get animation delay for staggered entrance
   */
  getAnimationDelay(index: number): string {
    return `${300 + (index * 100)}ms`;
  }

  /**
   * Get total potential savings using service method
   */
  getTotalSavings(): { energy: number, cost: number, co2: number } {
    return this.buildingComparisonService.calculateTotalSavings();
  }

  /**
   * Get building efficiency ranking using service method
   */
  getBuildingEfficiencyRanking(): string {
    return this.buildingComparisonService.getBuildingEfficiencyRanking();
  }

  /**
   * Get efficiency class color using service method
   */
  getEfficiencyClassColor(className: string): string {
    const classData = this.energyClassData.find(c => c.class === className);
    return classData?.color || '#gray';
  }

  /**
   * Calculate ROI using service method
   */
  calculateROI(investmentCost: number): number {
    return this.buildingComparisonService.calculateROI(investmentCost);
  }

  /**
   * Get environmental equivalent using service method
   */
  getEnvironmentalEquivalent(type: 'car' | 'tree' | 'co2'): string {
    return this.buildingComparisonService.getEnvironmentalEquivalent(type);
  }

  
  /**
   * API Integration Methods - Methods to update data from API
   */

  // Method to update energy class data from API
  updateEnergyClassDataFromAPI(apiData: EnergyClassData[]): void {
    this.energyClassData = apiData;
    if (this.energyChart) this.updateDoughnutChart();
    if (this.barChart) this.updateBarChart();
  }

  // Method to update environmental impact data from API
  updateEnvironmentalImpactFromAPI(apiData: EnvironmentalImpact[]): void {
    this.buildingComparisonService.updateEnvironmentalImpacts(apiData);
  }

  // Method to update building comparison data from API
  updateBuildingComparisonFromAPI(buildingClass: string, percentage: number): void {
    const currentComparison = this.buildingComparisonService.getCurrentBuildingComparison();
    const updatedComparison: BuildingComparisonData = {
      ...currentComparison,
      currentBuildingClass: buildingClass,
      currentBuildingPercentage: percentage
    };
    this.buildingComparison = updatedComparison;
    this.buildingComparisonService.updateBuildingComparison(updatedComparison);
  }
}