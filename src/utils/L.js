import useEditorStore from '../stores/useEditorStore'

const localeLoaders = {
  ko: () => import('../locales/ko.json'),
  ja: () => import('../locales/ja.json'),
  en: () => import('../locales/en.json'),
}

const DEFAULT_LANGUAGE = 'ko'

let activeLanguage = DEFAULT_LANGUAGE
let activeMessages = {}
let isLocalizationInitialized = false

function resolveLanguage(languageValue) {
  if (localeLoaders[languageValue]) {
    return languageValue
  }

  return DEFAULT_LANGUAGE
}

async function loadLanguageMessages(languageValue) {
  const nextLanguage = resolveLanguage(languageValue)

  try {
    const localeModule = await localeLoaders[nextLanguage]()
    activeLanguage = nextLanguage
    activeMessages = localeModule.default ?? localeModule
  } catch {
    if (nextLanguage !== DEFAULT_LANGUAGE) {
      await loadLanguageMessages(DEFAULT_LANGUAGE)
    }
  }
}

function formatMessage(templateText, formatArgs) {
  return templateText.replace(/\{(\d+)\}/g, (matchedToken, tokenIndex) => {
    const valueByIndex = formatArgs[Number(tokenIndex)]

    return valueByIndex === undefined ? matchedToken : String(valueByIndex)
  })
}

export function initializeLocalization() {
  if (isLocalizationInitialized) {
    return
  }

  isLocalizationInitialized = true

  const initialLanguage = resolveLanguage(useEditorStore.getState().language)
  activeLanguage = initialLanguage
  void loadLanguageMessages(initialLanguage)

  useEditorStore.subscribe((nextState, previousState) => {
    if (nextState.language === previousState.language) {
      return
    }

    const nextLanguage = resolveLanguage(nextState.language)

    if (nextLanguage === activeLanguage) {
      return
    }

    void loadLanguageMessages(nextLanguage)
  })
}

export function L(messageKey, ...formatArgs) {
  const messageTemplate = activeMessages[messageKey]

  if (typeof messageTemplate !== 'string') {
    return messageKey
  }

  return formatMessage(messageTemplate, formatArgs)
}
