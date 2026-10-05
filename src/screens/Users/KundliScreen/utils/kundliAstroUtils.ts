import moment from 'moment';

/**
 * Returns a derived divisional or planetary chart (e.g. Surya Kundli, Chandra Kundli)
 * by rotating the chart so the specified planet becomes the ascendant.
 */
export const getDerivedChart = (baseChart: any, planetName: string) => {
  if (!baseChart || !baseChart.planets || !baseChart.planets[planetName]) {
    return baseChart;
  }
  const planetData = baseChart.planets[planetName];
  return {
    ...baseChart,
    ascendant: {
      ...baseChart.ascendant,
      sign: planetData.sign,
      pos: planetData.pos,
    },
  };
};

/**
 * Formats birth date into human-readable representation
 */
export const formatBirthDate = (
  birthDate?: string,
  birthdetails?: any,
): string => {
  if (birthDate) {
    return moment(birthDate).format('DD MMM YYYY');
  }
  if (birthdetails?.DOB) {
    const monthStr = moment()
      .month(birthdetails.DOB.month - 1)
      .format('MMM');
    return `${birthdetails.DOB.day} ${monthStr} ${birthdetails.DOB.year}`;
  }
  return '';
};

/**
 * Formats birth time into human-readable 12-hour AM/PM representation
 */
export const formatBirthTime = (
  birthTime?: string,
  birthdetails?: any,
): string => {
  if (birthTime) {
    return moment(birthTime, ['HH:mm:ss', 'HH:mm']).format('hh:mm A');
  }
  if (birthdetails?.TOB) {
    const hh = String(birthdetails.TOB.hour).padStart(2, '0');
    const mm = String(birthdetails.TOB.min).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return '';
};

/**
 * Formats birth place
 */
export const formatBirthPlace = (
  birthPlace?: string,
  birthdetails?: any,
): string => {
  return birthPlace || birthdetails?.POB?.name || '';
};
