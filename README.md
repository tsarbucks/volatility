# Volatility Surface Visualizer

A tool for experienced options traders to see the volatility surface of a given underlying.

## Introduction

This is a web app to make it easy for traders to see the volatility surface by expiration date and strike:

[https://tsarbucks.github.io/volatility/](https://tsarbucks.github.io/volatility/)

1. Enter the ticker for the stock you are interested in
2. Choose the limit for expiration date - default is 30 days
3. Click the Get Data button
4. (Data fetched from the Yahoo Finance API)
5. When the data is downloaded, it will display below. There are various filters:
  * strikes - be default only strikes within 20% of the current price are shown, use the slider to change - slide to the far right to include all strikes in the chart
  * put call - by default puts are shown in red and calls in green, however if you are only interested in one or the other you can click the radio buttons to limit accordingly
  * underlying price - by default is shown in a blue line, click the checkbox to show as a plane bisecting the volatility curve
  * earnings dates - click the checkbox to show, using the Yahoo data, which may not be the next announcement but the prior one. Will also show the ex-dividend date if any
6. Using the chart - you can drag it to change the perspective. Hover over the chart to see info on a particular option. Click on that point to open a card containing that option's last price, today's change, implied volatility, bid-ask, volume, and open interest. On laptops, the cards will appear to the right of the chart, on mobile they appear beneath it. The most recently clicked option will always be at the top.
7. Save the chart - you can save the chart and options cards by clicking the round button at the lower left. The file will be named XXX_vol_yyyymmdd.png where XXX is your ticker
8. Any problems or feature requests? Click the Feedback button in the page footer.

#### Disclaimer - for experienced options traders only. You must not trade based on a free tool, the intent of this is to let you view the volatility curve and formulate a strategy. Or compare volatility levels of various stocks you are considering (the option detail cards persist when you enter new stocks to view, unless you manually close them). You should then verify the data in your brokerage account before making a trade.

This is one of various apps I wrote for personal use. I couldn't find a free volatility curve viewer geared towards traders, not academics. I hope others will also find it useful and am thus open sourcing it. To further the open source movement, it is under the GPL v3 license, so any derivative works must also be open source.

## How to run locally

### Clone the repo

```bash
git clone https://github.com/tsarbucks/volatility.git
```

### Install the dependencies

```bash
npm install
```

### Start the server

```bash
npm start
```

Open [http://localhost:3434](http://localhost:3434) to view it in your browser. The port 3434 can be changed in the .env file in the project root.

Because of personal preferences, this project is not configured to automatically open the app in a new browser tab. This can be changed by deleting the BROWSER=none line in the .env file.