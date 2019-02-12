# bin/bash

curl -X POST -u "apikey:z_CagfZeHMxetK6N2YqREsqWcEiy2sGSM2p0t8IVDqI9" \
"https://gateway-fra.watsonplatform.net/natural-language-understanding/api/v1/analyze?version=2018-11-16" \
--request POST \
--header "Content-Type: application/json" \
--data '{
  "text": "Might be good to know what tasks do i have for today. Is there something in Trello?",
  "return_analyzed_text": true,
  "features": {
    "entities": {
      "emotion": true,
      "sentiment": true,
      "limit": 8
    },
    "keywords": {
      "emotion": true,
      "sentiment": true,
      "limit": 8
    }
  }
}'
