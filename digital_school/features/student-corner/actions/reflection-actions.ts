'use server';

import {
  getFullSpiritualPackage,
  getLiveRandomDua,
  getLivePrayerTimes,
} from '../services/ummah-api-service';
import { getDayOfYear } from 'date-fns';

export async function getDailyReflectionAction(customDayOfYear?: number) {
  try {
    const day = customDayOfYear || getDayOfYear(new Date());
    const spiritualPackage = await getFullSpiritualPackage(day);

    return {
      success: true,
      dayNumber: day,
      ...spiritualPackage,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to fetch reflection package',
    };
  }
}

export async function getFreshDuaAction(category?: string) {
  try {
    const dua = await getLiveRandomDua(category);
    return {
      success: true,
      dua,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to fetch fresh dua',
    };
  }
}

export async function getLivePrayerTimesAction(lat?: number, lng?: number) {
  try {
    const prayerTimes = await getLivePrayerTimes(lat, lng);
    return {
      success: true,
      prayerTimes,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to fetch prayer times',
    };
  }
}
