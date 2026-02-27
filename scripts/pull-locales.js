import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import localizationConfig from '../locales.config.js'

const scriptDirectoryPath = path.dirname(fileURLToPath(import.meta.url))
const projectRootPath = path.resolve(scriptDirectoryPath, '..')

async function main() {
  const normalizedConfig = normalizeConfig(localizationConfig)
  const cliArguments = process.argv.slice(2)

  if (cliArguments.includes('--list')) {
    printSheetList(normalizedConfig.sheets)
    return
  }

  const selectedSheets = resolveSelectedSheets(normalizedConfig.sheets, cliArguments)

  if (selectedSheets.length === 0) {
    console.log('[locales] No sheets selected.')
    return
  }

  const sheetReports = []

  for (const sheetConfig of selectedSheets) {
    const sheetReport = await processSheet(normalizedConfig, sheetConfig)
    sheetReports.push(sheetReport)
  }

  printFinalReport(sheetReports)

}

function normalizeConfig(rawConfig) {
  if (!rawConfig || typeof rawConfig !== 'object') {
    throw new Error('locales.config.js is invalid: config object is required.')
  }

  const spreadsheetId = String(rawConfig.spreadsheetId ?? '').trim()
  if (!spreadsheetId) {
    throw new Error('locales.config.js is invalid: spreadsheetId is required.')
  }

  const rawSheets = Array.isArray(rawConfig.sheets) ? rawConfig.sheets : []
  if (rawSheets.length === 0) {
    throw new Error('locales.config.js is invalid: sheets must include at least one item.')
  }

  const sheets = rawSheets.map((sheetConfig, sheetIndex) => {
    const name = String(sheetConfig?.name ?? '').trim()
    const gid = String(sheetConfig?.gid ?? '').trim()

    if (!name) {
      throw new Error(`locales.config.js is invalid: sheets[${sheetIndex}].name is required.`)
    }

    if (!gid) {
      throw new Error(`locales.config.js is invalid: sheets[${sheetIndex}].gid is required.`)
    }

    return { name, gid }
  })

  const languages = Array.isArray(rawConfig.languages)
    ? rawConfig.languages.map((languageCode) => String(languageCode).trim()).filter(Boolean)
    : []

  if (languages.length === 0) {
    throw new Error('locales.config.js is invalid: languages must include at least one language code.')
  }

  const defaultLanguage = String(rawConfig.defaultLanguage ?? '').trim()
  if (!defaultLanguage) {
    throw new Error('locales.config.js is invalid: defaultLanguage is required.')
  }

  const outputDirectory = String(rawConfig.outputDir ?? '').trim()
  if (!outputDirectory) {
    throw new Error('locales.config.js is invalid: outputDir is required.')
  }

  return {
    spreadsheetId,
    sheets,
    languages,
    defaultLanguage,
    outputDirectory,
    absoluteOutputDirectory: path.resolve(projectRootPath, outputDirectory),
  }
}

function printSheetList(sheetList) {
  console.log('[locales] Registered sheets:')
  for (const sheetConfig of sheetList) {
    console.log(`- ${sheetConfig.name} (gid=${sheetConfig.gid})`)
  }
}

function resolveSelectedSheets(sheetList, cliArguments) {
  const normalizedArguments = cliArguments.filter((argumentValue) => argumentValue !== 'all')

  if (normalizedArguments.length === 0) {
    return sheetList
  }

  const requestedNameSet = new Set(normalizedArguments)
  const selectedSheetList = []

  for (const sheetConfig of sheetList) {
    if (requestedNameSet.has(sheetConfig.name)) {
      selectedSheetList.push(sheetConfig)
      requestedNameSet.delete(sheetConfig.name)
    }
  }

  for (const missingSheetName of requestedNameSet) {
    console.warn(`[locales] Unknown sheet name skipped: ${missingSheetName}`)
  }

  return selectedSheetList
}

async function processSheet(config, sheetConfig) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv&gid=${sheetConfig.gid}`

  let parsedRows
  try {
    const csvText = await fetchCsvText(csvUrl)
    parsedRows = parseCsv(csvText)
  } catch (error) {
    console.error(`[locales] ${sheetConfig.name}: ${error.message}`)
    return {
      sheetName: sheetConfig.name,
      status: 'error',
      errorMessage: error.message,
    }
  }

  try {
    const sheetData = buildSheetLocaleData(parsedRows, config.languages)
    await writeSheetLocaleFiles(config.absoluteOutputDirectory, sheetConfig.name, sheetData.localeRecordByLanguage)

    return {
      sheetName: sheetConfig.name,
      status: 'ok',
      totalKeyCount: sheetData.totalKeyCount,
      languageReports: sheetData.languageReports,
    }
  } catch (error) {
    console.error(`[locales] ${sheetConfig.name}: ${error.message}`)
    return {
      sheetName: sheetConfig.name,
      status: 'error',
      errorMessage: error.message,
    }
  }
}

async function fetchCsvText(csvUrl) {
  let response

  try {
    response = await fetch(csvUrl)
  } catch (error) {
    throw new Error(`fetch failed: ${error.message}`)
  }

  if (!response.ok) {
    throw new Error(`fetch failed: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

