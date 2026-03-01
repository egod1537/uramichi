import localizationConfig from '../../locales.config.js';
import useEditorStore from '../stores/useEditorStore';

const localeModules = import.meta.glob('../locales/*/*.json');
const DEFAULT_LANGUAGE = localizationConfig.defaultLanguage;

let activeLanguage = DEFAULT_LANGUAGE;
let activeMessages = {};
let isLocalizationInitialized = false;

function resolveLanguage(languageValue) {
  if (localizationConfig.languages.includes(languageValue)) {
    return languageValue;
  }

  return DEFAULT_LANGUAGE;
}

function parseLocaleModulePath(modulePath) {
  const pathMatchResult = modulePath.match(/\.\.\/locales\/([^/]+)\/([^/]+)\.json$/);

  if (!pathMatchResult) {
    return null;
  }

  return {
    categoryName: pathMatchResult[1],
    languageCode: pathMatchResult[2],
  };
}

async function loadLanguageMessages(languageValue) {
  const nextLanguage = resolveLanguage(languageValue);
  const mergedMessages = {};
  let loadedModuleCount = 0;

  for (const [modulePath, loadModule] of Object.entries(localeModules)) {
    const parsedPath = parseLocaleModulePath(modulePath);

    if (!parsedPath || parsedPath.languageCode !== nextLanguage) {
      continue;
    }

    const localeModule = await loadModule();
    const localeMessages = localeModule.default ?? localeModule;

    for (const [messageKey, messageValue] of Object.entries(localeMessages)) {
      mergedMessages[`${parsedPath.categoryName}.${messageKey}`] = messageValue;
    }

    loadedModuleCount += 1;
  }

  if (loadedModuleCount === 0 && nextLanguage !== DEFAULT_LANGUAGE) {
    await loadLanguageMessages(DEFAULT_LANGUAGE);
    return;
  }

  activeLanguage = nextLanguage;
  activeMessages = mergedMessages;
}

function formatMessage(templateText, formatArgs) {
  return templateText.replace(/\{(\d+)\}/g, (matchedToken, tokenIndex) => {
    const valueByIndex = formatArgs[Number(tokenIndex)];

    return valueByIndex === undefined ? matchedToken : String(valueByIndex);
  });
}

export function initializeLocalization() {
  if (isLocalizationInitialized) {
    return;
  }

  isLocalizationInitialized = true;

  const initialLanguage = resolveLanguage(useEditorStore.getState().language);
  activeLanguage = initialLanguage;
  void loadLanguageMessages(initialLanguage);

  useEditorStore.subscribe((nextState, previousState) => {
    if (nextState.language === previousState.language) {
      return;
    }

    const nextLanguage = resolveLanguage(nextState.language);

    if (nextLanguage === activeLanguage) {
      return;
    }

    void loadLanguageMessages(nextLanguage);
  });
}

export function L(messageKey, ...formatArgs) {
  const messageTemplate = activeMessages[messageKey];

  if (typeof messageTemplate !== 'string') {
    return messageKey;
  }

  return formatMessage(messageTemplate, formatArgs);
}
