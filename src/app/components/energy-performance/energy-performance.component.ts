// energy-performance.component.ts - Updated with Sustainability Matrix
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { 
  EnergyPerformanceService, 
  PropertyData, 
  EnergyData, 
  PropertyAddress 
} from '../../services/energy-performance.service';
import { Inline3DModelComponent } from '../inline3d-model/inline3d-model.component';

interface SustainabilityData {
  potentialLevel: string;
  handlingNeed: boolean;
  economicallyReasonable: boolean;
  sustainability: string;
  efficiencyClass: string;
  rating: number;
}

interface PotentialCategory {
  level: string;
  description: string;
  maxSavings: number;
  timeframe: number;
  color: string;
  bgColor: string;
}

interface SustainabilityMatrix {
  multiHome: PotentialCategory[];
  singleHome: PotentialCategory[];
  currentCategory: 'multiHome' | 'singleHome';
  currentLevel: number; // 0-3 for the 4 categories
}

@Component({
  selector: 'app-energy-performance',
  templateUrl: './energy-performance.component.html',
  styleUrls: ['./energy-performance.component.css'],
  standalone: true,
  imports: [CommonModule, Inline3DModelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnergyPerformanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  mounted = false;
  cardsVisible = false;
  
  // Data from service
  propertyData: PropertyData | null = null;
  energyData: EnergyData | null = null;
  address: PropertyAddress | null = null;

  // Data that stays in component
  sustainabilityData: SustainabilityData = {
    potentialLevel: 'Mittleres Potenzial',
    handlingNeed: true,
    economicallyReasonable: true,
    sustainability: 'Nachhaltigkeit',
    efficiencyClass: 'D',
    rating: 125
  };

  // Sustainability matrix data (will come from API)
  sustainabilityMatrix: SustainabilityMatrix = {
    multiHome: [
      {
        level: 'Niedriges Potential',
        description: 'Kein Handlungsbedarf empfohlen! Sanierung nicht mehr wirtschaftlich.',
        maxSavings: 0,
        timeframe: 15,
        color: 'text-green-600',
        bgColor: 'bg-green-500'
      },
      {
        level: 'Mittleres Potential', 
        description: 'Handlungsbedarf empfohlen! Bis zu 120.000 € Ersparnisse in 15 Jahren',
        maxSavings: 120000,
        timeframe: 15,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500'
      },
      {
        level: 'Hohes Potential',
        description: 'Handlungsbedarf notwendig! Bis zu 170.000 € Ersparnisse in 15 Jahren',
        maxSavings: 170000,
        timeframe: 15,
        color: 'text-orange-600',
        bgColor: 'bg-orange-500'
      },
      {
        level: 'Höchstes Potential',
        description: 'Handlungsbedarf zwingend notwendig! Über 170.000 € Ersparnisse in 15 Jahren',
        maxSavings: 170000,
        timeframe: 15,
        color: 'text-red-600',
        bgColor: 'bg-red-500'
      }
    ],
    singleHome: [
      {
        level: 'Niedriges Potential',
        description: 'Kein Handlungsbedarf empfohlen! Sanierung nicht mehr wirtschaftlich.',
        maxSavings: 0,
        timeframe: 15,
        color: 'text-green-600',
        bgColor: 'bg-green-500'
      },
      {
        level: 'Mittleres Potential',
        description: 'Handlungsbedarf empfohlen! Bis zu 50.000 € Ersparnisse in 15 Jahren',
        maxSavings: 50000,
        timeframe: 15,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500'
      },
      {
        level: 'Hohes Potential',
        description: 'Handlungsbedarf notwendig! Bis zu 100.000 € Ersparnisse in 15 Jahren',
        maxSavings: 100000,
        timeframe: 15,
        color: 'text-orange-600',
        bgColor: 'bg-orange-500'
      },
      {
        level: 'Höchstes Potential',
        description: 'Handlungsbedarf zwingend notwendig! Über 100.000 € Ersparnisse in 15 Jahren',
        maxSavings: 100000,
        timeframe: 15,
        color: 'text-red-600',
        bgColor: 'bg-red-500'
      }
    ],
    currentCategory: 'singleHome', // Will be determined by API
    currentLevel: 1 // Will be determined by efficiency class (0=A,B; 1=C,D; 2=E,F; 3=G,H)
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private energyPerformanceService: EnergyPerformanceService
  ) {}

  ngOnInit(): void {
    this.subscribeToDataChanges();
    this.initializeAnimations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to service data changes
   */
  private subscribeToDataChanges(): void {
    // Subscribe to all data streams
    combineLatest([
      this.energyPerformanceService.propertyData$,
      this.energyPerformanceService.energyData$,
      this.energyPerformanceService.address$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([propertyData, energyData, address]) => {
      this.propertyData = propertyData;
      this.energyData = energyData;
      this.address = address;
      
      // Update sustainability data based on energy data if available
      if (energyData) {
        this.updateSustainabilityData(energyData);
      }
      
      this.cdr.detectChanges();
    });
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

    // Trigger bottom cards animation after main content
    setTimeout(() => {
      this.cardsVisible = true;
      this.cdr.detectChanges();
    }, 1200);
  }

    // Utility to convert polar coordinates to cartesian
  polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const angleRad = (angleDeg - 90) * Math.PI / 180.0;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    };
  }

  // Returns SVG arc path for a segment from startAngle to endAngle
  describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = this.polarToCartesian(cx, cy, r, endAngle);
    const end = this.polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }


    /**
   * Get the angle for the small energy chart arrow (for Mittleres Potential)
   * Points to the center of the C/D segment in a 180° half-circle
   */
  getSmallChartArrowAngle(): number {
    // For Mittleres Potential, point to the center between C and D
    // Classes: [A+, A, B, C, D, E, F, G, H] (9 total)
    // C = index 3, D = index 4
    const total = 9;
    const segmentAngle = 180 / total;
    // Center between C (3) and D (4): average index = 3.5
    return -90 + segmentAngle * (3.5 + 0.5); // +0.5 for center of segment
  }
  /**
   * Update sustainability data based on energy data
   */
  private updateSustainabilityData(energyData: EnergyData): void {
    // Update efficiency class based on kWh/m2
    this.sustainabilityData.efficiencyClass = this.getEfficiencyClass(energyData.kwhPerM2);
    this.sustainabilityData.rating = energyData.kwhPerM2;
    
    // Update sustainability matrix level based on efficiency class
    this.sustainabilityMatrix.currentLevel = this.getPotentialLevel(this.sustainabilityData.efficiencyClass);
    
    // Update potential level based on rating
    const currentPotential = this.getCurrentPotentialCategory();
    this.sustainabilityData.potentialLevel = currentPotential.level;
  }

  /**
   * Get potential level index based on efficiency class
   */
  private getPotentialLevel(efficiencyClass: string): number {
    if (['A+', 'A', 'B'].includes(efficiencyClass)) return 0;
    if (['C', 'D'].includes(efficiencyClass)) return 1;
    if (['E', 'F'].includes(efficiencyClass)) return 2;
    return 3; // G, H
  }

  /**
   * Get current potential category
   */
  getCurrentPotentialCategory(): PotentialCategory {
    const categories = this.sustainabilityMatrix.currentCategory === 'multiHome' 
      ? this.sustainabilityMatrix.multiHome 
      : this.sustainabilityMatrix.singleHome;
    return categories[this.sustainabilityMatrix.currentLevel];
  }

  /**
   * Get home type display text
   */
  getHomeTypeText(): string {
    return this.sustainabilityMatrix.currentCategory === 'multiHome' ? 'MULTI HOME' : 'SINGLE HOME';
  }

  /**
   * Get the efficiency class based on kWh/m2a rating
   */
  getEfficiencyClass(rating: number): string {
    if (rating <= 30) return 'A+';
    if (rating <= 50) return 'A';
    if (rating <= 75) return 'B';
    if (rating <= 100) return 'C';
    if (rating <= 130) return 'D';
    if (rating <= 160) return 'E';
    if (rating <= 200) return 'F';
    if (rating <= 250) return 'G';
    return 'H';
  }

  /**
   * Get color for efficiency rating
   */
  getEfficiencyColor(rating: number): string {
    if (rating <= 30) return 'text-green-500';
    if (rating <= 50) return 'text-green-400';
    if (rating <= 75) return 'text-lime-400';
    if (rating <= 100) return 'text-yellow-400';
    if (rating <= 130) return 'text-orange-400';
    if (rating <= 160) return 'text-orange-500';
    if (rating <= 200) return 'text-red-400';
    if (rating <= 250) return 'text-red-500';
    return 'text-red-600';
  }

  /**
   * Get background color for efficiency rating
   */
  getEfficiencyBgColor(rating: number): string {
    if (rating <= 30) return 'bg-green-500';
    if (rating <= 50) return 'bg-green-400';
    if (rating <= 75) return 'bg-lime-400';
    if (rating <= 100) return 'bg-yellow-400';
    if (rating <= 130) return 'bg-orange-400';
    if (rating <= 160) return 'bg-orange-500';
    if (rating <= 200) return 'bg-red-400';
    if (rating <= 250) return 'bg-red-500';
    return 'bg-red-600';
  }

  /**
   * Format large numbers with thousands separator
   */
  formatNumber(value: number): string {
    return value.toLocaleString('de-DE');
  }

  /**
   * Get formatted address for display
   */
  getFormattedAddress(): string {
    return this.address?.fullAddress || 'Address not available';
  }

  /**
   * Check if data is loaded
   */
  isDataLoaded(): boolean {
    return !!(this.propertyData && this.energyData && this.address);
  }

  /**
   * Get building age using service method
   */
  getBuildingAge(): number {
    return this.energyPerformanceService.getBuildingAge();
  }

  /**
   * Check if building is residential using service method
   */
  isResidential(): boolean {
    return this.energyPerformanceService.isResidential();
  }

  /**
   * Get formatted energy carrier using service method
   */
  getFormattedEnergyCarrier(): string {
    return this.energyPerformanceService.getFormattedEnergyCarrier();
  }
}