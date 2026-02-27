import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRootDirectory = path.resolve(scriptDirectory, '..');
const localeOutputDirectory = path.join(projectRootDirectory, 'src', 'locales');
const localeSheetUrlKey = 'LOCALE_SHEET_CSV_URL';

async function main() {
  try {
    const localeSheetUrl = await resolveLocaleSheetUrl();

    if (!localeSheetUrl) {
      printMissingUrlGuide();
      process.exitCode = 1;
      return;
    }

    const csvText = await fetchCsvText(localeSheetUrl);
    const parsedRows = parseCsv(csvText);

    if (parsedRows.length === 0) {
      throw new Error('CSV parsing failed: no rows found.');
    }

    const headerRow = parsedRows[0].map((columnValue) => columnValue.trim());
    if (headerRow.length < 2) {
      throw new Error('CSV parsing failed: header must include key and at least one language column.');
    }

    const keyColumnIndex = headerRow.findIndex((headerValue) => headerValue === 'key');
    if (keyColumnIndex === -1) {
      throw new Error('CSV parsing failed: header must include "key" column.');
    }

    const languageColumnMetadata = headerRow
      .map((headerValue, columnIndex) => ({ languageCode: headerValue, columnIndex }))
      .filter(({ columnIndex, languageCode }) => columnIndex !== keyColumnIndex && languageCode);

    if (languageColumnMetadata.length === 0) {
      throw new Error('CSV parsing failed: no language columns found in header.');
    }

    const localeRecordByLanguage = {};
    const missingKeyRecordByLanguage = {};
    const translatedCountByLanguage = {};

    for (const { languageCode } of languageColumnMetadata) {
      localeRecordByLanguage[languageCode] = {};
      missingKeyRecordByLanguage[languageCode] = [];
      translatedCountByLanguage[languageCode] = 0;
    }

    let totalKeyCount = 0;

    for (let rowIndex = 1; rowIndex < parsedRows.length; rowIndex += 1) {
      const rowValues = parsedRows[rowIndex];
      const translationKey = (rowValues[keyColumnIndex] ?? '').trim();

      if (!translationKey) {
        continue;
      }

      totalKeyCount += 1;

      for (const { languageCode, columnIndex } of languageColumnMetadata) {
        const rawValue = rowValues[columnIndex] ?? '';
        const trimmedValue = rawValue.trim();
        const hasTranslation = trimmedValue.length > 0;

        localeRecordByLanguage[languageCode][translationKey] = hasTranslation ? trimmedValue : translationKey;

        if (hasTranslation) {
          translatedCountByLanguage[languageCode] += 1;
        } else {
          missingKeyRecordByLanguage[languageCode].push(translationKey);
        }
      }
    }

    await mkdir(localeOutputDirectory, { recursive: true });

    for (const { languageCode } of languageColumnMetadata) {
      const localeJsonPath = path.join(localeOutputDirectory, `${languageCode}.json`);
      const localeJsonContent = `${JSON.stringify(localeRecordByLanguage[languageCode], null, 2)}\n`;
      await writeFile(localeJsonPath, localeJsonContent, 'utf8');
    }

    printReport({ totalKeyCount, languageColumnMetadata, translatedCountByLanguage, missingKeyRecordByLanguage });
  } catch (error) {
    console.error(`[locale:pull] ${error.message}`);
    process.exitCode = 1;
  }
}

async function resolveLocaleSheetUrl() {
  if (process.env[localeSheetUrlKey]) {
    return process.env[localeSheetUrlKey].trim();
  }

  const envLocalFilePath = path.join(projectRootDirectory, '.env.local');

  try {
    const envLocalContent = await readFile(envLocalFilePath, 'utf8');
    const envLocalRecord = parseEnvFile(envLocalContent);
    return (envLocalRecord[localeSheetUrlKey] ?? '').trim();
  } catch (error) {
    return '';
  }
}

function parseEnvFile(envContent) {
  const envRecord = {};
  const envLines = envContent.split(/\r?\n/);

  for (const envLine of envLines) {
    const trimmedLine = envLine.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const equalSignIndex = trimmedLine.indexOf('=');
    if (equalSignIndex === -1) {
      continue;
    }

    const rawEnvKey = trimmedLine.slice(0, equalSignIndex).trim();
    const rawEnvValue = trimmedLine.slice(equalSignIndex + 1).trim();
    if (!rawEnvKey) {
      continue;
    }

    envRecord[rawEnvKey] = normalizeEnvValue(rawEnvValue);
  }

  return envRecord;
}

function normalizeEnvValue(rawEnvValue) {
  if (
    (rawEnvValue.startsWith('"') && rawEnvValue.endsWith('"')) ||
    (rawEnvValue.startsWith("'") && rawEnvValue.endsWith("'"))
  ) {
    return rawEnvValue.slice(1, -1);
  }
  return rawEnvValue;
}

async function fetchCsvText(localeSheetUrl) {
  let response;

  try {
    response = await fetch(localeSheetUrl);
  } catch (error) {
    throw new Error(`fetch failed for LOCALE_SHEET_CSV_URL: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`fetch failed for LOCALE_SHEET_CSV_URL: ${response.status} ${response.statusText}`);
  }

  return response.text();
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
      const isRowNotCompletelyEmpty = currentRowValues.some((value) => value.length > 0);
      if (isRowNotCompletelyEmpty) {
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
  const hasLastRowContent = currentRowValues.some((value) => value.length > 0);
  if (hasLastRowContent) {
    parsedRows.push(currentRowValues);
  }

  return parsedRows;
}

function printMissingUrlGuide() {
  console.error(`[locale:pull] Missing ${localeSheetUrlKey}.`);
  console.error('[locale:pull] Usage:');
  console.error('  1) Publish Google Sheet to web as CSV.');
  console.error(`  2) Set ${localeSheetUrlKey} in .env.local or shell environment.`);
  console.error(`  3) Run: pnpm run locale:pull`);
}

function printReport({ totalKeyCount, languageColumnMetadata, translatedCountByLanguage, missingKeyRecordByLanguage }) {
  console.log(`[locale:pull] Total keys: ${totalKeyCount}`);

  for (const { languageCode } of languageColumnMetadata) {
    const translatedCount = translatedCountByLanguage[languageCode];
    const missingKeys = missingKeyRecordByLanguage[languageCode];
    const missingCount = missingKeys.length;

    console.log(`[locale:pull] ${languageCode}: ${translatedCount} translated / ${missingCount} missing`);

    if (missingCount > 0) {
      console.log(`[locale:pull] ${languageCode} missing keys:`);
      for (const missingKey of missingKeys) {
        console.log(`  - ${missingKey}`);
      }
    }
  }
}

main();
