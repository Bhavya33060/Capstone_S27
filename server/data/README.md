Drop your real `citi_bike_feature_engineered.csv` (the output of your feature-engineering
script) in this folder. The server reads the path from `DATA_FILE` in `.env`
(defaults to `./data/citi_bike_feature_engineered.csv`).

If no file is found here, the server automatically generates a realistic synthetic
multi-city dataset with the exact same columns, so the app still runs end-to-end.

`users.json` is created automatically here when someone registers — don't edit by hand.
