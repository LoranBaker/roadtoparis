// energy-dashboard-wrapper.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EnergyPerformanceComponent } from '../components/energy-performance/energy-performance.component';
import { Co2TaxRentComponent } from '../components/co2-tax-rent/co2-tax-rent.component';
import { StrandedAssetsComponent } from "../components/stranded-assets/stranded-assets.component";
import { BuildingComparisonComponent } from "../components/building-comparison/building-comparison.component";
import { ScreenshotPdfService } from '../services/screenshot-pdf.service';

@Component({
  selector: 'app-energy-dashboard-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    EnergyPerformanceComponent, 
    Co2TaxRentComponent, 
    StrandedAssetsComponent, 
    BuildingComparisonComponent
  ],
  templateUrl: './energy-dashboard-wrapper.component.html',
  styleUrls: ['./energy-dashboard-wrapper.component.css']
})
export class EnergyDashboardWrapperComponent {
  
  isGeneratingPdf = false;
  generationProgress = '';

  constructor(private pdfService: ScreenshotPdfService) {}

  /**
   * Generate PDF from dashboard screenshots
   */
  async generatePDF(): Promise<void> {
    this.isGeneratingPdf = true;
    this.generationProgress = 'Loading PDF libraries...';
    
    try {
      // Update progress
      this.generationProgress = 'Preparing dashboard...';
      await this.delay(500);
      
      this.generationProgress = 'Capturing screenshots...';
      await this.delay(500);
      
      const filename = `energy-dashboard-report`;
      await this.pdfService.generateDashboardPDF(filename);
      
      this.generationProgress = 'PDF generated successfully!';
      
      // Show success message briefly
      setTimeout(() => {
        this.generationProgress = '';
      }, 2000);

    } catch (error: unknown) {
      console.error('Error generating PDF:', error);
      this.generationProgress = 'Error generating PDF';
      
      // Show error message briefly then clear
      setTimeout(() => {
        this.generationProgress = '';
      }, 3000);
      
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`There was an error generating the PDF: ${errorMessage}. Please check your internet connection and try again.`);
    } finally {
      setTimeout(() => {
        this.isGeneratingPdf = false;
      }, 2000);
    }
  }

  /**
   * Screenshot specific component
   */
  async screenshotComponent(componentName: string): Promise<void> {
    this.isGeneratingPdf = true;
    this.generationProgress = `Capturing ${componentName}...`;
    
    try {
      const selectors = {
        'energy-performance': 'app-energy-performance',
        'co2-tax-rent': 'app-co2-tax-rent',
        'stranded-assets': 'app-stranded-assets',
        'building-comparison': 'app-building-comparison'
      };

      const selector = selectors[componentName as keyof typeof selectors];
      if (!selector) {
        throw new Error(`Unknown component: ${componentName}`);
      }

      const filename = `${componentName}-screenshot-${new Date().toISOString().split('T')[0]}.png`;
      await this.pdfService.screenshotComponent(selector, filename);
      
      this.generationProgress = 'Screenshot saved!';
      
      setTimeout(() => {
        this.generationProgress = '';
      }, 2000);

    } catch (error: unknown) {
      console.error(`Error capturing ${componentName}:`, error);
      this.generationProgress = 'Error capturing screenshot';
      
      setTimeout(() => {
        this.generationProgress = '';
      }, 3000);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`There was an error capturing the ${componentName} screenshot: ${errorMessage}. Please try again.`);
    } finally {
      setTimeout(() => {
        this.isGeneratingPdf = false;
      }, 2000);
    }
  }

  /**
   * Helper method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Show loading state based on current operation
   */
  get isLoading(): boolean {
    return this.isGeneratingPdf;
  }

  /**
   * Get appropriate button text based on state
   */
  getButtonText(): string {
    if (this.generationProgress) {
      return this.generationProgress;
    }
    return this.isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF Report';
  }
}