import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import localeConfig from '../locales.config.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRootDirectory = path.resolve(scriptDirectory, '..');

async function main() {
  const selectedSheets = resolveSelectedSheets(process.argv.slice(2));

  if (selectedSheets === null) {
    printSheetList();
    return;
  }

  if (selectedSheets.length === 0) {
    console.warn('[locales] No valid sheets selected.');
    return;
  }

  const sheetReports = [];

  for (const selectedSheet of selectedSheets) {
    const resultBySheet = await pullSheet(selectedSheet);
    sheetReports.push(resultBySheet);
  }

  printSummary(sheetReports);

  const hasFailure = sheetReports.some((sheetReport) => sheetReport.status === 'failed');
  if (hasFailure) {
    process.exitCode = 1;
  }
}

function resolveSelectedSheets(commandArgs) {
  const availableSheets = Array.isArray(localeConfig.sheets) ? localeConfig.sheets : [];

  if (commandArgs.includes('--list')) {
    return null;
  }

  const candidateNames = commandArgs.filter((commandArg) => !commandArg.startsWith('--'));

  if (candidateNames.length === 0 || candidateNames.includes('all')) {
    return availableSheets;
  }

  const selectedSheets = [];

  for (const candidateName of candidateNames) {
    const matchedSheet = availableSheets.find((sheet) => sheet.name === candidateName);

    if (!matchedSheet) {
      console.warn(`[locales] Unknown sheet "${candidateName}". Skipped.`);
      continue;
    }

    if (!selectedSheets.some((sheet) => sheet.name === matchedSheet.name)) {
      selectedSheets.push(matchedSheet);
    }
  }

  return selectedSheets;
}

function printSheetList() {
  console.log('[locales] Registered sheets:');

  for (const configuredSheet of localeConfig.sheets) {
    console.log(`- ${configuredSheet.name} (gid: ${configuredSheet.gid})`);
  }
}

async function pullSheet(sheetConfig) {
  try {
    const csvUrl = createCsvUrl(sheetConfig.gid);
    const csvText = await fetchCsvText(csvUrl);
    const parsedRows = parseCsv(csvText);
    const parsedSheet = buildLocaleRows(parsedRows, localeConfig.languages);

    await writeLocaleFiles(sheetConfig.name, parsedSheet.localeByLanguage, localeConfig.outputDir);

    return {
      status: 'ok',
      sheetName: sheetConfig.name,
      totalKeyCount: parsedSheet.totalKeyCount,
      translatedCountByLanguage: parsedSheet.translatedCountByLanguage,
      missingKeysByLanguage: parsedSheet.missingKeysByLanguage,
    };
  } catch (error) {
    console.error(`[locales] ${sheetConfig.name} failed: ${error.message}`);
    return {
      status: 'failed',
      sheetName: sheetConfig.name,
      errorMessage: error.message,
    };
  }
}

function createCsvUrl(sheetGid) {
  return `https://docs.google.com/spreadsheets/d/${localeConfig.spreadsheetId}/export?format=csv&gid=${sheetGid}`;
}

async function fetchCsvText(csvUrl) {
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`fetch failed (${response.status} ${response.statusText})`);
  }

  return response.text();
}

function buildLocaleRows(parsedRows, languageList) {
  if (parsedRows.length === 0) {
    throw new Error('CSV parsing failed: no rows found.');
  }

  const headerRow = parsedRows[0].map((headerValue) => headerValue.trim());
  const keyColumnIndex = headerRow.findIndex((headerValue) => headerValue === 'key');

  if (keyColumnIndex === -1) {
    throw new Error('CSV parsing failed: header must include "key" column.');
  }

  const languageColumnByLanguage = {};

  for (const languageCode of languageList) {
    const languageColumnIndex = headerRow.findIndex((headerValue) => headerValue === languageCode);
    if (languageColumnIndex === -1) {
      throw new Error(`CSV parsing failed: header missing language column "${languageCode}".`);
    }
    languageColumnByLanguage[languageCode] = languageColumnIndex;
  }

  const localeByLanguage = {};
  const translatedCountByLanguage = {};
  const missingKeysByLanguage = {};

  for (const languageCode of languageList) {
    localeByLanguage[languageCode] = {};
    translatedCountByLanguage[languageCode] = 0;
    missingKeysByLanguage[languageCode] = [];
  }

  let totalKeyCount = 0;

  for (let rowIndex = 1; rowIndex < parsedRows.length; rowIndex += 1) {
    const rowValues = parsedRows[rowIndex];
    const messageKey = (rowValues[keyColumnIndex] ?? '').trim();

    if (!messageKey) {
      continue;
    }

    totalKeyCount += 1;

    for (const languageCode of languageList) {
      const languageColumnIndex = languageColumnByLanguage[languageCode];
      const translationText = (rowValues[languageColumnIndex] ?? '').trim();
      const hasTranslation = translationText.length > 0;

      localeByLanguage[languageCode][messageKey] = hasTranslation ? translationText : messageKey;

      if (hasTranslation) {
        translatedCountByLanguage[languageCode] += 1;
      } else {
        missingKeysByLanguage[languageCode].push(messageKey);
      }
    }
  }

  return {
    totalKeyCount,
    localeByLanguage,
    translatedCountByLanguage,
    missingKeysByLanguage,
  };
}

