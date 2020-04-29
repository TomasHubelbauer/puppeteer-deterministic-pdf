const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');

// Crash on error
process.on('uncaughtException', error => { throw error; });
process.on('unhandledRejection', error => { throw error; });

void async function () {
  const browser = await puppeteer.launch();
  const [page] = await browser.pages();
  const htmlPath = path.join(__dirname, 'index.html');
  await page.goto('file://' + htmlPath);
  const pdfPath = path.join(__dirname, 'index.pdf');
  const comparisonBuffer = await fs.readFile(pdfPath);
  await page.pdf({ path: pdfPath });
  await browser.close();

  // Wipe the date and time stamps to make the PDF deterministic
  const buffer = await fs.readFile(pdfPath);
  for (const offset of [97, 98, 99, 100, 132, 133, 134, 135]) {
    buffer[offset] = 0;
  }

  await fs.writeFile(pdfPath, buffer);

  const length = Math.max(buffer.byteLength, comparisonBuffer.byteLength);
  let differences = 0;
  for (let index = 0; index < length; index++) {
    // Limit to logging 10 differences at most to not overwhelm the log
    if (buffer[index] !== comparisonBuffer[index]) {
      if (differences < 10) {
        console.log(index, comparisonBuffer[index], buffer[index]);
      }

      differences++;
    }
  }

  if (differences > 10) {
    console.log('...and', differences - 10, 'other differences');
  }

  console.log(differences || 'No', 'differences', differences ? 'total' : '');
}()
