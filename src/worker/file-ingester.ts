import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

export function parseCsv(csvFile) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: csvFile
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', code => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
};


if (!isMainThread) {
 import('csv-parse').then(({ default: parse }) => {
    const csvFile = workerData;
    const records = parse(csvFile, {
      columns: true,
      skip_empty_lines: true
    });
    parentPort.postMessage(records);
  });
}
