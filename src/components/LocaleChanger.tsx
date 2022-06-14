import { useRouter } from 'next/router';
import React from 'react';
import { I18NKey } from '~/utils/i18n';

export const LocaleChanger: React.FC<{
  localeKey: I18NKey;
}> = ({ localeKey }) => {
  const router = useRouter();
  const { pathname, asPath, query } = router;
  const nextLocale = localeKey === 'en' ? 'uk' : 'en';
  return (
    <button
      aria-hidden="true"
      onClick={() =>
        router.push({ pathname, query }, asPath, { locale: nextLocale })
      }
      className="group p-2 transition-colors duration-200 rounded-full shadow-md bg-blue-200 hover:bg-blue-200 dark:bg-gray-50 dark:hover:bg-gray-200 text-gray-900 focus:outline-none"
    >
      <span className="w-[24px] h-[24px] text-2xl flex flex-col justify-center content-center">
        {localeKey === 'en' ? '🇺🇦' : '🇺🇸'}
      </span>
    </button>
  );
};
