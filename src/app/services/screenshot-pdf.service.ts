// screenshot-pdf.service.ts
import { Injectable } from '@angular/core';

// Declare global variables for the libraries
declare var html2canvas: any;
declare var jsPDF: any;

@Injectable({
  providedIn: 'root'
})
export class ScreenshotPdfService {

  private librariesLoaded = false;

  constructor() { }

  /**
   * Initialize required libraries
   */
  private async initializeLibraries(): Promise<void> {
    if (this.librariesLoaded) {
      return;
    }

    try {
      // Load html2canvas
      await this.loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
      
      // Load jsPDF (UMD build exposes window.jspdf.jsPDF)
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

      // Map UMD export to a global jsPDF for compatibility if needed
      const jsPdfCtor = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
      if (jsPdfCtor && !(window as any).jsPDF) {
        (window as any).jsPDF = jsPdfCtor;
      }

      // Wait a bit for libraries to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      this.librariesLoaded = true;
    } catch (error) {
      console.error('Failed to load libraries:', error);
      throw new Error('Required libraries could not be loaded. Please check your internet connection.');
    }
  }

  /**
   * Load a script dynamically
   */
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Generate PDF from dashboard screenshots
   */
  async generateDashboardPDF(filename: string = 'energy-dashboard-report'): Promise<void> {
    try {
      // Initialize libraries
      await this.initializeLibraries();

      // Check if libraries are available
      const hasHtml2canvas = typeof html2canvas !== 'undefined' || typeof (window as any).html2canvas !== 'undefined';
      if (!hasHtml2canvas) {
        throw new Error('html2canvas library not loaded');
      }

      const jsPdfCtor = (window as any).jspdf?.jsPDF || (window as any).jsPDF || (typeof jsPDF !== 'undefined' ? jsPDF : undefined);
      if (!jsPdfCtor) {
        throw new Error('jsPDF library not loaded');
      }

      // Get jsPDF constructor
      const PDF = jsPdfCtor;

      // Prepare dashboard
      this.prepareDashboard();

      // Capture screenshots
      const screenshots = await this.captureAllComponents();

      // Create PDF
      await this.createPDF(PDF, screenshots, filename);

      // Cleanup
      this.restoreDashboard();

    } catch (error: unknown) {
      console.error('Error generating PDF:', error);
      this.restoreDashboard();
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare dashboard for screenshot
   */
  private prepareDashboard(): void {
    // Hide print controls
    const controls = document.querySelectorAll('.no-print');
    controls.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    // Pause animations
    const animated = document.querySelectorAll('.animate-float, .animate-glow');
    animated.forEach(el => {
      (el as HTMLElement).style.animationPlayState = 'paused';
    });

    // Scroll to top
    window.scrollTo(0, 0);
  }

  /**
   * Restore dashboard after screenshot
   */
  private restoreDashboard(): void {
    // Restore hidden elements
    const controls = document.querySelectorAll('.no-print');
    controls.forEach(el => {
      (el as HTMLElement).style.display = '';
    });

    // Restore animations
    const animated = document.querySelectorAll('.animate-float, .animate-glow');
    animated.forEach(el => {
      (el as HTMLElement).style.animationPlayState = '';
    });
  }

  /**
   * Capture all dashboard components
   */
  private async captureAllComponents(): Promise<ComponentScreenshot[]> {
    const screenshots: ComponentScreenshot[] = [];
    
    const components = [
      { selector: 'app-energy-performance', name: 'Energy Performance Analysis' },
      { selector: 'app-co2-tax-rent', name: 'CO2 Tax & Rent Impact' },
      { selector: 'app-stranded-assets', name: 'Stranded Assets Assessment' },
      { selector: 'app-building-comparison', name: 'Building Comparison Report' }
    ];

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Prefer the global attached by the script tag
    const h2c = (window as any).html2canvas || html2canvas;

    for (const component of components) {
      const element = document.querySelector(component.selector) as HTMLElement;
      if (element) {
        try {
          // Scroll component into view
          element.scrollIntoView({ behavior: 'auto', block: 'start' });
          await new Promise(resolve => setTimeout(resolve, 500));

          // Capture screenshot
          const canvas = await h2c(element, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: '#1e3a8a',
            logging: false,
            width: element.offsetWidth,
            height: element.offsetHeight
          });

          screenshots.push({
            name: component.name,
            canvas: canvas
          });

        } catch (error: unknown) {
          console.warn(`Failed to capture ${component.name}:`, error);
        }
      }
    }

    return screenshots;
  }

  /**
   * Create PDF from screenshots
   */
  private async createPDF(PDF: any, screenshots: ComponentScreenshot[], filename: string): Promise<void> {
    // Create PDF
    const pdf = new PDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = 210;
    const pageHeight = 297;

    // Page background color (blue) and compact spacing
    const bg = { r: 30, g: 58, b: 138 }; // #1e3a8a
    const marginTop = 5; // reduced top margin
    const marginBottom = 5;
    const gap = 3; // small gap between containers

    // Fill first page background
    pdf.setFillColor(bg.r, bg.g, bg.b);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Keep previous behavior
    const expansion = 1.1; // 10% wider
    let firstShiftApplied = false;

    // Cursor for vertical stacking
    let yCursor = marginTop;

    for (let i = 0; i < screenshots.length; i++) {
      const canvas = screenshots[i].canvas;
      const ratio = canvas && canvas.height ? (canvas.width / canvas.height) : 1;

      // Compute draw size preserving aspect ratio, make a bit wider and crop
      let w = pageWidth * expansion;
      let h = w / ratio;

      // Center horizontally by default
      let x = -(w - pageWidth) / 2;

      // Optional one-time right shift for the first image (existing behavior)
      if (!firstShiftApplied) {
        const leftOffsetMm = 43; // shift right by 43mm
        x = leftOffsetMm;
        firstShiftApplied = true;
      }

      // If image would overflow the page, start a new one and paint background
      if (yCursor + h > pageHeight - marginBottom) {
        pdf.addPage();
        pdf.setFillColor(bg.r, bg.g, bg.b);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        yCursor = marginTop;
      }

      try {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, yCursor, w, h);
      } catch (error: unknown) {
        console.warn(`Failed to add ${screenshots[i].name} to PDF:`, error);
      }

      // Advance cursor with small gap
      yCursor += h + gap;
    }

    const today = new Date().toISOString().split('T')[0];
    pdf.save(`${filename}-${today}.pdf`);
  }

  /**
   * Quick screenshot of specific component
   */
  async screenshotComponent(selector: string, filename?: string): Promise<void> {
    try {
      await this.initializeLibraries();

      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        throw new Error(`Component ${selector} not found`);
      }

      // Prepare for screenshot
      this.prepareDashboard();
      
      // Scroll to component
      element.scrollIntoView({ behavior: 'auto', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Prefer the global attached by the script tag
      const h2c = (window as any).html2canvas || html2canvas;

      // Capture screenshot with blue background
      const canvas = await h2c(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#1e3a8a',
        logging: false
      });

      // Download image
      const link = document.createElement('a');
      link.download = filename || `component-screenshot-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Restore dashboard
      this.restoreDashboard();

    } catch (error: unknown) {
      this.restoreDashboard();
      console.error('Error capturing screenshot:', error);
      throw new Error(`Screenshot failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Interface for component screenshots
interface ComponentScreenshot {
  name: string;
  canvas: HTMLCanvasElement;
}