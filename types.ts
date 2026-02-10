
export interface ProjectAssumptions {
  stationCost: number;
  systemCapacity: number;
  annualYieldYear1: number;
  usdSomExchange: number;
  panelDegradation: number;
  inflationRate: number;
  baseTariff: number;
  projectLifetime: number;
  managerName: string;
  managerRole: string;
  projectLocation: string;
  customerName: string;
}

export interface YearProjection {
  year: number;
  tariff: number;
  yield: number;
  revenue: number;
  cumulativeRevenue: number;
  isBreakEven?: boolean;
}

export interface MonthlyData {
  month: string;
  energy: number;
}

export interface ProjectStats {
  paybackPeriod: number;
  totalRoi: number;
}