function parseCsv(csvText) {
  const parsedRows = []
  let currentRowValues = []
  let currentColumnValue = ''
  let isInsideQuotedField = false

  for (let characterIndex = 0; characterIndex < csvText.length; characterIndex += 1) {
    const currentCharacter = csvText[characterIndex]
    const nextCharacter = csvText[characterIndex + 1]

    if (isInsideQuotedField) {
      if (currentCharacter === '"' && nextCharacter === '"') {
        currentColumnValue += '"'
        characterIndex += 1
      } else if (currentCharacter === '"') {
        isInsideQuotedField = false
      } else {
        currentColumnValue += currentCharacter
      }
      continue
    }

    if (currentCharacter === '"') {
      isInsideQuotedField = true
      continue
    }

    if (currentCharacter === ',') {
      currentRowValues.push(currentColumnValue)
      currentColumnValue = ''
      continue
    }

    if (currentCharacter === '\n' || currentCharacter === '\r') {
      if (currentCharacter === '\r' && nextCharacter === '\n') {
        characterIndex += 1
      }

      currentRowValues.push(currentColumnValue)
      const isRowNotCompletelyEmpty = currentRowValues.some((value) => value.length > 0)
      if (isRowNotCompletelyEmpty) {
        parsedRows.push(currentRowValues)
      }

      currentRowValues = []
      currentColumnValue = ''
      continue
    }

    currentColumnValue += currentCharacter
  }

  if (isInsideQuotedField) {
    throw new Error('CSV parsing failed: unmatched quote found.')
  }

  currentRowValues.push(currentColumnValue)
  const hasLastRowContent = currentRowValues.some((value) => value.length > 0)
  if (hasLastRowContent) {
    parsedRows.push(currentRowValues)
  }

  return parsedRows
}

function buildSheetLocaleData(parsedRows, supportedLanguages) {
  if (!Array.isArray(parsedRows) || parsedRows.length === 0) {
    throw new Error('CSV parsing failed: no rows found.')
  }

  const headerRow = parsedRows[0].map((columnValue) => columnValue.trim())
  const keyColumnIndex = headerRow.findIndex((headerValue) => headerValue === 'key')

  if (keyColumnIndex === -1) {
    throw new Error('CSV parsing failed: header must include "key" column.')
  }

  const languageColumnIndexByCode = {}

  for (const languageCode of supportedLanguages) {
    const columnIndex = headerRow.findIndex((headerValue) => headerValue === languageCode)
    if (columnIndex === -1) {
      throw new Error(`CSV parsing failed: "${languageCode}" column is missing.`)
    }

    languageColumnIndexByCode[languageCode] = columnIndex
  }

  const localeRecordByLanguage = {}
  const languageReports = {}

  for (const languageCode of supportedLanguages) {
    localeRecordByLanguage[languageCode] = {}
    languageReports[languageCode] = {
      translatedCount: 0,
      missingCount: 0,
      missingKeys: [],
    }
  }

  let totalKeyCount = 0

  for (let rowIndex = 1; rowIndex < parsedRows.length; rowIndex += 1) {
    const rowValues = parsedRows[rowIndex]
    const translationKey = String(rowValues[keyColumnIndex] ?? '').trim()

    if (!translationKey) {
      continue
    }

    totalKeyCount += 1

    for (const languageCode of supportedLanguages) {
      const columnIndex = languageColumnIndexByCode[languageCode]
      const rawTranslationValue = String(rowValues[columnIndex] ?? '')
      const translationValue = rawTranslationValue.trim()
      const hasTranslation = translationValue.length > 0

      localeRecordByLanguage[languageCode][translationKey] = hasTranslation ? translationValue : translationKey

      if (hasTranslation) {
        languageReports[languageCode].translatedCount += 1
      } else {
        languageReports[languageCode].missingCount += 1
        languageReports[languageCode].missingKeys.push(translationKey)
      }
    }
  }

  return {
    totalKeyCount,
    localeRecordByLanguage,
    languageReports,
  }
}

async function writeSheetLocaleFiles(outputRootPath, sheetName, localeRecordByLanguage) {
  const sheetDirectoryPath = path.join(outputRootPath, sheetName)
  await mkdir(sheetDirectoryPath, { recursive: true })

  const writeTasks = Object.entries(localeRecordByLanguage).map(([languageCode, localeRecord]) => {
    const languageFilePath = path.join(sheetDirectoryPath, `${languageCode}.json`)
    const jsonText = `${JSON.stringify(localeRecord, null, 2)}\n`
    return writeFile(languageFilePath, jsonText, 'utf8')
  })

  await Promise.all(writeTasks)
}

function printFinalReport(sheetReports) {
  for (const sheetReport of sheetReports) {
    if (sheetReport.status === 'error') {
      console.log(`[locales] ${sheetReport.sheetName}: skipped (${sheetReport.errorMessage})`)
      continue
    }

    console.log(`[locales] ${sheetReport.sheetName}: ${sheetReport.totalKeyCount} keys`)

    for (const [languageCode, languageReport] of Object.entries(sheetReport.languageReports)) {
      console.log(
        `[locales] ${sheetReport.sheetName}/${languageCode}: ${languageReport.translatedCount} translated / ${languageReport.missingCount} missing`,
      )

      if (languageReport.missingKeys.length > 0) {
        console.log(`[locales] ${sheetReport.sheetName}/${languageCode} missing keys:`)
        for (const missingKey of languageReport.missingKeys) {
          console.log(`  - ${missingKey}`)
        }
      }
    }
  }
}

main().catch((error) => {
  console.error(`[locales] ${error.message}`)
  process.exitCode = 1
})
