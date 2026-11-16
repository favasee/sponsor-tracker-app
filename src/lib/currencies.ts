import { 
  loadCurrenciesConfig, 
  saveCurrenciesConfig,
  loadPurposes as loadSettingsPurposes,
  DEFAULT_DONATION_PURPOSES,
  DEFAULT_CURRENCIES as DEFAULT_SETTINGS_CURRENCIES
} from './settingsStorage';

export const DEFAULT_CURRENCIES = DEFAULT_SETTINGS_CURRENCIES.map(c => c.code);

export function loadCurrencies(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CURRENCIES;
  const list = loadCurrenciesConfig();
  return list.map(c => c.code);
}

export function saveNewCustomCurrency(newCode: string): string[] {
  const code = newCode.trim().toUpperCase();
  if (!code) return loadCurrencies();

  const configs = loadCurrenciesConfig();
  if (!configs.some(c => c.code === code)) {
    const updated = [...configs, { code, name: code, symbol: code }];
    saveCurrenciesConfig(updated);
    return updated.map(c => c.code);
  }
  return configs.map(c => c.code);
}

export const DONATION_PURPOSES = DEFAULT_DONATION_PURPOSES;

export function getActiveDonationPurposes(): string[] {
  return loadSettingsPurposes();
}
