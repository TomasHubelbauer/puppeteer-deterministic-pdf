# Puppeteer Deterministic PDF

This is how to generate a PDF using Puppeteer which is always the same as long as
the HTML used to generate it is the same:

```
await page.goto('https://news.ycombinator.com', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => [...document.images].every(i => i.complete));
const path = join(__dirname, 'news.ycombinator.com.pdf');
await page.pdf({ path });

// Wipe out date and time stamp ranges to make the PDFs deterministic
const buffer = await fs.readFile(path);
for (const offset of [97, 98, 99, 100, 132, 133, 134, 135]) {
  buffer[offset] = 0;
}

await fs.writeFile(path, buffer);
```

This zeroes the creation and last modified time stamps which are the only components
of a PDF printed from Puppeteer which are independent of the HTML content and the
Chromium version used by Puppeteer (that's probably in the PDF metadata, too).

I don't know if zeroed time stamps are valid PDF content, but the software I used to
test if the PDFs open did not have a problem with it, so I didn't look further.

Unfortunately, Puppeteer doesn't allow configuring the PDF metadata and an issue
where this was requested was closed: https://github.com/puppeteer/puppeteer/issues/3054
so this is probably the best one can do at the moment.

## Testing

There is a GitHub Actions workflow associated with this repository. It runs the
`index.js` script which uses Puppeteer to print `index.html` into `index.pdf`
and zeroes the date and time stamps.

The workflow runs on every push.

Pushing to a file which is not `index.html` should not result into a commit from
the workflow with changes in `index.pdf`. Such workflow should not push to the
repository at all.

Pushing to `index.html` should push updated `index.pdf` to the repository.

The PDF should remain deterministic even when renderer on different OSs because
no raster data are printed so text rendering differences across platforms should
not result in different vector data.
