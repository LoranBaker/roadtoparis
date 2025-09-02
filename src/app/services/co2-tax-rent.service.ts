export interface Co2TaxRentData {
  jahr: number;
  preisTonneCo2: number;
  differenzStart: number;
  co2TaxMore: number;
  mieteinnahme: number;
  wert: number;
  mieteNach: number;
  mietrendite: number;
  weniger: number;
  co2EmissionsTons: number;
}

export class Co2TaxRentService {
  // Data rows for years 2025-2040 with fixed preisTonneCo2 values
  dataRows: Co2TaxRentData[] = [
    { jahr: 2025, preisTonneCo2: 55, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2026, preisTonneCo2: 65, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2027, preisTonneCo2: 75, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2028, preisTonneCo2: 120, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2030, preisTonneCo2: 200, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2031, preisTonneCo2: 210, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2032, preisTonneCo2: 220, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2033, preisTonneCo2: 230, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2034, preisTonneCo2: 240, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2035, preisTonneCo2: 250, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2036, preisTonneCo2: 260, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2037, preisTonneCo2: 270, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2038, preisTonneCo2: 280, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2039, preisTonneCo2: 290, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 },
    { jahr: 2040, preisTonneCo2: 300, differenzStart: 0, co2TaxMore: 0, mieteinnahme: 0, wert: 0, mieteNach: 0, mietrendite: 0, weniger: 0, co2EmissionsTons: 0 }
  ];

  // Calculate differenzStart for each year (difference from base year 2025)
  calculateDifferenzStart(): void {
    const basePrice = this.dataRows[0].preisTonneCo2; // 55 EUR from 2025
    
    for (let i = 0; i < this.dataRows.length; i++) {
      this.dataRows[i].differenzStart = this.dataRows[i].preisTonneCo2 - basePrice;
    }
  }

  // Calculate CO2 tax increase for each year
  calculateCo2TaxMore(): void {
    this.calculateDifferenzStart(); // Ensure differenzStart is calculated first
    
    this.dataRows.forEach(row => {
      row.co2TaxMore = row.co2EmissionsTons * row.differenzStart;
    });
  }

  // Calculate Miete Nach (Rent After CO2 Tax) for each year
  calculateMieteNach(): void {
    this.calculateCo2TaxMore(); // Ensure CO2 tax is calculated first
    
    this.dataRows.forEach(row => {
      row.mieteNach = row.mieteinnahme - row.co2TaxMore;
    });
  }

  // Calculate weniger (percentage reduction in rental yield compared to base year)
  calculateWeniger(): void {
    this.calculateMieteNach(); // Ensure mieteNach is calculated first
    
    // Base year rental yield (2025) - calculated as mieteinnahme/wert * 100
    const baseYearRow = this.dataRows[0]; // 2025
    const baseYearMietrendite = baseYearRow.mieteinnahme > 0 && baseYearRow.wert > 0 
      ? (baseYearRow.mieteinnahme / baseYearRow.wert) * 100 
      : 5; // Default to 5% if not calculated
    
    this.dataRows.forEach(row => {
      const currentMietrendite = this.getMietrendite(row);
      // weniger = 100% - (current yield / base yield * 100)
      row.weniger = 100 - ((currentMietrendite / baseYearMietrendite) * 100);
    });
  }

  // Get differenzStart data for all years
  getDifferenzStartData(): { jahr: number; preisTonneCo2: number; differenzStart: number }[] {
    this.calculateDifferenzStart(); // Ensure calculations are up to date
    return this.dataRows.map(row => ({
      jahr: row.jahr,
      preisTonneCo2: row.preisTonneCo2,
      differenzStart: row.differenzStart
    }));
  }

  // Get differenzStart for a specific year
  getDifferenzStartForYear(year: number): number {
    this.calculateDifferenzStart();
    const row = this.dataRows.find(r => r.jahr === year);
    return row ? row.differenzStart : 0;
  }

  // Set dummy values for simulation (same values for all years)
  setDummyValues(mieteinnahme: number = 5000, wert: number = 100000, co2EmissionsTons: number = 17): void {
    this.dataRows.forEach(row => {
      row.mieteinnahme = mieteinnahme;
      row.wert = wert;
      row.co2EmissionsTons = co2EmissionsTons;
    });
    
    // Perform all calculations after setting values
    this.calculateAllValues();
  }

  // Simulate client input for specific year
  setValuesForYear(year: number, mieteinnahme: number, wert: number, co2EmissionsTons: number = 17): void {
    const row = this.dataRows.find(r => r.jahr === year);
    if (row) {
      row.mieteinnahme = mieteinnahme;
      row.wert = wert;
      row.co2EmissionsTons = co2EmissionsTons;
    }
    
    // Recalculate all derived values
    this.calculateAllValues();
  }

  // Set values for all years (client input simulation)
  setValuesForAllYears(mieteinnahme: number, wert: number, co2EmissionsTons: number = 17): void {
    this.dataRows.forEach(row => {
      row.mieteinnahme = mieteinnahme;
      row.wert = wert;
      row.co2EmissionsTons = co2EmissionsTons;
    });
    
    // Perform all calculations after setting values
    this.calculateAllValues();
  }

  // Calculate all derived values in the correct order
  calculateAllValues(): void {
    this.calculateDifferenzStart();
    this.calculateCo2TaxMore();
    this.calculateMieteNach();
    this.calculateWeniger();
    
    // Calculate mietrendite for all rows
    this.dataRows.forEach(row => {
      row.mietrendite = this.getMietrendite(row);
    });
  }

  // Get complete data with all calculations
  getCompleteData(): Co2TaxRentData[] {
    this.calculateAllValues();
    return [...this.dataRows]; // Return a copy to avoid direct mutation
  }

  // Initialize and get data with dummy values (for testing)
  initializeWithDummyData(mieteinnahme: number = 50000, wert: number = 1000000, co2EmissionsTons: number = 17): Co2TaxRentData[] {
    this.setDummyValues(mieteinnahme, wert, co2EmissionsTons);
    return this.getCompleteData();
  }

  // Calculate Mietrendite in percent for a given data row (based on net rent after CO2 tax)
  getMietrendite(row: Co2TaxRentData): number {
    if (!row.wert || row.wert === 0) return 0;
    return (row.mieteNach / row.wert) * 100;
  }
}
