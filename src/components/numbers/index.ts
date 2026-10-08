/**
 * Numbers - Unified API for animated number components
 * 
 * This barrel export consolidates all number animation components
 * for easy access throughout the application.
 * 
 * ## Component Selection Guide:
 * 
 * | Scenario                        | Recommended Component       |
 * |---------------------------------|-----------------------------|
 * | Hero metrics, highlighted values | AnimatedNumber             |
 * | Lists, tables (many items)      | OptimizedAnimatedNumber    |
 * | Gauges with status colors       | GaugeChart / SpeedometerGauge |
 */

// Primary components
export { AnimatedNumber } from '@/modules/home/components/AnimatedNumber';
export { OptimizedAnimatedNumber } from '@/modules/analytics/dashboard/components/OptimizedAnimatedNumber';

// Gauge components
export { GaugeChart } from '@/modules/analytics/dashboard/components/GaugeChart';
export { SpeedometerGauge } from '@/modules/analytics/dashboard/components/SpeedometerGauge';
export { RadialProgressChart } from '@/modules/analytics/dashboard/components/RadialProgressChart';
