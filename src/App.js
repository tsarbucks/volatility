import { lazy, useEffect, useRef, useState } from 'react';
import './App.css';
import Chart from './Chart.js';
import Feedback from './Feedback.js';
import Spinner from './Spinner.js';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Tooltip from '@mui/material/Tooltip';

const theme = createTheme({
  palette: {
    primary: {
      light: '#8ab7ff',
      main: '#5088f2',
      dark: '#005cbf',
      contrastText: '#fff',
    },
    secondary: {
      light: '#e4cdff',
      main: '#b19cf2',
      dark: '#806ebf',
      contrastText: '#000',
    },
    redy: {
      light: '#ff6666',
      main: '#e60000',
      dark: '#cc0000',
      contrastText: '#000',
    },
  },
  components: {
    CircularProgress: {
      defaultProps: {
        color: 'white',
      },
    },
    MuiTooltip: {
      styleOverrides: {
        arrow: {
          color: 'grey',
        },
        tooltip: {
          backgroundColor: 'grey',
          fontSize: ".8rem",
          marginTop: "0px",
        },
      }
    },
  },
});

function App() {
  const optionRef = useRef(null);
  const tickerRef = useRef(null);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState(null);
  const [searchLen, setSearchLen] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [spin, setSpin] = useState(false);
  const plotly = useRef(null);
  
  const api = 'https://query2.finance.yahoo.com/v7/finance/options/'; // + symbol
  const maxExpiry = 90 * 24 * 60 * 60; // only fetch options up to 3 months out
  const expiryRef = useRef(maxExpiry);
  let symbol = 'TSLA';

  useEffect(() => {
    console.log('init app');
    plotly.current = lazy(() => import("react-plotly.js"));
  }, []);

  useEffect(() => {
    console.log('new symbol ', symbol);
  }, [symbol]);

  const handleFeedback = () => {
    console.log('show feedback');
    setShowFeedback(true);
  }
  const closeFeedback = () => {
    console.log('close feedback');
    setShowFeedback(false);
  }

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!tickerRef.current || !tickerRef.current.value || !tickerRef.current.value.match(/[a-zA-Z-]*/)) {
      if (!tickerRef.current.value.replace(/[^a-zA-Z-]/g, '').match(/^[a-zA-Z-]{1-6}$/)) {
        return setError("Please enter a valid stock, did you mean '" + 
          tickerRef.current.value.replace(/[^a-zA-Z-]/g, '') + "'?");
      }
      return setError("Please enter a valid stock ticker");
    } else {
      setError(null);
    }

    // get base data - includes nearest contract series
    symbol = tickerRef.current.value.replace(/[^a-z-]/gi, '');
    console.log("fetching " + tickerRef.current.value + " clean symbol " + symbol);
    let equity = null;
    setSpin(true);
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(api + symbol)}`);
      if (response.ok) {
        const data = await response.json(response);
        equity = JSON.parse(data.contents);
        if (equity && equity.optionChain) {
          if (!equity.optionChain.result[0] || !equity.optionChain.result[0].quote ||
              !equity.optionChain.result[0].quote.regularMarketPrice) {
            console.log('no market price, yfi err ', equity.optionChain.error);
            throw new Error('Symbol not found: ' + symbol);
          }
          if (!equity.optionChain.result[0].expirationDates || equity.optionChain.result[0].expirationDates.length < 1
             || !equity.optionChain.result[0].strikes || !equity.optionChain.result[0].strikes.length) {
            console.log('no options');
            throw new Error('No options trade on ' + symbol + " [last price: " + equity.optionChain.result[0].quote.regularMarketPrice + "]");
          }
          optionRef.current = new Map();

          // save stock data
          optionRef.current.set('regularMarketPrice', equity.optionChain.result[0].quote.regularMarketPrice);
          optionRef.current.set('earningsTimestamp', equity.optionChain.result[0].quote.earningsTimestamp);
          optionRef.current.set('dividendDate', equity.optionChain.result[0].quote.dividendDate);

          // options data
          optionRef.current.set(equity.optionChain.result[0]?.options[0]?.expirationDate + "-calls", 
            equity.optionChain.result[0]?.options[0]?.calls);
          optionRef.current.set(equity.optionChain.result[0]?.options[0]?.expirationDate + "-puts",
            equity.optionChain.result[0]?.options[0]?.puts);
          const neardate = equity.optionChain.result[0]?.options[0]?.expirationDate;

          if (equity.optionChain.result[0]?.expirationDates?.length > 1) {
            for (let exp of equity.optionChain.result[0].expirationDates) {
              if (exp > neardate + expiryRef.current) {
                console.log("skip " + exp + " > max " + neardate + expiryRef.current);
                continue;
              }
              if (exp !== equity.optionChain.result[0].options[0]?.expirationDate) {
                console.log("fetching " + exp);
                const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(api + symbol + '?date=' + exp)}`)
                if (response.ok) {
                  const data = await response.json(response);
                  const parsed = JSON.parse(data.contents);
                  const chain = parsed.optionChain?.result[0]?.options[0];
                  if (chain) {
                    console.log(exp + " " + chain.calls.length + " calls, " + chain.puts.length + " puts");
                    optionRef.current.set(exp + "-calls", chain.calls);
                    optionRef.current.set(exp + "-puts", chain.puts);
                  } else {
                    console.log("no chain for " + exp);
                  }
                } else {
                  console.log(exp + " fetch failed");
                }
              }
            }
          }
          console.log("optionRef.current size " + optionRef.current.size);
        } else {
          console.log('no options for ' + symbol);
          optionRef.current = null;
          console.log('equity ', equity);
          throw new Error('No options found for ' + symbol);
        }
      } else {
        console.log("initial fetch failed");
        return Promise.reject(response);
      }
      
      console.log("setting state - options")
      setOptions(optionRef.current);
      setSpin(false);
    } catch (err) {
      console.log('got error ', err);
      setError(err?.message ? err.message : "unknown");
      setSpin(false);
    }
  };

  const expiryChange = (e, v) => {
    if (v === "all") {
      expiryRef.current = Infinity;
    } else {
      expiryRef.current = v * 24 * 60 * 60
    }
    console.log("expiry change ", v, " max seconds " + expiryRef.current);
  }

  return (
    <div className="wrapApp">
      <div className="App">
        <ThemeProvider theme={theme}>
          <header className="header">
            <h1>
              Volatility Surface Visualizer
            </h1>
            <p className="disclaimer">A tool for experienced options traders, who know better than to trade based on a free tool without verifying the data first</p>
          </header>
          <div className="form">
            <form onSubmit={handleSearch}>
              <FormGroup>
                <FormControl>
                  <label>
                    Get data for stock:
                    <input id="ticker" className='input' ref={tickerRef}
                      onChange={e => {
                        setSearchLen(e.target.value.length);
                      }}
                    />
                  </label>
                </FormControl>
                <Box width={300} className="radiobox">
                  <label>Days to expiration:</label>
                  <FormControl>
                    <RadioGroup className="radio"
                      row
                      aria-labelledby="expiry-radio-buttons-group-label"
                      defaultValue="30"
                      name="radio-buttons-group"
                      onChange={expiryChange}
                    >
                      <Tooltip title="Get options up to 30 days out" >
                        <FormControlLabel value="30" control={<Radio />} label="30 days" />  
                      </Tooltip>
                      <Tooltip title="Get options up to 60 days out">
                        <FormControlLabel value="60" control={<Radio />} label="60 days" />
                      </Tooltip>
                      <Tooltip title="Get options up to 90 days out" >
                        <FormControlLabel value="90" control={<Radio />} label="90 days" />
                      </Tooltip>
                      <Tooltip title="Get options up to 1 year out" >
                        <FormControlLabel value="365" control={<Radio />} label="1 year" />
                      </Tooltip>
                      <Tooltip title="Get all options" >
                        <FormControlLabel value="all" control={<Radio />} label="all" />
                      </Tooltip>
                    </RadioGroup>
                  </FormControl>
                </Box>
              </FormGroup>
              <Button variant="contained" disabled={searchLen < 1} onClick={handleSearch}>Get data</Button>
            </form>
          </div>
          {error && <div color="redy">Sorry, not able to get data. ({error})</div>}
          {!error && options && <div>
            <Chart options={options} Plot={plotly.current} />
          </div>}
          <Spinner open={spin} msg="Downloading data" />
          {showFeedback && <Feedback opened={showFeedback} close={closeFeedback} />}
        </ThemeProvider>
      </div>
      <div className="footer">
        <Button variant="contained" onClick={handleFeedback}>Feedback</Button>
        <p>Built with:</p>
        <a href="https://reactjs.org/">React</a>
        <a href="https://mui.com/">MUI</a>
        <a href="https://plotly.com/javascript/">Plotly</a>
        <a href="https://finance.yahoo.com/">Yahoo! Finance</a>
        <a href="https://allorigins.win/">allOrigins CORS proxy</a>
      </div>
    </div>
  );
}

export default App;