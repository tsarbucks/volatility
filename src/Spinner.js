import React from "react";
import { useTheme } from '@mui/material/styles';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const Spinner = React.memo(({open, msg}) => {
  console.log('Spinner open ' + open + " msg " + msg);
  const theme = useTheme();

  return (
    <div className="spinner" theme={theme}>
      <Backdrop
        open={open}
      >
        <div>
          <CircularProgress disableShrink size="80px" />
          <div className="SpinnerLabel">
            <p>{msg}</p>
          </div>
        </div>
      </Backdrop>
    </div>
  );
});

export default Spinner;