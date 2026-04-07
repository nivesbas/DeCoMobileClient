import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

const CACHE_KEY_PREFIX = 'deco_translations_';
const CACHE_VERSION_KEY = 'deco_translations_version_';

interface TranslationResponse {
  data: {
    locale: string;
    version: string;
    updatedAt: string;
    translations: Record<string, string>;
  };
}

/**
 * Fetch translations for a locale from the backend API.
 * Caches in AsyncStorage and returns cached version if fetch fails.
 */
export async function fetchTranslations(
  locale: string,
): Promise<Record<string, string> | null> {
  const cacheKey = `${CACHE_KEY_PREFIX}${locale}`;

  try {
    const response = await fetch(
      `${CONFIG.BACKEND_URL}/localization/translations/${locale}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) },
    );

    if (!response.ok) {
      console.warn(`[i18n] Failed to fetch translations for ${locale}: ${response.status}`);
      return getCachedTranslations(locale);
    }

    const json: TranslationResponse = await response.json();
    const translations = json.data?.translations;

    if (translations && Object.keys(translations).length > 0) {
      // Cache translations and version
      await AsyncStorage.setItem(cacheKey, JSON.stringify(translations));
      await AsyncStorage.setItem(
        `${CACHE_VERSION_KEY}${locale}`,
        json.data.version ?? new Date().toISOString(),
      );
      return translations;
    }

    return getCachedTranslations(locale);
  } catch (error) {
    console.warn(`[i18n] Translation fetch error for ${locale}:`, error);
    return getCachedTranslations(locale);
  }
}

/**
 * Get cached translations from AsyncStorage.
 */
export async function getCachedTranslations(
  locale: string,
): Promise<Record<string, string> | null> {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${locale}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn(`[i18n] Cache read error for ${locale}:`, error);
  }
  return null;
}
