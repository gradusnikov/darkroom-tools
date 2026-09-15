// Reference data and provenance. See docs/CALIBRATION.md.
// filterFactors entries contain [yellow, magenta, cyan] exposure multipliers.
(function (root) {
    "use strict";
    const data = {
  "sources": {
    "ilfordContrast": "https://www.ilfordphoto.com/wp/wp-content/uploads/2017/03/Contrast-control-for-Ilford-Multigrade.pdf",
    "fomaContrast": "https://www.foma.cz/en/fomaspeed-variant",
    "ilfordTemperature": "https://www.ilfordphoto.com/wp/wp-content/uploads/2017/03/Temperature-compensation-chart.pdf",
    "ddxDensity": "https://www.ilfordphoto.com/wp/wp-content/uploads/2022/10/Ilfotec-DD-X-Film-Dev-J22.pdf",
    "opemus": "https://www.jollinger.com/photo/cam-coll/manuals/enlargers/misc/Opemus_5_manual.pdf",
    "hp5": "https://www.ilfordphoto.com/amfile/file/download/file/1903/product/693/",
    "fp4": "https://www.ilfordphoto.com/amfile/file/download/file/1919/product/688/"
  },
  "filterSettings": {
    "foma": {
      "0": {
        "Y": 60,
        "M": 0
      },
      "1": {
        "Y": 30,
        "M": 0
      },
      "2": {
        "Y": 0,
        "M": 10
      },
      "3": {
        "Y": 0,
        "M": 30
      },
      "4": {
        "Y": 0,
        "M": 100
      },
      "5": {
        "Y": 0,
        "M": 180
      }
    },
    "ilford": {
      "0": {
        "Y": 90,
        "M": 0
      },
      "1": {
        "Y": 55,
        "M": 0
      },
      "2": {
        "Y": 0,
        "M": 0
      },
      "3": {
        "Y": 0,
        "M": 40
      },
      "4": {
        "Y": 0,
        "M": 85
      },
      "00": {
        "Y": 150,
        "M": 0
      },
      "0.5": {
        "Y": 70,
        "M": 0
      },
      "1.5": {
        "Y": 30,
        "M": 0
      },
      "2.5": {
        "Y": 0,
        "M": 20
      },
      "3.5": {
        "Y": 0,
        "M": 65
      },
      "4.5": {
        "Y": 0,
        "M": 200
      }
    }
  },
  "filterFactors": {
    "meochrom1": {
      "0": [1, 1, 1],
      "10": [1.03, 1.1, 1.08],
      "20": [1.06, 1.2, 1.15],
      "30": [1.08, 1.26, 1.21],
      "40": [1.1, 1.33, 1.25],
      "50": [1.12, 1.39, 1.3],
      "60": [1.13, 1.45, 1.34],
      "70": [1.14, 1.5, 1.38],
      "80": [1.15, 1.55, 1.42],
      "90": [1.16, 1.6, 1.46],
      "100": [1.17, 1.66, 1.5],
      "110": [1.18, 1.71, 1.54],
      "120": [1.18, 1.77, 1.57],
      "130": [1.19, 1.82, 1.59],
      "140": [1.19, 1.88, 1.62],
      "150": [1.2, 1.93, 1.65]
    },
    "meochrom2": {
      "0": [1, 1, 1],
      "10": [1.05, 1.15, 1.09],
      "20": [1.1, 1.28, 1.17],
      "30": [1.14, 1.39, 1.24],
      "40": [1.17, 1.5, 1.3],
      "50": [1.2, 1.6, 1.36],
      "60": [1.22, 1.69, 1.41],
      "70": [1.24, 1.78, 1.46],
      "80": [1.25, 1.86, 1.51],
      "90": [1.26, 1.94, 1.56],
      "100": [1.27, 2.01, 1.6],
      "110": [1.28, 2.08, 1.64],
      "120": [1.29, 2.14, 1.68],
      "130": [1.29, 2.2, 1.72],
      "140": [1.3, 2.26, 1.75],
      "150": [1.3, 2.31, 1.78],
      "160": [1.31, 2.36, 1.81],
      "170": [1.31, 2.41, 1.84],
      "180": [1.32, 2.45, 1.86]
    }
  },
  "filterFactorStatus": "Legacy estimates; original measurement source and paper calibration unknown. Make a test strip at the final grade.",
  "chemicals": {
    "rodinal": {
      "name": "ADOX Rodinal",
      "density": 1.386,
      "presets": [
        "1+25",
        "1+50",
        "1+100"
      ],
      "densityNote": "ADOX Rodinal: June 2014 SDS, 1.386 g/ml at 20°C. Historical reference; confirm your formulation or enter a measured density. R09 variants may differ.",
      "source": "https://parallaxphotographic.coop/wp-content/uploads/2018/12/RODINAL-Adonal.pdf"
    },
    "fomadon_lqn": {
      "name": "Fomadon LQN",
      "density": 1.15,
      "presets": [
        "1+10",
        "1+20"
      ],
      "densityNote": "Fomadon LQN: February 2016 SDS, 1.15 g/ml at 20°C. Confirm your formulation or enter a measured density.",
      "source": "https://fomaobchod.cz/inshop/files/70002/Fomadon%20LQN-7.0.pdf"
    },
    "fomacitro": {
      "name": "Fomacitro",
      "density": 1.2,
      "presets": [
        "1+9",
        "1+19"
      ],
      "densityNote": "Fomacitro: January 2015 SDS range 1.19–1.21 g/ml; default uses the midpoint, 1.20 g/ml.",
      "source": "https://fotofilmfabriek.nl/wp-content/uploads/2020/07/Fomacitro-MSDS_EN.pdf"
    },
    "vinegar10": {
      "name": "Vinegar (10% acidity)",
      "density": 1.01,
      "presets": ["1+4", "1+9"],
      "densityNote": "10% vinegar: estimated density 1.01 g/ml at 20°C, based on a 10% aqueous acetic-acid reference (2009). 1+4 gives approximately 2% acidity; 1+9 gives approximately 1%. Use plain vinegar; enter a measured density if available.",
      "source": "https://resources.finalsite.net/images/v1722357205/mccsdnet/vu7mkmpovhsuon2yka4l/msdssheets_acetic_acid_10pct_3_10.pdf"
    },
    "fomafix": {
      "name": "Fomafix",
      "density": 1.3,
      "presets": [
        "1+5",
        "1+7",
        "1+10"
      ],
      "densityNote": "Fomafix liquid concentrate: November 2013 SDS range 1.29–1.31 g/ml; default uses the midpoint, 1.30 g/ml. Confirm your formulation.",
      "source": "https://www.freestylephoto.com/static/pdf/msds/foma/Fomafix.pdf"
    },
    "custom": {
      "name": "Custom",
      "density": null,
      "presets": [],
      "densityNote": "No confirmed density for this formulation. Enter a measured density to calculate concentrate weight.",
      "source": null
    }
  },
  "developerNames": {
    "rodinal": "Rodinal 1+25",
    "rodinal50": "Rodinal 1+50",
    "fomadon_lqn": "Fomadon LQN 1+10",
    "fomadon_lqn7": "Fomadon LQN 1+7",
    "fomadon_lqn14": "Fomadon LQN 1+14",
    "custom": "Custom"
  },
  "films": {
    "trix": {
      "name": "Kodak Tri-X 400",
      "iso": 400,
      "developers": {
        "rodinal": {
          "dilution": "1+25",
          "recipes": [
            {
              "ei": 200,
              "minutes": 7,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 400,
              "minutes": 7,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 1600,
              "minutes": 13,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 3200,
              "minutes": 17,
              "temperature": 20.5,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "rodinal50": {
          "dilution": "1+50",
          "recipes": [
            {
              "ei": 100,
              "minutes": 7.5,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 200,
              "minutes": 9,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 400,
              "minutes": 13,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 800,
              "minutes": 16.5,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 1600,
              "minutes": 18.5,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 3200,
              "minutes": 33,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "fomadon_lqn": {
          "dilution": "1+10",
          "recipes": [
            {
              "ei": 400,
              "minutes": 15,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        }
      }
    },
    "hp5": {
      "name": "Ilford HP5 Plus 400",
      "iso": 400,
      "developers": {
        "rodinal": {
          "dilution": "1+25",
          "recipes": [
            {
              "ei": 100,
              "minutes": 6,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 200,
              "minutes": 5,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 400,
              "minutes": 6,
              "temperature": 20,
              "format": "35 mm and 120 roll film",
              "agitation": "Intermittent: four inversions in the first 10 seconds, repeated at the start of each minute",
              "sourceLabel": "Ilford technical information, November 2018, page 3",
              "source": "https://www.ilfordphoto.com/amfile/file/download/file/1903/product/693/",
              "sourceStatus": "manufacturer",
              "reportedSource": "Ilford technical information, November 2018, page 3"
            },
            {
              "ei": 800,
              "minutes": 8,
              "temperature": 20,
              "format": "35 mm and 120 roll film",
              "agitation": "Intermittent: four inversions in the first 10 seconds, repeated at the start of each minute",
              "sourceLabel": "Ilford technical information, November 2018, page 3",
              "source": "https://www.ilfordphoto.com/amfile/file/download/file/1903/product/693/",
              "sourceStatus": "manufacturer",
              "reportedSource": "Ilford technical information, November 2018, page 3"
            },
            {
              "ei": 1600,
              "minutes": 12,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 3200,
              "minutes": 18,
              "temperature": 21,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "rodinal50": {
          "dilution": "1+50",
          "recipes": [
            {
              "ei": 100,
              "minutes": 9,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 400,
              "minutes": 11,
              "temperature": 20,
              "format": "35 mm and 120 roll film",
              "agitation": "Intermittent: four inversions in the first 10 seconds, repeated at the start of each minute",
              "sourceLabel": "Ilford technical information, November 2018, page 3",
              "source": "https://www.ilfordphoto.com/amfile/file/download/file/1903/product/693/",
              "sourceStatus": "manufacturer",
              "reportedSource": "Ilford technical information, November 2018, page 3"
            },
            {
              "ei": 800,
              "minutes": 16,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 1600,
              "minutes": 24,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "fomadon_lqn": {
          "dilution": "1+10",
          "recipes": [
            {
              "ei": 400,
              "minutes": 9.5,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Published starting point; source transcription not rechecked",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Foma foreign-films sheet, September 2016 (original app attribution)"
            }
          ]
        }
      }
    },
    "fp4": {
      "name": "Ilford FP4 Plus 125",
      "iso": 125,
      "developers": {
        "rodinal": {
          "dilution": "1+25",
          "recipes": [
            {
              "ei": 125,
              "minutes": 9,
              "temperature": 20,
              "format": "35 mm and 120 roll film",
              "agitation": "Intermittent: four inversions in the first 10 seconds, repeated at the start of each minute",
              "sourceLabel": "Ilford technical information, November 2018, page 3",
              "source": "https://www.ilfordphoto.com/amfile/file/download/file/1919/product/688/",
              "sourceStatus": "manufacturer",
              "reportedSource": "Ilford technical information, November 2018, page 3"
            },
            {
              "ei": 200,
              "minutes": 13,
              "temperature": 20,
              "format": "35 mm and 120 roll film",
              "agitation": "Intermittent: four inversions in the first 10 seconds, repeated at the start of each minute",
              "sourceLabel": "Ilford technical information, November 2018, page 3",
              "source": "https://www.ilfordphoto.com/amfile/file/download/file/1919/product/688/",
              "sourceStatus": "manufacturer",
              "reportedSource": "Ilford technical information, November 2018, page 3"
            },
            {
              "ei": 800,
              "minutes": 35,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "rodinal50": {
          "dilution": "1+50",
          "recipes": [
            {
              "ei": 100,
              "minutes": 12,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 125,
              "minutes": 15,
              "temperature": 20,
              "format": "35 mm and 120 roll film",
              "agitation": "Intermittent: four inversions in the first 10 seconds, repeated at the start of each minute",
              "sourceLabel": "Ilford technical information, November 2018, page 3",
              "source": "https://www.ilfordphoto.com/amfile/file/download/file/1919/product/688/",
              "sourceStatus": "manufacturer",
              "reportedSource": "Ilford technical information, November 2018, page 3"
            },
            {
              "ei": 200,
              "minutes": 20,
              "temperature": 20,
              "format": "35 mm and 120 roll film",
              "agitation": "Intermittent: four inversions in the first 10 seconds, repeated at the start of each minute",
              "sourceLabel": "Ilford technical information, November 2018, page 3",
              "source": "https://www.ilfordphoto.com/amfile/file/download/file/1919/product/688/",
              "sourceStatus": "manufacturer",
              "reportedSource": "Ilford technical information, November 2018, page 3"
            },
            {
              "ei": 250,
              "minutes": 26,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "fomadon_lqn": {
          "dilution": "1+10",
          "recipes": [
            {
              "ei": 125,
              "minutes": 9,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Published starting point; source transcription not rechecked",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Foma foreign-films sheet, September 2016 (original app attribution)"
            }
          ]
        },
        "fomadon_lqn14": {
          "dilution": "1+14",
          "recipes": [
            {
              "ei": 125,
              "minutes": 11,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Published starting point; source transcription not rechecked",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Unidentified third-party LQN sheet"
            }
          ]
        }
      }
    },
    "doublex": {
      "name": "Kodak Double-X 5222",
      "iso": 250,
      "developers": {
        "rodinal": {
          "dilution": "1+25",
          "recipes": [
            {
              "ei": 250,
              "minutes": 5.75,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 500,
              "minutes": 7.5,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 1000,
              "minutes": 9.25,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "rodinal50": {
          "dilution": "1+50",
          "recipes": [
            {
              "ei": 250,
              "minutes": 9,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 400,
              "minutes": 11,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 800,
              "minutes": 16,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "fomadon_lqn7": {
          "dilution": "1+7",
          "recipes": [
            {
              "ei": 400,
              "minutes": 17,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        }
      }
    },
    "retro400s": {
      "name": "Rollei Retro 400S",
      "iso": 400,
      "developers": {
        "rodinal": {
          "dilution": "1+25",
          "recipes": [
            {
              "ei": 400,
              "minutes": 10.5,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            },
            {
              "ei": 1600,
              "minutes": 20,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "rodinal50": {
          "dilution": "1+50",
          "recipes": [
            {
              "ei": 400,
              "minutes": 22,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        }
      }
    },
    "kentmere200": {
      "name": "Kentmere 200",
      "iso": 200,
      "developers": {
        "rodinal": {
          "dilution": "1+25",
          "recipes": [
            {
              "ei": 200,
              "minutes": 10,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        },
        "rodinal50": {
          "dilution": "1+50",
          "recipes": [
            {
              "ei": 200,
              "minutes": 11,
              "temperature": 20,
              "format": "Not recorded",
              "agitation": "Not recorded",
              "sourceLabel": "Community starting point; original conditions not confirmed",
              "source": null,
              "sourceStatus": "unverified",
              "reportedSource": "Massive Dev Chart (original app attribution; not rechecked)"
            }
          ]
        }
      }
    }
  },
  "temperatureChart": {
    "temperatures": [18, 19, 20, 21, 22, 24],
    "rows": [
      [5, 4.5, 4, 3.5, 3.25, 2.5],
      [5.5, 5, 4.5, 4, 3.75, 3],
      [6, 5.5, 5, 4.5, 4, 3.25],
      [6.5, 6, 5.5, 5, 4.5, 3.5],
      [7.25, 6.5, 6, 5.5, 5, 4],
      [8, 7.25, 6.5, 6, 5.25, 4.5],
      [8.75, 7.75, 7, 6.5, 5.75, 5],
      [9.25, 8.25, 7.5, 6.75, 6, 5.25],
      [9.75, 8.75, 8, 7.25, 6.5, 5.5],
      [10.5, 9.5, 8.5, 7.75, 7, 6],
      [11.25, 10, 9, 8, 7.25, 6.25],
      [11.75, 10.5, 9.5, 8.5, 7.75, 6.5],
      [12.5, 11.25, 10, 9, 8, 7],
      [13, 11.75, 10.5, 9.5, 8.5, 7.25],
      [13.75, 12.25, 11, 10, 9, 7.5],
      [14.25, 12.75, 11.5, 10.5, 9.25, 8],
      [14.75, 13.25, 12, 10.75, 9.75, 8.25],
      [15.25, 13.75, 12.5, 11.25, 10, 8.75],
      [16, 14.5, 13, 11.75, 10.5, 9],
      [16.75, 15, 13.5, 12, 11, 9.25],
      [17.25, 15.5, 14, 12.5, 11.25, 9.75],
      [17.75, 16, 14.5, 13, 11.75, 10],
      [18.5, 16.75, 15, 13.5, 12.25, 10.5],
      [19.25, 17.25, 15.5, 14, 12.75, 10.75],
      [19.75, 17.75, 16, 14.5, 13, 11],
      [20.5, 18.5, 16.5, 14.75, 13.5, 11.5],
      [21, 19, 17, 15.25, 13.75, 11.75],
      [21.75, 19.5, 17.5, 15.75, 14.25, 12],
      [22.25, 20, 18, 16.25, 14.5, 12.5],
      [22.75, 20.5, 18.5, 16.75, 15, 12.75],
      [23.5, 21, 19, 17.25, 15.5, 13.25],
      [24.25, 21.75, 19.5, 17.5, 16, 13.5],
      [24.75, 22.25, 20, 18, 16.25, 13.75],
      [25.25, 22.75, 20.5, 18.5, 16.75, 14.25],
      [26, 23.5, 21, 19, 17, 14.5],
      [26.5, 23.75, 21.5, 19.5, 17.5, 15],
      [27.25, 24.5, 22, 19.75, 17.75, 15.25],
      [27.75, 25, 22.5, 20.25, 18.25, 15.5],
      [28.25, 25.5, 23, 20.75, 18.75, 16],
      [28.75, 26, 23.5, 21, 19, 16.25],
      [29.75, 26.75, 24, 21.75, 19.5, 16.75],
      [30.25, 27.25, 24.5, 22, 19.75, 17],
      [30.75, 27.75, 25, 22.5, 20.25, 17.25]
    ],
    "source": "https://www.ilfordphoto.com/wp/wp-content/uploads/2017/03/Temperature-compensation-chart.pdf"
  },
  "nomograms": {
    "50": {
      "sMin": 1,
      "sMax": 50,
      "kMin": 0.02,
      "kMax": 35,
      "label": "f = 50–55 mm",
      "curves": [1, 2, 4, 6, 8, 10, 20, 30, 40, 50],
      "samples": [
        [1, 35],
        [2, 22],
        [3, 17],
        [4, 14.5],
        [6, 11],
        [8, 9],
        [10, 7.5],
        [13, 6],
        [15, 5],
        [20, 3.75],
        [25, 2.95],
        [30, 2.35],
        [35, 1.85],
        [40, 1.5],
        [45, 1.22],
        [50, 1]
      ],
      "source": "https://www.jollinger.com/photo/cam-coll/manuals/enlargers/misc/Opemus_5_manual.pdf",
      "sourceStatus": "approximate-chart-readings",
      "interpolation": "Linear in log correction factor between sampled scale positions"
    },
    "80": {
      "sMin": 12,
      "sMax": 50,
      "kMin": 0.08,
      "kMax": 15,
      "label": "f = 75–80 mm",
      "curves": [13, 16, 18, 20, 22, 25, 30, 35, 40, 45, 50],
      "samples": [
        [12, 12],
        [13, 10],
        [14, 8.4],
        [15, 7.3],
        [16, 6.5],
        [18, 5.35],
        [19, 4.9],
        [20, 4.55],
        [22, 3.9],
        [25, 3.15],
        [30, 2.4],
        [35, 1.87],
        [40, 1.49],
        [45, 1.22],
        [50, 1]
      ],
      "source": "https://www.jollinger.com/photo/cam-coll/manuals/enlargers/misc/Opemus_5_manual.pdf",
      "sourceStatus": "approximate-chart-readings",
      "interpolation": "Linear in log correction factor between sampled scale positions"
    }
  }
};
    if (typeof module === "object" && module.exports) module.exports = data;
    else root.DarkroomData = data;
})(globalThis);
