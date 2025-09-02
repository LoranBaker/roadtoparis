import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { EmissionDataService, DecarbonizationPath, PropertyTypeConfig, ChartDataset, BarChartData } from '../../services/emission-data.service';

// Import Chart.js
import {
  Chart,
  ChartConfiguration,
  ChartData,
  registerables,
  TooltipItem,
  ScriptableContext
} from 'chart.js/auto';

// Register Chart.js components only in browser
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

interface DecarbonisationData {
  year: number;
  co2Intensity: number;
  energyIntensity: number;
  isProjected: boolean;
  isStrandingPoint: boolean;
}

interface StrandedAssetInfo {
  title: string;
  description: string;
  type: 'warning' | 'danger' | 'info';
  icon: string;
}

type ChartType = 'emissions' | 'energy';
type PropertyType = 'single' | 'multi';

@Component({
  selector: 'app-stranded-assets',
  templateUrl: './stranded-assets.component.html',
  styleUrls: ['./stranded-assets.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StrandedAssetsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('decarbChart', { static: false }) decarbChartRef!: ElementRef<HTMLCanvasElement>;

  mounted = false;
  cardsVisible = false;
  decarbChart: Chart | null = null;
  private isBrowser: boolean;
  
  // Chart type selection
  selectedChartType: ChartType = 'emissions';

  // Property type configuration from API
  propertyTypeConfig: PropertyTypeConfig | null = null;
  currentPropertyType: PropertyType = 'single';
  propertyDisplayName: string = '';
  
  // Combined chart data from API
  chartDataset: ChartDataset | null = null;
  
  // Loading state
  isLoadingData = true;
  dataLoadError = false;

  // Updated hardcoded data (2025-2040 range as fallback)
  // Note: First few values are set lower to demonstrate green bars when performance is good
  decarbonisationData: DecarbonisationData[] = [
    { year: 2025, co2Intensity: 20, energyIntensity: 100, isProjected: false, isStrandingPoint: false }, // Good performance - should be green
    { year: 2026, co2Intensity: 22, energyIntensity: 110, isProjected: true, isStrandingPoint: false },  // Good performance - should be green
    { year: 2027, co2Intensity: 50, energyIntensity: 180, isProjected: true, isStrandingPoint: false },  // Poor performance - should be red
    { year: 2028, co2Intensity: 34, energyIntensity: 125, isProjected: true, isStrandingPoint: false },
    { year: 2029, co2Intensity: 29.2, energyIntensity: 110, isProjected: true, isStrandingPoint: true },
    { year: 2030, co2Intensity: 28, energyIntensity: 105, isProjected: true, isStrandingPoint: false },
    { year: 2032, co2Intensity: 26, energyIntensity: 95, isProjected: true, isStrandingPoint: false },
    { year: 2034, co2Intensity: 24, energyIntensity: 88, isProjected: true, isStrandingPoint: false },
    { year: 2035, co2Intensity: 23, energyIntensity: 85, isProjected: true, isStrandingPoint: false },
    { year: 2037, co2Intensity: 21, energyIntensity: 78, isProjected: true, isStrandingPoint: false },
    { year: 2038, co2Intensity: 20, energyIntensity: 75, isProjected: true, isStrandingPoint: false },
    { year: 2040, co2Intensity: 18, energyIntensity: 70, isProjected: true, isStrandingPoint: false }
  ];

  // Stranded Assets information cards - dynamic based on property type
  get strandedAssetInfos(): StrandedAssetInfo[] {
    return [
      {
        title: 'Stranding Point',
        description: '+ 4 Jahre bis zur Gefährdung',
        type: 'warning',
        icon: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        title: 'CO2-Intensität 2029',
        description: '29.2 equ./m²',
        type: 'danger',
        icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        title: `${this.propertyDisplayName} Typ`,
        description: `${this.currentPropertyType === 'single' ? 'Einfamilienhaus' : 'Mehrfamilienhaus'} Dekarbonisierung`,
        type: 'info',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      }
    ];
  }

  // Risk description data - dynamic based on property type
  get riskDescriptions(): string[] {
    const propertyTypeText = this.currentPropertyType === 'single' ? 'Einfamilienhäuser' : 'Mehrfamilienhäuser';
    return [
      `Wertverlust: ${propertyTypeText} sind besonders gefährdet, bis 2040 ihren wirtschaftlichen Wert zu verlieren.`,
      'Externe Einflüsse: Strengere Energieeffizienzstandards bis 2030 können zur schnellen Gefährdung führen.',
      `Kritischer Zeitraum: ${propertyTypeText} müssen bis 2029 CRREM-konform werden, um Stranding zu vermeiden.`
    ];
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private emissionDataService: EmissionDataService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Load property type configuration first, then data
    this.loadPropertyTypeConfig();
    
    // Trigger entrance animations after component initialization
    setTimeout(() => {
      this.mounted = true;
      this.cdr.detectChanges();
    }, 100);
  }

  ngAfterViewInit(): void {
    // Only initialize charts in browser environment after data is loaded
    if (this.isBrowser) {
      if (!this.isLoadingData) {
        this.initializeChartWhenReady();
      }
    }
  }

  ngOnDestroy(): void {
    // Clean up charts only if they exist
    if (this.isBrowser && this.decarbChart) {
      this.decarbChart.destroy();
    }
  }

  /**
   * Load property type configuration from API
   */
  private loadPropertyTypeConfig(): void {
    // Skip data loading during SSR/prerendering
    if (!this.isBrowser) {
      this.isLoadingData = false;
      return;
    }

    this.isLoadingData = true;
    this.dataLoadError = false;

    this.emissionDataService.getPropertyTypeConfig().subscribe({
      next: (config) => {
        this.propertyTypeConfig = config;
        this.currentPropertyType = config.propertyType;
        this.propertyDisplayName = config.displayName;
        
        // Now load the combined chart data for this property type
        this.loadChartData();
      },
      error: (error) => {
        console.error('Error loading property type config:', error);
        // Use default configuration
        this.currentPropertyType = 'single';
        this.propertyDisplayName = 'Single Family';
        this.loadChartData();
      }
    });
  }

  /**
   * Load combined chart data (line + bar data) based on current property type
   */
  private loadChartData(): void {
    this.emissionDataService.loadChartDataset(this.currentPropertyType).subscribe({
      next: (data) => {
        this.chartDataset = data;
        this.isLoadingData = false;
        this.cdr.detectChanges();
        
        // Initialize chart after data is loaded
        if (this.isBrowser && this.decarbChartRef?.nativeElement) {
          this.initializeChartWhenReady();
        }
      },
      error: (error) => {
        console.error('Error loading chart data:', error);
        this.dataLoadError = true;
        this.isLoadingData = false;
        this.cdr.detectChanges();
        
        // Use fallback data and initialize chart
        if (this.isBrowser && this.decarbChartRef?.nativeElement) {
          this.initializeChartWhenReady();
        }
      }
    });
  }

  private initializeChartWhenReady(): void {
    const maxAttempts = 10;
    let attempts = 0;

    const tryInitialize = () => {
      attempts++;
      
      if (this.decarbChartRef?.nativeElement) {
        // Canvas is ready, initialize chart
        setTimeout(() => {
          this.initializeDecarbonisationChart();
          this.cardsVisible = true;
          this.cdr.detectChanges();
        }, 100);
      } else if (attempts < maxAttempts) {
        // Canvas not ready yet, try again
        setTimeout(tryInitialize, 200);
      } else {
        console.warn('Chart canvas not found after maximum attempts');
      }
    };

    tryInitialize();
  }

  /**
   * Switch chart type and update display
   */
  onChartTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedChartType = target.value as ChartType;
    this.updateChartData();
  }

  /**
   * Calculate dynamic bar colors based on decarbonization path comparison
   * Green = below or equal to path (good performance), Red = above path (poor performance)
   */
  /**
   * Calculate bar colors by matching bar year to line year, not just by index
   */
  private calculateBarColors(barData: number[], lineData: number[], barYears?: (string|number)[], lineYears?: (string|number)[]): string[] {
    // If years are provided, match by year; else fallback to index
    return barData.map((barValue, index) => {
      if (barValue === null || barValue === undefined) {
        return 'transparent';
      }
      let lineValue;
      if (barYears && lineYears) {
        // Find the line value for the same year
        const year = barYears[index];
        const lineIdx = lineYears.findIndex(y => y === year);
        lineValue = lineIdx !== -1 ? lineData[lineIdx] : undefined;
      } else {
        lineValue = lineData[index];
      }
      if (lineValue === undefined || lineValue === null) {
        return 'rgba(156, 163, 175, 0.8)'; // Gray fallback
      }
      return barValue <= lineValue
        ? 'rgba(34, 197, 94, 0.9)'
        : 'rgba(239, 68, 68, 0.9)';
    });
  }

  /**
   * Get border colors that complement the background colors
   */
  private calculateBarBorderColors(backgroundColor: string[]): string[] {
    return backgroundColor.map(color => {
      if (color.includes('34, 197, 94')) {
        return 'rgba(34, 197, 94, 1)'; // Solid green border
      } else if (color.includes('239, 68, 68')) {
        return 'rgba(239, 68, 68, 1)'; // Solid red border
      } else {
        return 'rgba(156, 163, 175, 1)'; // Solid gray border
      }
    });
  }

  /**
   * Update chart data based on selected type - Enhanced version
   */
  private updateChartData(): void {
    if (!this.decarbChart) return;

    const isEmissions = this.selectedChartType === 'emissions';
    
    if (this.chartDataset) {
      // Use loaded chart dataset
      const { lineData, barData } = this.chartDataset;
      
      // Update line dataset
      this.decarbChart.data.labels = lineData.map(d => d.year);
      const lineValues = lineData.map(d => isEmissions ? d.emissions : d.energy);
      
      // Update bar dataset  
      const barValues = barData.map(d => isEmissions ? d.emissions : d.energy);
      
      // Calculate dynamic bar colors (green = below path, red = above path), match by year
      const barYears = barData.map(d => d.year);
      const lineYears = lineData.map(d => d.year);
      const barColors = this.calculateBarColors(barValues, lineValues, barYears, lineYears);
      const borderColors = this.calculateBarBorderColors(barColors);
      
      // Update datasets
      if (this.decarbChart.data.datasets[0]) {
        this.decarbChart.data.datasets[0].data = lineValues;
        this.decarbChart.data.datasets[0].label = `${this.propertyDisplayName} ${isEmissions ? 'CO₂-Intensität' : 'Energie-Intensität'} Pfad`;
      }
      
      if (this.decarbChart.data.datasets[1]) {
        const extendedBarData = [...barValues, ...Array(lineValues.length - barValues.length).fill(null)];
        const extendedBarColors = [...barColors, ...Array(lineValues.length - barColors.length).fill('transparent')];
        const extendedBorderColors = [...borderColors, ...Array(lineValues.length - borderColors.length).fill('transparent')];
        
        this.decarbChart.data.datasets[1].data = extendedBarData;
        this.decarbChart.data.datasets[1].label = `${isEmissions ? 'CO₂-Istwert' : 'Energie-Istwert'}`;
        this.decarbChart.data.datasets[1].backgroundColor = extendedBarColors;
        this.decarbChart.data.datasets[1].borderColor = extendedBorderColors;
      }
      
      // Update y-axis for emissions or energy
      if (this.decarbChart.options.scales?.['y']) {
        this.decarbChart.options.scales['y'].max = isEmissions ? 60 : 200;
      }
    } else {
      // Use hardcoded data as fallback
      const dataKey = isEmissions ? 'co2Intensity' : 'energyIntensity';
      const maxValue = isEmissions ? 60 : 200;

      this.decarbChart.data.labels = this.decarbonisationData.map(d => d.year.toString());
      const lineValues = this.decarbonisationData.map(d => d[dataKey]);
      this.decarbChart.data.datasets[0].data = lineValues;
      this.decarbChart.data.datasets[0].label = `${this.propertyDisplayName} ${isEmissions ? 'CO₂-Intensität' : 'Energie-Intensität'}`;
      
      // For hardcoded data, create some sample bars for first 3 years
      const sampleBarData = this.decarbonisationData.slice(0, 3).map(d => d[dataKey]);
      // For fallback, match by index (years are aligned)
      const barColors = this.calculateBarColors(sampleBarData, lineValues);
      const borderColors = this.calculateBarBorderColors(barColors);
      
      if (this.decarbChart.data.datasets[1]) {
        const extendedBarData = [...sampleBarData, ...Array(lineValues.length - sampleBarData.length).fill(null)];
        const extendedBarColors = [...barColors, ...Array(lineValues.length - barColors.length).fill('transparent')];
        const extendedBorderColors = [...borderColors, ...Array(lineValues.length - borderColors.length).fill('transparent')];
        
        this.decarbChart.data.datasets[1].data = extendedBarData;
        this.decarbChart.data.datasets[1].backgroundColor = extendedBarColors;
        this.decarbChart.data.datasets[1].borderColor = extendedBorderColors;
      }
      
      // Update y-axis
      if (this.decarbChart.options.scales?.['y']) {
        this.decarbChart.options.scales['y'].max = maxValue;
      }
    }

    this.decarbChart.update('active');
  }

  /**
   * Enhanced tooltip to show performance status
   */
  private getTooltipCallback() {
    const selectedChartType = this.selectedChartType;
    
    return {
      label: (context: TooltipItem<'line' | 'bar'>) => {
        const value = context.parsed.y;
        if (value === null || value === undefined) return '';
        
        const unit = selectedChartType === 'emissions' ? 'kg CO₂/m²' : 'kWh/m²a';
        let label = `${context.dataset.label}: ${value} ${unit}`;
        
        // Add performance indicator for bars
        if (context.datasetIndex === 1) {
          if (this.chartDataset) {
            const { lineData, barData } = this.chartDataset;
            const barValue = selectedChartType === 'emissions' 
              ? barData[context.dataIndex]?.emissions 
              : barData[context.dataIndex]?.energy;
            const lineValue = selectedChartType === 'emissions' 
              ? lineData[context.dataIndex]?.emissions 
              : lineData[context.dataIndex]?.energy;
            
            if (barValue !== undefined && lineValue !== undefined && barValue !== null && lineValue !== null) {
              if (barValue <= lineValue) {
                label += ' 🟢 Ziel erreicht';
              } else {
                label += ' 🔴 Über Zielpfad';
              }
            }
            
            // Add bar label if available
            if (barData[context.dataIndex]?.label) {
              label += ` (${barData[context.dataIndex].label})`;
            }
          }
        }
        
        return label;
      }
    };
  }

  private initializeDecarbonisationChart(): void {
    // Double check we're in browser and elements exist
    if (!this.isBrowser || !this.decarbChartRef?.nativeElement) {
      console.warn('Chart initialization failed: browser check or canvas element missing');
      return;
    }

    const ctx = this.decarbChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Chart initialization failed: unable to get 2d context');
      return;
    }

    // Destroy existing chart if it exists
    if (this.decarbChart) {
      this.decarbChart.destroy();
      this.decarbChart = null;
    }

    try {
      // Register Chart.js components if not already registered
      if (typeof Chart !== 'undefined') {
        Chart.register(...registerables);
      }

      // Prepare chart data
      let labels: string[];
      let lineChartData: number[];
      let barChartData: number[];
      let barLabels: string[] = [];
      const selectedChartType = this.selectedChartType;

      if (this.chartDataset) {
        // Use loaded chart dataset
        const { lineData, barData } = this.chartDataset;
        
        labels = lineData.map(d => d.year);
        lineChartData = selectedChartType === 'emissions' 
          ? lineData.map(d => d.emissions)
          : lineData.map(d => d.energy);
          
        barChartData = selectedChartType === 'emissions'
          ? barData.map(d => d.emissions)
          : barData.map(d => d.energy);
        
        barLabels = barData.map(d => d.label);
      } else {
        // Fallback to hardcoded data
        const dataKey = selectedChartType === 'emissions' ? 'co2Intensity' : 'energyIntensity';
        const filteredData = this.decarbonisationData.filter(d => d.year >= 2025 && d.year <= 2040);
        
        labels = filteredData.map(d => d.year.toString());
        lineChartData = filteredData.map(d => d[dataKey]);
        barChartData = filteredData.slice(0, 3).map(d => d[dataKey]); // First 3 years as bars
      }

      // Choose colors based on property type for the line
      const primaryColor = this.currentPropertyType === 'single' 
        ? 'rgba(185, 251, 192, 1)' // Light green for single family
        : 'rgba(0, 144, 255, 1)';   // Blue for multi family

      const backgroundColor = this.currentPropertyType === 'single'
        ? 'rgba(185, 251, 192, 0.3)'
        : 'rgba(0, 144, 255, 0.3)';

      // Calculate dynamic bar colors based on performance vs target (green = good, red = bad)
      // Make sure we compare bars with the corresponding line values
      const relevantLineData = lineChartData.slice(0, barChartData.length);
      const barColors = this.calculateBarColors(barChartData, relevantLineData);
      const borderColors = this.calculateBarBorderColors(barColors);

      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            // Line dataset (decarbonization path)
            {
              type: 'line',
              label: `${this.propertyDisplayName} Dekarbonisierungspfad`,
              data: lineChartData,
              borderColor: primaryColor,
              backgroundColor: backgroundColor,
              borderWidth: 4,
              pointBackgroundColor: primaryColor,
              pointBorderColor: 'white',
              pointBorderWidth: 2,
              pointRadius: 4,
              tension: 0.4,
              fill: 'origin',
              order: 1
            },
            // Bar dataset with dynamic green/red colors
            {
              type: 'bar',
              label: `${selectedChartType === 'emissions' ? 'CO₂-Istwert' : 'Energie-Istwert'}`,
              data: [...barChartData, ...Array(labels.length - barChartData.length).fill(null)], // Fill remaining with null
              backgroundColor: [...barColors, ...Array(labels.length - barColors.length).fill('transparent')],
              borderColor: [...borderColors, ...Array(labels.length - borderColors.length).fill('transparent')],
              borderWidth: 2,
              barThickness: 30,
              order: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                color: 'rgba(255, 255, 255, 0.8)',
                font: {
                  size: 12
                },
                usePointStyle: true,
                pointStyle: 'rect',
                boxWidth: 12,
                boxHeight: 12
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              callbacks: this.getTooltipCallback()
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
              max: selectedChartType === 'emissions' ? 60 : 200,
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
                  const unit = selectedChartType === 'emissions' ? 'kg CO₂/m²' : 'kWh/m²a';
                  return value + ' ' + unit;
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

      this.decarbChart = new Chart(ctx, config);
      console.log('Chart initialized successfully with green/red bars for property type:', this.currentPropertyType);
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }

  getInfoCardClass(type: string): string {
    switch (type) {
      case 'warning':
        return 'from-orange-600/20 to-orange-700/20 border-orange-500/30 hover:border-orange-400/50 hover:shadow-orange-500/25';
      case 'danger':
        return 'from-red-600/20 to-red-700/20 border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/25';
      case 'info':
        return 'from-blue-600/20 to-blue-700/20 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/25';
      default:
        return 'from-gray-600/20 to-gray-700/20 border-gray-500/30 hover:border-gray-400/50 hover:shadow-gray-500/25';
    }
  }

  getInfoCardTextClass(type: string): string {
    switch (type) {
      case 'warning':
        return 'text-orange-300';
      case 'danger':
        return 'text-red-300';
      case 'info':
        return 'text-blue-300';
      default:
        return 'text-gray-300';
    }
  }

  getInfoCardDescClass(type: string): string {
    switch (type) {
      case 'warning':
        return 'text-orange-200';
      case 'danger':
        return 'text-red-200';
      case 'info':
        return 'text-blue-200';
      default:
        return 'text-gray-200';
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  getAnimationDelay(index: number): string {
    return `${300 + (index * 100)}ms`;
  }
}