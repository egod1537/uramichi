import useEditorStore from '../stores/useEditorStore'

const localeModules = import.meta.glob('../locales/*/*.json')
const DEFAULT_LANGUAGE = 'ko'

let activeLanguage = DEFAULT_LANGUAGE
let activeMessages = {}
let isLocalizationInitialized = false

function extractLocaleMetadata(modulePath) {
  const matchedPath = modulePath.match(/^\.\.\/locales\/([^/]+)\/([^/]+)\.json$/)

  if (!matchedPath) {
    return null
  }

  return {
    categoryName: matchedPath[1],
    languageCode: matchedPath[2],
  }
}

function resolveLanguage(languageValue) {
  const hasLanguageInModules = Object.keys(localeModules).some((modulePath) => {
    const localeMetadata = extractLocaleMetadata(modulePath)
    return localeMetadata?.languageCode === languageValue
  })

  if (hasLanguageInModules) {
    return languageValue
  }

  return DEFAULT_LANGUAGE
}

async function loadLanguageMessages(languageValue) {
  const nextLanguage = resolveLanguage(languageValue)
  const mergedMessages = {}
  const loaderEntries = Object.entries(localeModules)

  for (const [modulePath, loadModule] of loaderEntries) {
    const localeMetadata = extractLocaleMetadata(modulePath)

    if (!localeMetadata || localeMetadata.languageCode !== nextLanguage) {
      continue
    }

    const localeModule = await loadModule()
    const localeMessages = localeModule.default ?? localeModule

    for (const [messageKey, messageValue] of Object.entries(localeMessages)) {
      mergedMessages[`${localeMetadata.categoryName}.${messageKey}`] = messageValue
    }
  }

  activeLanguage = nextLanguage
  activeMessages = mergedMessages
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
