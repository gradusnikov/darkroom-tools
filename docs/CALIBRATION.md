# Calculation assumptions and reference data

The calculators distinguish algebraic conversions, manufacturer reference data and empirical estimates. Extra displayed digits are not a claim of physical calibration accuracy.

## Exposure and filters

The exposure-factor ratio is `t₂ = t₁ × (Y₂/Y₁) × (M₂/M₁) × (C₂/C₁)`, where Y, M and C are interpolated exposure multipliers, not dial numbers. This assumes separable filter attenuation. It is an estimate for variable-contrast paper: changing spectral response and contrast cannot preserve every print tone with a single time adjustment.

Cyan uses the third column of the inherited factor tables as an ND-style, exposure-only correction. Cyan changes do not alter the selected contrast grade, and choosing a grade preserves cyan. This is a model assumption requiring a test strip for your setup. Existing saved settings without cyan default to zero.

Grade settings come from:

- [Foma Fomaspeed Variant](https://www.foma.cz/en/fomaspeed-variant): Meopta whole grades 0–5. Unsupported intermediate grades from the earlier app were removed.
- [Ilford contrast control](https://www.ilfordphoto.com/wp/wp-content/uploads/2017/03/Contrast-control-for-Ilford-Multigrade.pdf): the Meopta column of the single-filter table, grades 00–4½, including half grades. The table specifies 200M for 4½ and does not specify a grade-5 setting. This table supplies contrast-grade dial settings; it supplies neither exposure multipliers nor cyan ND calibration.

The **exposure-factor tables** were inherited without an identifiable measurement source, paper type or test conditions. They are retained as explicitly labelled estimates, not attributed to either manufacturer. Supported data ranges are 0–150 for Meochrom 1 and 0–180 for Meochrom 2. These are limits of the stored data, not a certification of every physical head's dial range. No clamping or extrapolation is performed. Grade settings beyond a head's data range are disabled.

To calibrate, determine exposure multipliers for your own head, paper, developer and chosen reference tone with test strips. Do not substitute photographic-paper grade numbers for filter transmission.

## F-stop timing and dry-down

`t = base × 2^stops × (1 − dryDownFraction)`.

The selected dry-down percentage means a percentage reduction in exposure time, not a percentage increase in density. It must be established for the paper/process. Clicking a corrected table time divides out the dry-down factor before setting the new base. Increments are differences between successive cumulative exposures; the first increment is the first exposure itself. Rounding happens at display time.

## Enlargement

`t₂/t₁ = ((m₂+1)/(m₁+1))²`, with `m = print image width / corresponding negative image width`.

This is the fixed-aperture thin-lens approximation. The same negative area, lens, paper and filtration must be used. Width is an image dimension, not the paper sheet dimension. The nominal presets are 36 mm for the long dimension of 35 mm film and 56 mm for 6×6; measure the actual opening or crop when needed. Aperture changes and reciprocity effects are not included in this tool.

## Print placement

Horizontal borders are `(mountWidth − printWidth)/2`. Geometric top and bottom borders are equal. Optical top border is `(1 + printWidth/mountWidth) × (mountHeight − printHeight)/4`; this is a bottom-weighting convention, not a perceptual law. Positive offset moves the print upwards. Final borders must remain nonnegative.

Dimensions are kept in millimetres without integer rounding, including through unit conversions and saved settings. Only result labels are rounded.

## Opemus 5

Source: [Meopta Opemus 5 manual](https://www.jollinger.com/photo/cam-coll/manuals/enlargers/misc/Opemus_5_manual.pdf), printed pages 12–15, figures X and XI.

The earlier `((r+s₂)/(r+s₁))²` approximation matched individual examples but substantially underestimated the low-position 50 mm chart. It is replaced with approximate visual readings of the curve for final scale position 50. `C(s)` is the chart correction from starting position s to 50; any pair is calculated as `k = C(s₁)/C(s₂)`. Log-linear interpolation between reference samples preserves positivity, monotonicity, identity, reverse conversion and chained corrections. The rendered graph plots final position on the horizontal axis and fixed starting positions as curves; the original manual uses the opposite arrangement.

The samples in `js/data.js` are rounded visual transcriptions, **not high-precision digitization or measurements on an enlarger**. Allow for chart-reading uncertainty and confirm with a test strip. Tests compare the worked examples within approximately 3–4% and check additional chart points across the range. They do not establish a measured error bound everywhere between points.

| Manual example | Reference | App |
| --- | --- | --- |
| 75–80 mm, scale 19 → 45 | k ≈ 4 | k ≈ 4.016 |
| 75–80 mm, scale 22 → 18, 2 cm easel | k ≈ 0.7 | k = 0.7 |
| 50–55 mm, scale 8 → 13, column already compensated | k ≈ 1.5 | k = 1.5 |
| 50–55 mm, scale 1 → 50 | k ≈ 35 | k = 35 |

Per the manual, subtract easel thickness in centimetres from both scale readings, unless the column has already been raised to compensate. Corrected readings must remain in 1–50 (50–55 mm) or 12–50 (75–80 mm). No extrapolation is permitted. Final exposure also includes `(targetFNumber/testFNumber)²`. Old saved r parameters are intentionally discarded because they belong to the removed approximation.

## Dilution and densities

For the volume ratio `a+b`, concentrate volume is `total × a/(a+b)` and water is the remainder. `1+50` means 51 total parts. A stock solution is `1+0`.

Concentrate mass is `volume × density`. The dilution list contains Rodinal, Fomadon LQN, Fomacitro, 10% vinegar, Fomafix and Custom.

| Chemical | Default density (g/ml) | Reference and scope |
| --- | --- | --- |
| ADOX Rodinal | 1.386 | [ADOX June 2014 SDS, section 9](https://parallaxphotographic.coop/wp-content/uploads/2018/12/RODINAL-Adonal.pdf), at 20°C. Historical formulation reference; not a universal R09-family density. The [June 2024 SDS](https://www.fotoimpex.com/shop/images/products/media/56415_4_MSDS_EN.pdf) does not supply a density. |
| Fomadon LQN | 1.15 | [FOMA February 2016 SDS v7.0, section 9](https://fomaobchod.cz/inshop/files/70002/Fomadon%20LQN-7.0.pdf), at 20°C. |
| Fomacitro | 1.20 | Midpoint of 1.19–1.21 g/ml in [FOMA January 2015 SDS v5.1, section 9](https://fotofilmfabriek.nl/wp-content/uploads/2020/07/Fomacitro-MSDS_EN.pdf). |
| Vinegar, 10% acidity | 1.01 | Estimate using the 10% aqueous acetic-acid density at 20°C in [Scholar Chemistry / Columbus Chemical Industries January 2009 MSDS, section 9](https://resources.finalsite.net/images/v1722357205/mccsdnet/vu7mkmpovhsuon2yka4l/msdssheets_acetic_acid_10pct_3_10.pdf). This is a proxy for plain vinegar, not a measurement of a particular food product. |
| Fomafix liquid concentrate | 1.30 | Midpoint of 1.29–1.31 g/ml in [FOMA November 2013 SDS v5, section 9](https://www.freestylephoto.com/static/pdf/msds/foma/Fomafix.pdf). Check the formulation; this does not describe Fomafix P powder. |
| Custom | None | Enter a measured density to enable weights. |

All defaults are editable. Reference dates and assumptions appear in the calculator. Vinegar presets use 10% starting acidity: 1+4 gives approximately 2%, and 1+9 approximately 1%, assuming additive volumes and comparable concentration conventions. The initial 2% target is consistent with [Foma's Fomapan 100 processing sheet](https://www.foma.cz/en/fomapan-100); use the concentration appropriate to your process.

Water mass uses approximately 0.9982 g/ml at 20°C. Volume additivity is an approximation; for an exact final volume, measure the concentrate and top up to a volumetric mark.

Density overrides are saved separately for every chemical in browser storage, including an explicitly cleared field. Switching chemicals and reloading preserves them. “Use default density” removes only the selected chemical's override. Invalid density edits do not replace its last valid setting. A valid density edit is retained even while another calculator field is invalid.

Old saved nonempty user densities migrate into the per-chemical overrides. Recognizable original factory guesses are replaced with sourced defaults; formerly blank fields adopt the new defaults. Removed developer selections reset to Rodinal without transferring their density or dilution. Storage version 3 distinguishes new intentional blanks from missing overrides.

## Development recipes

Records store actual EI, time in minutes, reference temperature, film format, agitation and source status. The stop difference from box speed is `log₂(EI/ISO)`. EI 250 on FP4 125 is +1 stop; EI 200 is approximately +0.68, not +1. Double-X EI 400 and 800 likewise must not be represented as exact +1 and +2 stops from EI 250.

The Rodinal recipes for HP5 at EI 400/800 (1+25) and EI 400 (1+50), and FP4 at EI 125/200 (1+25 and 1+50), match Ilford's November 2018 technical information, page 3. The source specifies 35 mm/roll film and intermittent agitation; the app includes that information and source links:

- [HP5 Plus](https://www.ilfordphoto.com/amfile/file/download/file/1903/product/693/)
- [FP4 Plus](https://www.ilfordphoto.com/amfile/file/download/file/1919/product/688/)

Other historical records remain **unverified starting points**. Their original source attribution is retained where known; missing format/agitation is explicitly marked, not inferred. Tri-X/Rodinal EI 3200 retains its recorded 20.5°C temperature, and HP5/Rodinal EI 3200 retains 21°C. These records are not presented as manufacturer-verified recipes. More source documents are needed before promoting them to sourced presets.

Recipe mode uses a specific recipe's actual time and temperature. Editing either switches to Custom, where the entered values are used. Custom push/pull is `base × (1 + percentage/100)^stops`; 33% is a configurable generic starting assumption, not a universal film-development law. Zero percent is valid. Changing film/developer selects a real available recipe; if only an off-box-speed recipe exists, its EI is shown rather than inventing a box-speed time.

Old recipe-mode saves reset to a real recipe because the earlier integer stop keys and reference-temperature overrides were ambiguous. Existing custom calculations are retained. New saves retain the exact recipe EI or explicit custom state.

## Temperature compensation

Default: [Ilford April 2002 time/temperature chart](https://www.ilfordphoto.com/wp/wp-content/uploads/2017/03/Temperature-compensation-chart.pdf). The app uses the complete, strictly increasing columns at 18, 19, 20, 21, 22 and 24°C and all 43 rows (4–25 minutes at 20°C). Temperatures are interpolated in log time; times are interpolated linearly between rows. This supports reversible conversions from reference temperatures other than 20°C. Outside-table times are rejected when a correction is requested. At an unchanged temperature, no lookup is necessary.

Examples: 8:00 at 20°C becomes 5:30 at 24°C; 10:00 becomes 7:00. The printed times themselves are rounded to 15 seconds. Intermediate app results are estimates, not new manufacturer recipes.

Optional: generic `Q10 = 2`, `t₂ = t₁ × 2^((T₁−T₂)/10)`, restricted by the app to 10–30°C and explicitly labelled an estimate. The app does not silently fall back to it. Ilford advises against development below five minutes because of unevenness; the result notes this when applicable.
