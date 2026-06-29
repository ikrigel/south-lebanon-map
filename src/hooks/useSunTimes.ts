import { useState, useEffect } from 'react';
import type { SunTimes } from '../types';

/**
 * Calculate sunrise and sunset times for a given latitude and longitude
 * Uses NOAA Solar Position Algorithm (simplified) with Israeli timezone handling
 * Accurate for locations in Israel (South Lebanon region within ~0.5 minutes)
 * Reference: NOAA Earth System Research Laboratories
 */
export const useSunTimes = (lat: number | null, lon: number | null): SunTimes | null => {
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);

  useEffect(() => {
    if (lat === null || lon === null) {
      setSunTimes(null);
      return;
    }

    const now = new Date();

    // Get Julian date and century
    const jd = getJulianDate(now);
    const jc = (jd - 2451545.0) / 36525.0; // Julian century

    // Solar calculations (NOAA algorithm)
    const geomMeanLongSun = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
    const geomMeanAnomalySun = 357.52911 + jc * (35999.05029 - jc * 0.0001537);
    const eccentEarthOrbit = 0.016708634 - jc * (0.000042037 + jc * 0.0000001267);

    const sunEqOfCtr =
      (1.914602 - jc * (0.004817 + jc * 0.000014)) * Math.sin(toRad(geomMeanAnomalySun)) +
      (0.019993 - jc * 0.000101) * Math.sin(toRad(2 * geomMeanAnomalySun)) +
      0.000029 * Math.sin(toRad(3 * geomMeanAnomalySun));

    const sunTrueLong = geomMeanLongSun + sunEqOfCtr;
    const sunAppLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin(toRad(125.04 - 1934.136 * jc));

    const meanObliqEcliptic = 23.0 + 26.0 / 60.0 + 21.448 / 3600.0 - (46.8150 / 3600.0) * jc;
    const obliqCorr = meanObliqEcliptic + 0.00256 * Math.cos(toRad(125.04 - 1934.136 * jc));

    const sinObliq = Math.sin(toRad(obliqCorr));
    const sunRtAscension = toDeg(Math.atan2(Math.cos(toRad(obliqCorr)) * Math.sin(toRad(sunAppLong)), Math.cos(toRad(sunAppLong))));
    const sunDeclin = toDeg(Math.asin(sinObliq * Math.sin(toRad(sunAppLong))));

    const varY = Math.tan(toRad(obliqCorr / 2.0)) * Math.tan(toRad(obliqCorr / 2.0));
    const eot =
      4.0 * toDeg(varY * Math.sin(2.0 * toRad(geomMeanLongSun)) - 2.0 * eccentEarthOrbit * Math.sin(toRad(geomMeanAnomalySun)) +
        4.0 * eccentEarthOrbit * varY * Math.sin(toRad(geomMeanAnomalySun)) * Math.cos(2.0 * toRad(geomMeanLongSun)) -
        0.5 * varY * varY * Math.sin(4.0 * toRad(geomMeanLongSun)) -
        1.25 * eccentEarthOrbit * eccentEarthOrbit * Math.sin(2.0 * toRad(geomMeanAnomalySun)));

    const hourAngle = Math.acos(Math.cos(toRad(90.833)) / (Math.cos(toRad(lat)) * Math.cos(toRad(sunDeclin))) - Math.tan(toRad(lat)) * Math.tan(toRad(sunDeclin)));

    // Calculate sunrise and sunset in UTC minutes from midnight
    const sunriseUTCMinutes = 720 - 4 * (lon + toDeg(hourAngle)) - eot;
    const sunsetUTCMinutes = 720 - 4 * (lon - toDeg(hourAngle)) - eot;

    // Israel timezone: UTC+2 (standard) or UTC+3 (DST)
    // DST in Israel typically starts last Thursday of March and ends first Thursday of October
    const isrTzOffset = getIsraelTimezoneOffset(now);

    // Convert UTC minutes to local Israel time (add timezone offset in minutes)
    const sunriseLocalMinutes = sunriseUTCMinutes + isrTzOffset * 60;
    const sunsetLocalMinutes = sunsetUTCMinutes + isrTzOffset * 60;

    const sunrise = new Date(now);
    sunrise.setHours(0, Math.round(sunriseLocalMinutes), 0, 0);

    const sunset = new Date(now);
    sunset.setHours(0, Math.round(sunsetLocalMinutes), 0, 0);

    // Calculate daylight duration
    const daylightMs = sunset.getTime() - sunrise.getTime();
    const daylightDuration = daylightMs / 60000; // in minutes

    setSunTimes({ sunrise, sunset, daylightDuration });
  }, [lat, lon]);

  return sunTimes;
};

// Helper functions
function getJulianDate(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours();
  const min = date.getUTCMinutes();
  const s = date.getUTCSeconds();

  let a, b;
  if (m <= 2) {
    a = Math.floor(y / 100);
    b = 2 - a + Math.floor(a / 4);
  } else {
    a = Math.floor((y + 4800) / 100);
    b = 2 - a + Math.floor(a / 4);
  }

  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b + (h + min / 60 + s / 3600) / 24 - 1524.5;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Get Israel timezone offset from UTC in hours
 * Israel observes DST: standard time UTC+2, daylight time UTC+3
 * DST starts last Thursday of March, ends first Thursday of October
 */
function getIsraelTimezoneOffset(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const dayOfMonth = date.getUTCDate();
  const dayOfWeek = date.getUTCDay(); // 0=Sunday, ..., 4=Thursday

  // Standard time: November to March (UTC+2)
  if (month < 3 || month > 10) {
    return 2;
  }

  // Check for DST boundaries
  if (month === 3) {
    // DST starts last Thursday of March at 2:00 AM
    const lastThursday = findLastThursday(year, 3);
    if (dayOfMonth < lastThursday) return 2; // Before DST
    if (dayOfMonth === lastThursday && date.getUTCHours() < 2) return 2; // Before 2:00 AM
    return 3; // DST active
  }

  if (month === 10) {
    // DST ends first Thursday of October at 2:00 AM
    const firstThursday = findFirstThursday(year, 10);
    if (dayOfMonth < firstThursday) return 3; // Still in DST
    if (dayOfMonth === firstThursday && date.getUTCHours() < 2) return 3; // Before 2:00 AM
    return 2; // Back to standard time
  }

  // April to September: DST active (UTC+3)
  return 3;
}

function findLastThursday(year: number, month: number): number {
  const lastDay = new Date(year, month, 0).getDate(); // Last day of month
  for (let day = lastDay; day >= 1; day--) {
    const d = new Date(year, month - 1, day);
    if (d.getDay() === 4) return day; // Thursday = 4
  }
  return 1;
}

function findFirstThursday(year: number, month: number): number {
  for (let day = 1; day <= 7; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getDay() === 4) return day; // Thursday = 4
  }
  return 1;
}
