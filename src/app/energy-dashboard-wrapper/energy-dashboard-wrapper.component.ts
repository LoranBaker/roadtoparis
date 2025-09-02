// energy-dashboard-wrapper.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EnergyPerformanceComponent } from '../components/energy-performance/energy-performance.component';
import { Co2TaxRentComponent } from '../components/co2-tax-rent/co2-tax-rent.component';
import { StrandedAssetsComponent } from "../components/stranded-assets/stranded-assets.component";
import { BuildingComparisonComponent } from "../components/building-comparison/building-comparison.component";

@Component({
  selector: 'app-energy-dashboard-wrapper',
  standalone: true,
  imports: [EnergyPerformanceComponent, Co2TaxRentComponent, StrandedAssetsComponent, BuildingComparisonComponent],
  templateUrl: './energy-dashboard-wrapper.component.html',
  styleUrls: ['./energy-dashboard-wrapper.component.css']
})
export class EnergyDashboardWrapperComponent {
  
}