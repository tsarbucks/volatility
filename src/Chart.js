import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import React from 'react';
import Options from './Options.js';
import html2canvas from "html2canvas";
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import PubSub from 'pubsub-js';

const green = [[0, 'rgba(64,192,64,33)'], [1, 'rgba(64,255,64,33)']];
const red = [[0, 'rgba(192,64,64,33)'], [1, 'rgba(255,64,64,33)']];
const width = 6;

let layout = {
  title: 'Interactive Volatility Chart',
  showlegend: false,
  autosize: true,
  width: 800,
  height: 600,
  scene: {
    xaxis: {title: 'Expiry', type: 'date'},
    yaxis: {title: 'Strike'},
    zaxis: {title: 'Volatility', tickformat: '.0%'},
    aspectratio: {
      x: 1., y: 1., z: .67
    }
  },
  margin: {
    l: 25,
    r: 25,
    b: 10,
    t: 30,
    pad: 5
  },
};
let config = {
  modeBarButtonsToRemove: ['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation', 'resetCameraLastSave3d', 'toImage']
};

const Chart = React.memo(({options, Plot}) => {
  const [closeChecked, setCloseChecked] = useState(false);
  const [earnChecked, setEarnChecked] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [putcall, setPutcall] = useState("both");
  const [strikes, setStrikes] = useState(20);

  const ref = useRef(null);
  const symbol = useRef(null);
  const [w, setW] = useState(800);

  useLayoutEffect(() => {
    console.log("chart client w x h " + ref.current.clientWidth + " x " + ref.current.clientHeight)
    setW(ref.current.clientWidth);

    //const m = window.matchMedia("only screen and (max-width: 991px)");
    const m = ('ontouchstart' in window) ? true : false;
    console.log("mobile check ", m);
    setMobile(m);
    
    const handleResize = () => {
      console.log("chart resize w x h " + ref.current.clientWidth + " x " + ref.current.clientHeight)
      setW(ref.current.clientWidth);
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, []);  // run once - only one listener

  useEffect(() => {
    console.log("chart plot ", Plot);
    /*if (plotly !== null) {
      Plot.current = React.lazy(() => import(plotly));
    }*/
  }, [Plot]);

  const download = async (event) => {
    const canvas = await html2canvas(ref.current);
    const base64 = canvas.toDataURL("image/png");
    const filename = symbol.current + "_vol_" +
      new Date().toLocaleDateString('en-us', {month: '2-digit', day: '2-digit',
        year: 'numeric'}).replace(/(\d+)\/(\d+)\/(\d+)/, '$3$1$2') + '.png';
    console.log("downloading to ", filename);
    const tmplink = document.createElement('a');
    tmplink.href = base64;
    tmplink.setAttribute('download', filename);
    document.body.appendChild(tmplink);
    tmplink.click();
    tmplink.parentNode.removeChild(tmplink);
  }

  const ignoreFn = e => {
    // ignore the event
  }

  const updateClose = e => {
    console.log("set close plane " + e.target.checked);
    setCloseChecked(e.target.checked);
  }

  const updateEarn = e => {
    console.log("set earnings " + e.target.checked);
    setEarnChecked(e.target.checked);
  }

  const updatePutcall = (e, newValue) => {
    console.log("putcall change to ", newValue);
    setPutcall(newValue);
  }

  const updateStrikes = (event, newValue) => {
    console.log("set strikes to " + newValue);
    setStrikes(newValue);
  }

  const plotClick = (e) => {
    console.log("plotClick ", e.points[0].pointNumber);
    const p1 = e.points[0]?.pointNumber[1] || null;
    const raw = p1 ? e.points[0]?.data?.text[p1] || null : null;
    console.log("raw ", raw);
    if (raw) {
      PubSub.publish('options', raw);
    }
  }

  // destructure the options data. options has two arrays: calls and puts
  // sample data:
  /* {"contractSymbol":"TSLA221021C00030000",
      "strike":300,"currency":"USD",
      "lastPrice":33.05,"change":0.0,
      "percentChange":0.0,"volume":1,
      "openInterest":2935,"bid":33.1,"ask":33.15,
      "contractSize":"REGULAR","expiration":1658448000,
      "lastTradeDate":1654524013,"impliedVolatility":1.0000000000000003E-5,"inTheMoney":true},
  */
  const getData = (options) => {
    let traces = [];
    let dates = [];
    let underlying = 0;
    let underhi = 0;
    let underlo = 0;
    let maxvol = 0;
    let earndate = 0;
    let divdate = 0;
    let minstrike = Infinity;
    let maxstrike = 0;
    for (const [key, value] of options.entries()) {
      if (key === 'regularMarketPrice') {
        underlying = value;
        continue;
      }
      if (key === 'earningsTimestamp') {
        earndate = value;
        continue;
      }
      if (key === 'dividendDate') {
        divdate = value;
        continue;
      }
      let strikelimit = null;
      if (strikes > 1 && strikes < 50) {
        strikelimit = strikes;
      }
      console.log("charting " + key + " strikelimit " + strikelimit);
      let x = [];
      let y = [];
      let z = [];
      let text = [];
      let pdate = 'date';
      for (let opt of value) {
        const under = opt.contractSymbol.match( /^[a-z]+/i ).join([]);
        if (symbol.current !== under) {
          symbol.current = under;
          layout.title = "Interactive Volatility Chart for " + symbol.current;
        }
        if (putcall === 'puts' && key.match('call')) {
          continue;
        }
        if (putcall === 'calls' && !key.match('call')) {
          continue;
        }
        if (!strikelimit || ( opt.strike < (underlying * (1 + strikelimit / 100))
            && opt.strike > (underlying * (1 - strikelimit / 100)) ) ) {
          const date = new Date(opt.expiration * 1000);
          date.setDate(date.getDate() + 1); // for some reason yfi date is 1 day early
          pdate = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
          if (pdate !== dates[dates.length - 1]) dates.push(pdate);
          const date2 = new Date(date);
          date2.setDate(date.getDate() + width);
          const pdate2 = [date2.getFullYear(), date2.getMonth() + 1, date2.getDate()].join('-')
          z.push([opt.impliedVolatility, opt.impliedVolatility]);
          x.push([pdate, pdate2]);
          y.push(opt.strike);
          text.push(opt);
          maxvol = Math.max(maxvol, opt.impliedVolatility);
          maxstrike = Math.max(maxstrike, opt.strike);
          minstrike = Math.min(minstrike, opt.strike);
        }
      }
      traces.push({
        z: z,
        x: x,
        y: y,
        text: text,
        name: '',
        colorscale: key.match('call') ? green : red,
        opacity: 0.5,
        type: 'surface',
        showscale: false,
        hoverlabel: {bgcolor: key.match('call') ? "#04A133" : "#D01D27"},
        hovertemplate:
          "<b>" + (key.match('call') ? pdate + ' calls' : pdate + ' puts') + "</b><br>" +
          "Strike: %{y:$,.2f}<br>" +
          //"Type: " + (key.match('call') ? 'Call' : 'Put') + "<br>" +
          "IV: %{z:.0%}"
      });
    };

    const strikerange = maxstrike - minstrike;
    const strikehalfpct = strikerange / 100 / 2;
    underhi = underlying + strikehalfpct;
    underlo = underlying - strikehalfpct;
    const closetrace = {
      x: [dates[0], dates[dates.length - 1]],
      y: closeChecked ? [underlying, underlying] : [underlo, underhi], // underlying close 
      z: closeChecked ? [[0, 0], [maxvol, maxvol]] : [[0, 0], [0, 0]], // min visible height
      colorscale: 'Blues',
      opacity: closeChecked ? 0.5 : 1,
      name: '',
      showscale: false,
      type: 'surface',
      hovertemplate:
        "<b>" + symbol.current + ": " + underlying.toLocaleString('en-US', {style: 'currency', currency: 'USD'}) + "</b><br><br>"
    };
    traces.push(closetrace);
    
    // earnings and dividend traces - controlled by one checkbox - earnChecked
    if (earnChecked) { 
      const date = new Date(earndate * 1000);
      const prtdate = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
      const date2 = new Date(date);
      date2.setDate(date.getDate() + 1);
      const prtdate2 = [date2.getFullYear(), date2.getMonth() + 1, date2.getDate()].join('-')
      console.log("earndate " + earndate + " prtdate " + prtdate + " strikes ", minstrike, maxstrike);
      const earntrace = {
        x: [prtdate, prtdate2],
        y: [minstrike, maxstrike],
        z: [[0, maxvol], [0, maxvol]],
        colorscale: 'Greys',
        opacity: 0.5,
        name: '',
        showscale: false,
        type: 'surface',
        hovertemplate: "<b>Earnings date:</b><br>" + prtdate + "<br>" + date.toLocaleTimeString()
      };
      traces.push(earntrace);

      if (divdate) {
        const date = new Date(divdate * 1000);
        const prtdate = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
        const prtdate2 = [date.getFullYear(), date.getMonth() + 1, date.getDate() + 1].join('-')
        const divtrace = {
          x: [prtdate, prtdate2],
          y: [minstrike, maxstrike],
          z: [[0, maxvol], [0, maxvol]],
          colorscale: 'Greys',
          opacity: 0.5,
          name: '',
          showscale: false,
          type: 'surface',
          hovertemplate: "<b>Dividend date:</b><br>" + prtdate + "<br>" + date.toLocaleTimeString()
        };
        traces.push(divtrace);
      }
    }

    //console.log("x ", x.map(a=>a[0]));  
    //console.log("traces ", traces);
    return traces;
  }
  
  if (options) {
    const data = getData(options);
    console.log("render chart w x h " + w + " x " + w * 6 / 8);
    layout.width = w;
    layout.height = w * 6 / 8;
    return (
      <div>
        <div className='input centerflex'>
          <Box width={300}>
            <span>Display strike within x%:</span>
            <Tooltip title="Filter for strikes +/- percent of underlying" arrow>
              <Slider
                size="small"
                value={strikes}
                defaultValue={20}
                onChange={updateStrikes}
                step={1}
                min={1}
                max={50}      
                aria-label="Strikes"
                valueLabelDisplay="auto"
                valueLabelFormat={value => <div>{value < 50 ? value : 'all'}</div>}
              />
            </Tooltip>
          </Box>
          <RadioGroup className="radio"
                      row
                      aria-labelledby="putcall-radio-buttons-group-label"
                      defaultValue="both"
                      name="radio-buttons-group"
                      onChange={updatePutcall}
          >
            <Tooltip title="Show puts (red) and calls (green)" arrow>
              <FormControlLabel value="both" control={<Radio />} label="Both" />  
            </Tooltip>
            <Tooltip title="Puts only" arrow>
              <FormControlLabel value="puts" control={<Radio />} label="Puts" />
            </Tooltip>
            <Tooltip title="Calls only" arrow>
              <FormControlLabel value="calls" control={<Radio />} label="Calls" />
            </Tooltip>
          </RadioGroup>
          <Tooltip title="Use plane to represent underlying - bisect each smile" arrow>
            <FormControlLabel control={<Checkbox 
              checked={closeChecked}
              onChange={updateClose}
              inputProps={{ 'aria-label': 'controlled' }}
            />} label="Underlying price plane" />
          </Tooltip>
          <Tooltip title="Show earnings date (and dividend date if any)" arrow>
            <FormControlLabel control={<Checkbox 
              checked={earnChecked}
              onChange={updateEarn}
              inputProps={{ 'aria-label': 'controlled' }}
            />} label="Earnings date plane" />
          </Tooltip>
        </div>
        <div className='chart' ref={ref} id="chart">
          { Plot && <div className='plot'>
            <Plot
              data={data}
              layout={layout}
              onClick={plotClick}
              onHover={mobile ? plotClick : ignoreFn}
              config={config}
            />
          </div> }
          <div className="buttonOverlay">
            <Tooltip title="Download to .png file" placement="top" arrow>
              <IconButton aria-label="download" onClick={download} color="primary">
                <DownloadForOfflineIcon sx={{fontSize: "40px"}} />
              </IconButton>
            </Tooltip>
          </div>
          <div className="options">
            <Options/>
          </div>
        </div>
      </div>
    );
  }
  return <div>No options data, cannot create Volatility Surface</div>
});
 
export default Chart;