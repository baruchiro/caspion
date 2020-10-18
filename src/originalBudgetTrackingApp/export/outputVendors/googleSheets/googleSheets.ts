import {
  EnrichedTransaction, ExportTransactionsFunction, OutputVendor, OutputVendorName
} from '@/originalBudgetTrackingApp/commonTypes';
import { EventNames, EventPublisher } from '@/originalBudgetTrackingApp/eventEmitters/EventEmitter';
import moment from 'moment/moment';
import * as googleSheets from './googleSheetsInternalAPI';

const GOOGLE_SHEETS_DATE_FORMAT = 'DD/MM/YYYY';

const createTransactionsInGoogleSheets: ExportTransactionsFunction = async (
  { transactionsToCreate: transactions, outputVendorsConfig },
  eventPublisher
) => {
  const { spreadsheetId, sheetName, credentialsFilePath } = outputVendorsConfig.googleSheets!.options;
  const hashesAlreadyExistingInGoogleSheets = await googleSheets.getExistingHashes({ spreadsheetId, sheetName, credentialsFilePath });
  const transactionsToCreate = transactions.filter((transaction) => !hashesAlreadyExistingInGoogleSheets.includes(transaction.hash));
  if (transactionsToCreate.length === 0) {
    await emitProgressEvent(eventPublisher, transactions, 'All transactions already exist in google sheets');
    return null;
  }
  await emitProgressEvent(eventPublisher, transactions, `Creating ${transactionsToCreate.length} transactions in google sheets`);

  const transactionsInSheetsFormat = transactionsToCreate.map((transaction) => [
    moment(transaction.date).format(GOOGLE_SHEETS_DATE_FORMAT),
    transaction.chargedAmount,
    transaction.description,
    transaction.memo,
    transaction.category,
    transaction.accountNumber,
    transaction.hash
  ]);

  const spreadsheetAppendResult = await googleSheets.appendToSpreadsheet({
    spreadsheetId,
    range: `${sheetName}!A:A`,
    values: transactionsInSheetsFormat,
    credentialsFilePath
  });
  return spreadsheetAppendResult.data;
};

async function emitProgressEvent(eventPublisher: EventPublisher, allTransactions: EnrichedTransaction[], message: string) {
  await eventPublisher.emit(EventNames.EXPORTER_PROGRESS, { name: googleSheetsOutputVendor.name, allTransactions, message });
}

export const googleSheetsOutputVendor: OutputVendor = {
  name: OutputVendorName.GOOGLE_SHEETS,
  exportTransactions: createTransactionsInGoogleSheets,
};
