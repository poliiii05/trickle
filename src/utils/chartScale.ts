    /**
 * Rounds a maximum up to a friendly ceiling so bars never touch the top
 * and the axis reads in round numbers.
 */
const DAY_STEPS = [15, 30, 60, 120, 180, 240, 360, 480, 720, 960, 1440];
const WEEK_STEPS = [120, 240, 480, 840, 1200, 1800, 2400, 3600, 5040, 7200];
const MONTH_STEPS = [480, 960, 1800, 3000, 4800, 7200, 10800, 15000, 21600, 30000];

export interface ChartScale {
  max: number;
  sections: number;
}

export function chartScale(
  peakMinutes: number,
  bucket: 'day' | 'week' | 'month',
): ChartScale {
  const steps =
    bucket === 'day' ? DAY_STEPS : bucket === 'week' ? WEEK_STEPS : MONTH_STEPS;

  // First step that leaves at least 15% headroom above the tallest bar
  const needed = peakMinutes * 1.15;
  const max = steps.find(v => v >= needed) ?? steps[steps.length - 1];

  // Prefer 4 sections; drop to 3 when 4 wouldn't divide cleanly
  const sections = max % 4 === 0 ? 4 : 3;

  return { max, sections };
}

/** Axis labels: minutes under an hour, hours above it. */
export function formatAxisValue(minutes: number): string {
  if (minutes === 0) return '0';
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}