// co2-tax-rent-enhanced.component.ts - Updated with CO2TaxRentService integration
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// Import Chart.js
import {
  Chart,
  ChartConfiguration,
  ChartData,
  registerables,
  TooltipItem,
  ScriptableContext
} from 'chart.js/auto';

// Import the CO2TaxRentService
import { Co2TaxRentService, Co2TaxRentData } from '../../services/co2-tax-rent.service';

// Register Chart.js components only in browser
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

interface CO2TaxData {
  year: number;
  costPerYear: number;
  costPerTonne: number;
  description: string;
  isEstimate: boolean;
  source: string;
}

interface RentYieldData {
  year: number;
  yieldPercentage: number;
  decline: number;
}

interface ChartDataPoint {
  year: number;
  percentage: number;
  cost: number;
  co2TaxMore: number;
  mietrendite: number;
  weniger: number;
  mieteNach: number;
}

@Component({
  selector: 'app-co2-tax-rent',
  templateUrl: './co2-tax-rent.component.html',
  styleUrls: ['./co2-tax-rent.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Co2TaxRentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('co2Chart', { static: false }) co2ChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rentChart', { static: false }) rentChartRef!: ElementRef<HTMLCanvasElement>;

  mounted = false;
  cardsVisible = false;
  co2Chart: Chart | null = null;
  rentChart: Chart | null = null;
  private isBrowser: boolean;
  
  // CO2TaxRentService instance
  private co2TaxRentService = new Co2TaxRentService();
  
  // Property values - can be set from parent component or form inputs
  mieteinnahme: number = 5000;
  wert: number = 100000;
  co2EmissionsTons: number = 17;
  
  // Calculated service data
  serviceData: Co2TaxRentData[] = [];
  
  co2TaxProjections: CO2TaxData[] = [
    {
      year: 2026,
      costPerYear: 4000,
      costPerTonne: 65,
      description: '65 €/t CO2 im Jahre 2026',
      isEstimate: false,
      source: 'legal'
    },
    {
      year: 2027,
      costPerYear: 9000,
      costPerTonne: 75,
      description: '75 €/t CO2 im Jahre 2027*',
      isEstimate: true,
      source: 'tradeable'
    },
    {
      year: 2030,
      costPerYear: 12000,
      costPerTonne: 200,
      description: '200 €/t CO2 im Jahre 2030**',
      isEstimate: true,
      source: 'scientific'
    },
    {
      year: 2040,
      costPerYear: 35000,
      costPerTonne: 400,
      description: '400 €/t CO2 im Jahre 2040***',
      isEstimate: true,
      source: 'industry'
    }
  ];

  // For Mietrendite chart: Updated with service calculations
  rentYieldChartData = {
    labels: ['2025', '2033', '2040'],
    green: [5.0, 2.0, 0.8], // Will be updated with actual service calculations
  };

  // Chart data calculated from service
  chartData: ChartDataPoint[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Initialize service with property values
    this.initializeServiceData();
    
    // Trigger entrance animations after component initialization
    setTimeout(() => {
      this.mounted = true;
      this.cdr.detectChanges();
    }, 100);
  }

  ngAfterViewInit(): void {
    // Only initialize charts in browser environment
    if (this.isBrowser) {
      setTimeout(() => {
        this.initializeCO2Chart();
        this.initializeRentChart();
        this.cardsVisible = true;
        this.cdr.detectChanges();
      }, 1200);
    }
  }

  ngOnDestroy(): void {
    // Clean up charts only if they exist
    if (this.isBrowser) {
      if (this.co2Chart) {
        this.co2Chart.destroy();
      }
      if (this.rentChart) {
        this.rentChart.destroy();
      }
    }
  }

  /**
   * Initialize service data with current property values
   */
  private initializeServiceData(): void {
    // Set values in service
    this.co2TaxRentService.setValuesForAllYears(this.mieteinnahme, this.wert, this.co2EmissionsTons);
    
    // Get calculated data
    this.serviceData = this.co2TaxRentService.getCompleteData();
    
    // Transform service data to chart data format
    this.chartData = this.serviceData.map(row => ({
      year: row.jahr,
      percentage: row.mietrendite, // Use calculated mietrendite as percentage
      cost: row.co2TaxMore, // Use calculated CO2 tax cost
      co2TaxMore: row.co2TaxMore,
      mietrendite: row.mietrendite,
      weniger: row.weniger,
      mieteNach: row.mieteNach
    }));

    // Update rent yield chart data
    this.updateRentYieldChartData();
  }

  /**
   * Update rent yield chart data with service calculations
   */
  private updateRentYieldChartData(): void {
    // Get specific years for rent chart
    const year2025 = this.serviceData.find(row => row.jahr === 2025);
    const year2033 = this.serviceData.find(row => row.jahr === 2033);
    const year2040 = this.serviceData.find(row => row.jahr === 2040);

    this.rentYieldChartData = {
      labels: ['2025', '2033', '2040'],
      green: [
        year2025 ? year2025.mietrendite : 5.0,
        year2033 ? year2033.mietrendite : 2.0,
        year2040 ? year2040.mietrendite : 0.8
      ]
    };
  }

  private initializeCO2Chart(): void {
    // Double check we're in browser and elements exist
    if (!this.isBrowser || !this.co2ChartRef?.nativeElement) return;

    const ctx = this.co2ChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Register Chart.js components if not already registered
    if (typeof Chart !== 'undefined') {
      Chart.register(...registerables);
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.chartData.map(d => d.year.toString()),
        datasets: [{
          label: 'CO2-Steuer Kosten (€)',
          data: this.chartData.map(d => d.cost),
          backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red bars
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              title: (context: TooltipItem<'bar'>[]) => {
                return `Jahr ${context[0].label}`;
              },
              label: (context: TooltipItem<'bar'>) => {
                const dataPoint = this.chartData[context.dataIndex];
                const serviceRow = this.serviceData[context.dataIndex];
                
                return [
                  `CO2-Steuer: ${this.formatCurrency(dataPoint.co2TaxMore)} €`,
                  `CO2-Preis: ${serviceRow.preisTonneCo2} €/Tonne`,
                  `CO2-Emissionen: ${serviceRow.co2EmissionsTons} Tonnen`,
                  `Formel: ${serviceRow.co2EmissionsTons} × ${serviceRow.preisTonneCo2} = ${this.formatCurrency(serviceRow.co2TaxMore)} €`,
                  ``,
                  `Mieteinnahme: ${this.formatCurrency(serviceRow.mieteinnahme)} €`,
                  `Miete nach CO2-Steuer: ${this.formatCurrency(serviceRow.mieteNach)} €`,
                  `Mietrendite: ${serviceRow.mietrendite.toFixed(2)}%`,
                  `Rendite-Verlust: ${serviceRow.weniger.toFixed(1)}%`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              drawOnChartArea: true,
              drawTicks: true,
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                family: 'monospace',
                size: 10
              }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'CO2-Steuer (€)',
              color: 'rgba(255, 255, 255, 0.7)',
              font: { weight: 'bold', size: 14 }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              drawOnChartArea: true,
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: 10
              },
              callback: function(value: any) {
                return value.toLocaleString('de-DE') + ' €';
              }
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    };

    this.co2Chart = new Chart(ctx, config);
  }

  private initializeRentChart(): void {
    if (!this.isBrowser || !this.rentChartRef?.nativeElement) return;
    const ctx = this.rentChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.rentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.rentYieldChartData.labels,
        datasets: [
          {
            label: 'Mietrendite',
            data: this.rentYieldChartData.green,
            backgroundColor: ['#22c55e', '#22c55e', '#22c55e'], // All green bars
            borderColor: ['#16a34a', '#16a34a', '#16a34a'], // All green borders
            borderWidth: 2,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              title: (context: any) => {
                return `Jahr ${context[0].label}`;
              },
              label: (context: any) => {
                const barIndex = context.dataIndex;
                const year = parseInt(this.rentYieldChartData.labels[barIndex]);
                const serviceRow = this.serviceData.find(row => row.jahr === year);
                
                if (serviceRow) {
                  return [
                    `Mietrendite: ${serviceRow.mietrendite.toFixed(2)}%`,
                    `Miete nach CO2-Steuer: ${this.formatCurrency(serviceRow.mieteNach)} €`,
                    `CO2-Steuer: ${this.formatCurrency(serviceRow.co2TaxMore)} €`,
                    `Rendite-Verlust: ${serviceRow.weniger.toFixed(1)}%`,
                    `${serviceRow.weniger.toFixed(1)}% weniger Mietrendite wie im Jahr 2025`
                  ];
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: false },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              drawOnChartArea: true,
              drawTicks: true
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { weight: 'bold', size: 13 }
            }
          },
          y: {
              title: {
                display: true,
                text: 'Mietrendite (%)',
                color: 'rgba(255, 255, 255, 0.7)',
                font: { weight: 'bold', size: 14 }
              },
              min: 0,
              max: 12,
              ticks: {
                stepSize: 2,
                color: 'rgba(255, 255, 255, 0.7)',
                callback: function(value: any) { return value + '%'; },
                font: { weight: 'bold', size: 13 }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawOnChartArea: true,
                drawTicks: true
              }
            }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart',
          delay: 500
        }
      }
    });
  }

  /**
   * Update property values and recalculate service data
   */
  updatePropertyValues(mieteinnahme: number, wert: number, co2EmissionsTons: number): void {
    this.mieteinnahme = mieteinnahme;
    this.wert = wert;
    this.co2EmissionsTons = co2EmissionsTons;
    
    // Reinitialize service data
    this.initializeServiceData();
    
    // Update charts if they exist
    if (this.isBrowser) {
      this.updateChartsWithNewData();
    }
  }

  /**
   * Update charts with new service data
   */
  private updateChartsWithNewData(): void {
    // Update CO2 chart
    if (this.co2Chart) {
      this.co2Chart.data.labels = this.chartData.map(d => d.year.toString());
      this.co2Chart.data.datasets[0].data = this.chartData.map(d => d.cost);
      this.co2Chart.update('active');
    }

    // Update rent chart
    if (this.rentChart) {
      this.rentChart.data.datasets[0].data = this.rentYieldChartData.green;
      this.rentChart.update('active');
    }

    // Update CO2 tax projections with new calculations
    this.updateCO2TaxProjectionsWithServiceData();
    
    this.cdr.detectChanges();
  }

  /**
   * Update CO2 tax projections with service calculations
   */
  private updateCO2TaxProjectionsWithServiceData(): void {
    this.co2TaxProjections = this.co2TaxProjections.map(projection => {
      const serviceRow = this.serviceData.find(row => row.jahr === projection.year);
      if (serviceRow) {
        return {
          ...projection,
          costPerYear: serviceRow.co2TaxMore,
          costPerTonne: serviceRow.preisTonneCo2
        };
      }
      return projection;
    });
  }

  /**
   * Get the CSS class for CO2 tax card based on year
   */
  getTaxCardClass(year: number): string {
    switch (year) {
      case 2026:
        return 'from-blue-600/20 to-blue-700/20 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/25';
      case 2027:
        return 'from-orange-600/20 to-orange-700/20 border-orange-500/30 hover:border-orange-400/50 hover:shadow-orange-500/25';
      case 2030:
        return 'from-cyan-600/20 to-cyan-700/20 border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-cyan-500/25';
      case 2040:
        return 'from-red-600/20 to-red-700/20 border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/25';
      default:
        return 'from-gray-600/20 to-gray-700/20 border-gray-500/30 hover:border-gray-400/50 hover:shadow-gray-500/25';
    }
  }

  /**
   * Get the background color for year indicator
   */
  getYearIndicatorClass(year: number): string {
    switch (year) {
      case 2026:
        return 'bg-blue-500/30 text-blue-300';
      case 2027:
        return 'bg-orange-500/30 text-orange-300';
      case 2030:
        return 'bg-cyan-500/30 text-cyan-300';
      case 2040:
        return 'bg-red-500/30 text-red-300';
      default:
        return 'bg-gray-500/30 text-gray-300';
    }
  }

  /**
   * Get rent yield bar color as RGBA
   */
  getRentBarColorRgba(yieldData: RentYieldData, alpha: number = 0.8): string {
    if (yieldData.yieldPercentage >= 6) return `rgba(34, 197, 94, ${alpha})`; // green-500
    if (yieldData.yieldPercentage >= 4) return `rgba(74, 222, 128, ${alpha})`; // green-400
    if (yieldData.yieldPercentage >= 2) return `rgba(250, 204, 21, ${alpha})`; // yellow-400
    return `rgba(248, 113, 113, ${alpha})`; // red-400
  }

  /**
   * Format currency values
   */
  formatCurrency(value: number): string {
    return value.toLocaleString('de-DE');
  }

  /**
   * Track by function for ngFor performance
   */
  trackByYear(index: number, item: any): number {
    return item.year;
  }

  /**
   * Get animation delay for staggered entrance
   */
  getAnimationDelay(index: number): string {
    return `${300 + (index * 100)}ms`;
  }

  /**
 * Get the 'weniger' percentage for year 2033
 */
get2033WenigerPercentage(): number {
  const year2033 = this.serviceData.find(row => row.jahr === 2033);
  return year2033 ? Math.round(year2033.weniger) : 53;
}

/**
 * Get the 'weniger' percentage for year 2040
 */
get2040WenigerPercentage(): number {
  const year2040 = this.serviceData.find(row => row.jahr === 2040);
  return year2040 ? Math.round(year2040.weniger) : 74;
}

  /**
   * API Integration Methods - Now integrated with service
   */

  // Method to update CO2 data from API
  updateCO2DataFromAPI(apiData: ChartDataPoint[]): void {
    this.chartData = apiData;
    if (this.isBrowser && this.co2Chart) {
      this.co2Chart.data.labels = apiData.map(d => d.year.toString());
      this.co2Chart.data.datasets[0].data = apiData.map(d => d.cost);
      this.co2Chart.update('active');
    }
  }

  // Method to update rent data from service
  updateRentDataFromService(): void {
    this.updateRentYieldChartData();
    if (this.isBrowser && this.rentChart) {
      this.rentChart.data.datasets[0].data = this.rentYieldChartData.green;
      this.rentChart.update('active');
    }
  }

  // Method to update CO2 tax projections from service
  updateCO2TaxProjectionsFromService(): void {
    this.updateCO2TaxProjectionsWithServiceData();
    this.cdr.detectChanges();
  }

  /**
   * Get service data for external use
   */
  getServiceData(): Co2TaxRentData[] {
    return this.serviceData;
  }

  /**
   * Get CO2 tax service instance
   */
  getCO2TaxService(): Co2TaxRentService {
    return this.co2TaxRentService;
  }
}