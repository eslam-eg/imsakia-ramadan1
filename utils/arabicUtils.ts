
export const toAr = (n: number | string): string => {
  return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

export const formatPrayerTime = (date: Date): string => {
  return date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace('ص', 'ص').replace('م', 'م');
};

export const getRamadanDay = (currentDate: Date, ramadanStart: Date): number => {
  const diffTime = currentDate.getTime() - ramadanStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};
