# Darkroom Tools

A static progressive web app with seven calculators for analog photography. No build step or runtime dependencies. After the app shows **Available offline on this device**, all calculators work without a connection.

## Tools

1. **Exposure Time Calculator** — Estimated time correction for yellow/magenta filtration and cyan as an exposure-only ND adjustment. Published Foma and Ilford grade settings are restricted to the available Meochrom head data; unsupported settings produce an error. The historical exposure-factor tables remain explicitly marked as uncalibrated estimates.
2. **F-Stop Timer** — Timing tables in 1, 1/2, 1/3, 1/4, 1/6, 1/12 or 1/24-stop steps, with dry-down applied once. Clicking a time recenters the table without applying dry-down again. Increments describe cumulative test-strip exposures.
3. **Enlarger Exposure** — Magnification correction using the actual negative image width, including crops. Switching inches/centimetres converts existing dimensions. Keep the aperture and filtration unchanged.
4. **Print Placement** — Optical or geometric placement with optional image preview. Measurements retain precision through unit changes and saved settings. Offsets that move the print outside the mount are rejected.
5. **Opemus 5 Nomogram** — Approximate interpolation of the original manual charts for 50–55 mm and 75–80 mm lenses, with easel-height and aperture correction. Reference samples are visible in the app; no extrapolation beyond the supported scale range.
6. **Dilution Calculator** — Volume-based `concentrate + water` ratios, plus weights when concentrate density is known. Unknown densities stay blank. DD-X includes a specifically identified 2022 density reference; other formulations need a measured density. Powder developers refer to prepared stock solutions.
7. **Development Time** — Recipes retain their actual exposure index, temperature, source status, format and agitation where known. Editing a base time or temperature switches to Custom. Temperature compensation uses the Ilford chart by default, with an explicitly selected generic Q10 estimate as an alternative.

See [calculation assumptions, sources and calibration limits](docs/CALIBRATION.md).

## Usage

Open `index.html` directly, or visit [the hosted app](https://gradusnikov.github.io/darkroom-tools/).

For installation and offline testing, serve the directory over HTTPS or localhost:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000/`, wait for the offline-ready message, then use the browser's **Install App** or **Add to Home Screen** command. Fonts may fall back to local fonts offline. Browser storage can be cleared by the browser or user.

## Development and tests

- `js/math.js`: pure calculations and validation.
- `js/data.js`: reference tables, recipe metadata and provenance.
- `js/app.js`: controls, rendering, unit conversion and persistence.
- `sw.js`: versioned, precached app shell. **Bump its cache version whenever a runtime file changes.**

Run calculation and service-worker tests with Node 22 or later (no install required):

```sh
npm test
```

Run the browser suite:

```sh
npm ci
npx playwright install chromium
npm run test:browser
```

The browser suite starts its own localhost server and checks controls, invalid inputs, unit changes, saved settings, migration from older versions, mobile layouts and offline navigation. `CHROMIUM_PATH` can select an existing Chromium binary; `SCREENSHOT_DIR` optionally saves mobile screenshots.

GitHub Pages deployment runs the calculation/cache tests and publishes only runtime assets. Development tools and reference notes are excluded from the deployment artifact.

## License

[MIT](LICENSE). Linked manufacturer documents retain their respective owners' rights.
