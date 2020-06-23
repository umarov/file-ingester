import { Worker, isMainThread, parentPort, workerData, MessageChannel } from 'worker_threads';
import * as parse from 'csv-parse';
import fetch from 'node-fetch'
import { Observable, Subject, of, empty } from 'rxjs';
import { bufferCount, mergeMap, throttle, takeUntil, bufferTime } from 'rxjs/operators'

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

export function parseCsv(csvFile: Buffer): Promise<string[]> {
  if (isMainThread) {
    const unsub$ = new Subject()
    return new Promise((resolve, reject) => {

      const observable = new Observable((subscriber) => {
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
        });
      })

      observable.pipe(
        takeUntil(unsub$),
        bufferTime(1000, null),
        bufferCount(10),
        mergeMap((records) => {
          return Promise.all(records.map(sendRequest))
        }),
        bufferCount(10),
        mergeMap(records => {
          return records.length > 0 ? of(records) : empty();
        })
      ).subscribe({
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
      },
      (err, records) => {
        if (err) {
          console.log(err);
          throw err;
        }

        records.map(record => {
          parentPort.postMessage(record)
        })
      }
    );
  } catch (err) {
    console.log(err);
  }
}
