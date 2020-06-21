import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as parse from 'csv-parse'

export function parseCsv(csvFile: Buffer): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: csvFile.toString('utf8')
    });

    worker.on('message', (message) => {
      resolve(message)
    });
    worker.on('error', reject);
    worker.on('exit', code => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
};


if (!isMainThread) {
  try {
    const csvFile = workerData;
    parse(csvFile, {
      delimiter: ',', quote: '"', escape: '"', skip_empty_lines: true, columns: true
    }, (err, records) => {
      if (err) {
        console.log(err);
        throw err
      }
      setTimeout(() => {
        parentPort.postMessage(records);

      }, 2000)
    });
  } catch (err) {
    console.error(err)
  }
}
