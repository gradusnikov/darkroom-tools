# Darkroom Tools

A collection of web-based tools for analog photography darkroom work.

## Tools Included

### 1. Exposure Time Calculator (exposure_adjustment.html)

This tool helps calculate exposure times when changing contrast filter grades in black and white printing. It automatically adjusts exposure time based on the filtering factors for different color filter settings.

**Features:**
- Supports Foma and Ilford paper filter settings
- Calculates exposure time adjustments when switching between contrast grades
- Handles Yellow and Magenta filter settings

**Usage:**
1. Select your paper type (Foma or Ilford)
2. Enter your current filter grade or manual Y/M settings
3. Enter your current exposure time
4. Select your desired filter grade or adjust Y/M settings manually
5. Click "Calculate Updated Time" to see the adjusted exposure time

### 2. F-stop Calculator (fstop_adjustment.html)

This tool creates an f-stop timing table for darkroom printing, helping you make precise exposure adjustments using the f-stop system.

**Features:**
- Configurable f-stop increment (1, 1/2, 1/3, 1/4, 1/6)
- Adjustable base exposure time
- Dry-down compensation option
- Generates a table with exposure values, times, and increments

**Usage:**
1. Select your preferred f-stop step size
2. Set dry-down compensation percentage if needed
3. Enter your base exposure time
4. View the generated exposure table showing times and increments

### 3. Opemus Height Adjustment Calculator (opemus_height_adjustment.html)

This tool calculates the required exposure time adjustment when changing the enlarger height on an Opemus enlarger.

**Features:**
- Based on the scaling charts for 50-55 mm lens taken from the Opemus 5 manual
- Uses cubic spline interpolation for accurate intermediate values
- Calculates the scale factor and adjusted exposure time

**Usage:**
1. Enter your initial enlarger height in cm
2. Enter your target enlarger height in cm
3. Enter your initial exposure time in seconds
4. Click "Calculate Target Exposure" to see the required exposure time

## How to Use

These are standalone HTML applications. Simply open the HTML files in any modern web browser - no server or installation required. You can also access them online at: https://gradusnikov.github.io/darkroom-tools/