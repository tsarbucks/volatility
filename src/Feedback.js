import { useRef, useState } from 'react';
import * as React from 'react';
import Spinner from './Spinner.js';

import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

const Feedback = React.memo(({opened, close}) => {

  const textRef = useRef(null);
  const [contact, setContact] = useState("none");
  const [error, setError] = useState(null);
  const [followup, setFollowup] = React.useState("");
  const [followupError, setFollowupError] = React.useState(null);
  const [success, setSuccess] = useState(null);
  const [spin, setSpin] = useState(false);

  const send = async (event) => {
    console.log("sending");
    event.preventDefault();
    if (contact !== "none" && followupError) {
      return setError(followupError);
    }
    if (!textRef.current || !textRef.current.value || !textRef.current.value.length > 10
         || !textRef.current.value.match(/[a-z\s]{10,}/gi)) {
      return setError("Please say a little more.");
    } else {
      setError(null);
    }

    const clean = textRef.current.value.replace(/(<([^>]+)>)/ig, '#');
    console.log("sending " + textRef.current.value + " clean " + clean);
    setSpin(true);
    try {
      const response = await fetch('https://buwwp3m02b.execute-api.us-west-2.amazonaws.com/Prod/feedback', {
        method: 'POST',
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          agent: navigator.userAgent,
          text: clean,
          followup: followup,
        })
      });
      
      if (response.ok) {
        setSuccess("Thanks for your input! This window will close in 3 sec.");
        setSpin(false);
        setTimeout(() => {
          close();
        }, 3210);
      } else {
        console.log("send failed: ", response, " status ", response.status);
        return Promise.reject(response);
      }
    } catch (err) {
      console.log('send err ', err);
      let msg = err?.message ? err.message : "Sorry, got an unknown error sending to server";
      if (msg === "Failed to fetch") msg = "Sorry, got an unknown error sending to server";
      setError(msg);
      setSpin(false);
    }
  };

  const closeclick = (e, cls) => {
    console.log("closeclick ", cls);
    e.stopPropagation();
    if (cls) {
      close();
    }
  }

  const followupChange = (event) => {
    setFollowup(event.target.value);
    if (contact === "text"){
      const cleaned = ('' + event.target.value).replace(/\D/g, '');
      const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        const intlCode = (match[1] ? '+1 ' : '');
        setFollowup([intlCode, '(', match[2], ') ', match[3], '-', match[4]].join(''));
        setFollowupError(null);
      } else {
        console.log("invalid phone ", event.target.value)
        setFollowupError("please enter a valid phone number");
      }
    }
    if (contact === "email"){
      if (!event.target.value.match(/^[a-z0-9._+-]+@[a-z0-9._-]+\.[a-z]{2,20}/gi)) {
        console.log("invalid email ", event.target.value)
        setFollowupError("please enter a valid email address");
      } else {
        setFollowupError(null);
      }
    }
  };

  const updateContact = (e, newValue) => {
    console.log("contact change to ", newValue);
    setContact(newValue);
  }

  console.log("feedback opened " + opened);

  return (
    <div className="feedwrap" onClick={(e) => closeclick(e, true)}>
      <div className={opened ? "feedback" : "feedbackhide"} onClick={(e) => closeclick(e, false)}>
        {success && <div className="success">{success}</div>}
        {error && <div className="err">{error}</div>}
        <h2>Send Feedback</h2>
        <div>
          <p>Problems? Feature requests? Let us know!</p>
          <TextareaAutosize
            autoFocus
            aria-label="feedback"
            minRows={5}
            placeholder="Enter feedback"
            ref={textRef}
          />
          <RadioGroup className="radio"
            row
            aria-labelledby="contact-radio-buttons-group-label"
            defaultValue="none"
            name="radio-buttons-group"
            onChange={updateContact}
          >
            <p>Want a reply?</p>
            <Tooltip title="Do not contact me!" arrow>
              <FormControlLabel value="none" control={<Radio />} label="None" />  
            </Tooltip>
            <Tooltip title={<><p>We'll send you a text to follow up.</p><p>No spam ever.</p></>} arrow>
              <FormControlLabel value="text" control={<Radio />} label="Text" />
            </Tooltip>
            <Tooltip title={<><p>We'll send you an email to follow up.</p><p>No spam ever.</p></>} arrow>
              <FormControlLabel value="email" control={<Radio />} label="Email" />
            </Tooltip>
          </RadioGroup>
          {contact !== "none" &&
            <TextField
              className='input'
              value={followup}
              onChange={followupChange}
              helperText={followupError}
              error={followupError?.length > 0 ? true : false}
            />
          }
        </div>
        <div className="buttons">
          <Button variant="contained" onClick={close}>Cancel</Button>
          <Button variant="contained" onClick={send}>Send</Button>
        </div>
      </div>
      <Spinner open={spin} msg="Sending" />
    </div>
  );
});

export default Feedback;