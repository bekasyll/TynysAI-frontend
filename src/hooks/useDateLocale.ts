import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../i18n';

export function useDateLocale() {
  const { i18n } = useTranslation();
  return getDateLocale(i18n.language);
}