async function writeLocaleFiles(sheetName, localeByLanguage, outputDirectory) {
  const sheetOutputDirectory = path.join(projectRootDirectory, outputDirectory, sheetName);
  await mkdir(sheetOutputDirectory, { recursive: true });

  for (const languageCode of Object.keys(localeByLanguage)) {
    const filePath = path.join(sheetOutputDirectory, `${languageCode}.json`);
    const fileContent = `${JSON.stringify(localeByLanguage[languageCode], null, 2)}\n`;
    await writeFile(filePath, fileContent, 'utf8');
  }
}

function parseCsv(csvText) {
  const parsedRows = [];
  let currentRowValues = [];
  let currentColumnValue = '';
  let isInsideQuotedField = false;

  for (let characterIndex = 0; characterIndex < csvText.length; characterIndex += 1) {
    const currentCharacter = csvText[characterIndex];
    const nextCharacter = csvText[characterIndex + 1];

    if (isInsideQuotedField) {
      if (currentCharacter === '"' && nextCharacter === '"') {
        currentColumnValue += '"';
        characterIndex += 1;
      } else if (currentCharacter === '"') {
        isInsideQuotedField = false;
      } else {
        currentColumnValue += currentCharacter;
      }
      continue;
    }

    if (currentCharacter === '"') {
      isInsideQuotedField = true;
      continue;
    }

    if (currentCharacter === ',') {
      currentRowValues.push(currentColumnValue);
      currentColumnValue = '';
      continue;
    }

    if (currentCharacter === '\n' || currentCharacter === '\r') {
      if (currentCharacter === '\r' && nextCharacter === '\n') {
        characterIndex += 1;
      }

      currentRowValues.push(currentColumnValue);
      const isNotEmptyRow = currentRowValues.some((columnValue) => columnValue.length > 0);

      if (isNotEmptyRow) {
        parsedRows.push(currentRowValues);
      }

      currentRowValues = [];
      currentColumnValue = '';
      continue;
    }

    currentColumnValue += currentCharacter;
  }

  if (isInsideQuotedField) {
    throw new Error('CSV parsing failed: unmatched quote found.');
  }

  currentRowValues.push(currentColumnValue);
  const hasLastRowValue = currentRowValues.some((columnValue) => columnValue.length > 0);

  if (hasLastRowValue) {
    parsedRows.push(currentRowValues);
  }

  return parsedRows;
}

function printSummary(sheetReports) {
  console.log('[locales] Pull summary');

  for (const sheetReport of sheetReports) {
    if (sheetReport.status === 'failed') {
      console.log(`- ${sheetReport.sheetName}: failed (${sheetReport.errorMessage})`);
      continue;
    }

    console.log(`- ${sheetReport.sheetName}: ${sheetReport.totalKeyCount} keys`);

    for (const languageCode of localeConfig.languages) {
      const translatedCount = sheetReport.translatedCountByLanguage[languageCode] ?? 0;
      const missingKeys = sheetReport.missingKeysByLanguage[languageCode] ?? [];
      console.log(`  - ${languageCode}: ${translatedCount} translated / ${missingKeys.length} missing`);

      if (missingKeys.length > 0) {
        console.log(`    missing keys (${languageCode}):`);
        for (const missingKey of missingKeys) {
          console.log(`      - ${missingKey}`);
        }
      }
    }
  }
}

main();
