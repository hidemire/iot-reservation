import { format } from 'date-fns';
import { enUS, uk } from 'date-fns/locale';
import { I18NKey } from './i18n';

export function getLocale(locale?: I18NKey) {
  let l;
  switch (locale) {
    case 'uk':
      l = uk;
      break;
    default:
      l = enUS;
      break;
  }
  return l;
}

export function formatLocale(date: number | Date, f: string, locale?: I18NKey) {
  const l = getLocale(locale);
  return format(date, f, { locale: l });
}
