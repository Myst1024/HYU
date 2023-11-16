### DB Update received
  - are local and remote times within 3 hours?
    - Yes: turn on full
    - No: is local time within 3 hours of Date.now()?
      - Yes: turn on partial
      - No: turn off

### Local trigger received
  - Is Date.now() within 3 hours of current local timestamp?
    - Yes: Update local timestamp to time - 24hrs
    - No: Update local timestamp to Date.now()
