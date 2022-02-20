# Smogon Scraping Tools
---------
This is a tool used for scraping Smogon Usage Statistics.
You will find:
1. `scrape_usage.js` -- the script itself, which scrapes from https://www.smogon.com/stats/.

###### Prerequisite Packages
Please install prerequisites with `npm install` before attempting to run this program.

## Usage 
* `usage: scrape_usage.js [-h] -d DATE -g GEN -t TIER [-c CUTLINE]`
* **Output**:
```
optional arguments:
  -h, --help            show this help message and exit
  -d DATE, --date DATE  Data in YYYY-MM format, example: 2022-01. Required.
  -g GEN, --gen GEN     Pokemon generation number, example: 6. Required.
  -t TIER, --tier TIER  Tier name, example: OU, National Dex. Required.
  -c CUTLINE, --cutline CUTLINE
                        Usage stats cutline. Must be: 0, 1500, 1630, 1760. Default: 0.
```