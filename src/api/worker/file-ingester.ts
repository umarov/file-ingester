import { Worker, isMainThread, parentPort, workerData, MessageChannel } from 'worker_threads';
import * as parse from 'csv-parse';
import fetch from 'node-fetch'
import { Observable, Subject, of, from, interval } from 'rxjs';
import { bufferCount, mergeMap, throttle, takeUntil, bufferTime, delayWhen, flatMap, delay, windowCount, mergeAll, map } from 'rxjs/operators'

const headerMap = {
  ['Vendor Name']: 'vendor_name',
  ['Vendor ID']: 'vendor_id',
  ['Category ID']: 'category_id',
  ['Categories']: 'category_names',
  ['SKU']: 'sku',
  ['RTV Rights']: 'eligibility',
  ['Additional Policies']: 'additional_policy',
  ['Date Window']: 'max_days',
  ['Restricted Flags']: 'restricted_flags',
  ['Required Checks']: 'required_checks',
  ['Restricted Validations']: 'restricted_validations',
  ['Created At']: 'created_at',
  ['Updated At']: 'updated_at',
  ['Updated By']: 'updated_by'
}

const sendRequest = (record) => {
  return fetch('https://wide-boggy-cheek.glitch.me/yolo', {
    method: 'post',
    body: JSON.stringify(record),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(res => res.text())
    .then(json => console.log('main', json, new Date()))
    .catch(console.log);
}

interface CsvData {
  vendor_name: string
}

function createWorkerObservable(csvFile: Buffer) {
  return new Observable<CsvData[]>((subscriber) => {
    const worker = new Worker(__filename, {
      workerData: csvFile.toString('utf8')
    });

    worker.on('message', (record) => {
      subscriber.next(record)
    });

    worker.on('error', subscriber.error);
    worker.on('exit', (code) => {
      if (code !== 0)
        subscriber.error(new Error(`Worker stopped with exit code ${code}`));

      subscriber.complete()
    });
  })
}

function startProcessing(csvFile, resolve, reject) {
  const unsub$ = new Subject()
  const observable = createWorkerObservable(csvFile)
  observable.pipe(
    takeUntil(unsub$),
    bufferCount(10),
    delayWhen(() => interval(1000))
  ).subscribe({
    next: (records) => {
      console.log(records.length);
    },
    complete: () => {
      console.log('completed')
      unsub$.next()
      unsub$.complete()

      resolve()
    },
    error: (err) => {
      console.log(err)
      reject(err)
      unsub$.next()
      unsub$.complete()
    }
  })
}

export function parseCsv(csvFile: Buffer): Promise<string[]> {
  if (isMainThread) {
    return new Promise((resolve, reject) => {
      startProcessing(csvFile, resolve, reject)


    });
  }
}

if (!isMainThread) {
  try {
    const csvFile = workerData;
    parse(
      csvFile,
      {
        delimiter: ',',
        quote: '"',
        escape: '"',
        skip_empty_lines: true,
        columns: header => header.map(column => headerMap[column])
      }
    ).on('readable', function () {
      let record
      while (record = this.read()) {
        parentPort.postMessage(record)
      }
    }).on('error', (err) => {
      console.log(err);
      throw err;
    });
  } catch (err) {
    console.log(err);
  }
}
