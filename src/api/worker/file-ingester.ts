import { Worker, isMainThread, parentPort, workerData, MessageChannel } from 'worker_threads';
import * as parse from 'csv-parse';
import fetch from 'node-fetch'


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

export function parseCsv(csvFile: Buffer): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: csvFile.toString('utf8')
    });

    worker.on('message', (message) => {
      resolve(message);
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });

    const { port1, port2 } = new MessageChannel();
    worker.postMessage({ port: port1 }, [port1])

    port2.on('message', (record) => {
      fetch('http://localhost:3001', {
        method: 'post',
        body: JSON.stringify(record),
        headers: { 'Content-Type': 'application/json' },
      })
        .then(res => res.json())
        .then(json => console.log('main', json));
    })
  });
}

if (!isMainThread) {
  parentPort.once('message', ({ port }) => {
    const port2 = port
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
            port2.postMessage(record)
          })

          parentPort.postMessage(records);
        }
      );
    } catch (err) {
      console.log(err);
    }
  })

}
