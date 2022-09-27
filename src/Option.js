import React from 'react';
import CancelIcon from '@mui/icons-material/Cancel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

const Option = React.memo((props) => {
  return (
    <li>
      <Card sx={{ minWidth: 100 }} className="card">
        <CardContent>
          <span className="closecard" onClick={props.close}>
            <Tooltip title="Close">
              <IconButton aria-label="close card">
                <CancelIcon />
              </IconButton>
            </Tooltip>
          </span>
          <h5>{props.contractSymbol}</h5>
          <p>last: ${props.lastPrice.toFixed(2)}</p>
          <p>change: {props.percentChange.toFixed(2)}%</p>
          <p>IV: {Math.round(props.impliedVolatility * 100)}%</p>
          <p>bid: ${props.bid.toFixed(2)} ask: ${props.ask.toFixed(2)}</p>
          <p>volume: {props.volume}</p>
          <p>OI: {props.openInterest}</p>
        </CardContent>
      </Card>
    </li>
  )
});

export default Option;