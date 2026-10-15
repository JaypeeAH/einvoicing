import sys
import hmac
import hashlib
import requests
import json
import base64
import random
import os
import time
from threading import Thread
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
from Crypto.Cipher import AES
from Crypto import Random
from datetime import datetime
from jose import jws  # pip install python-jose

APPLICATION_ID = "YOUR_APPLICATION_ID" # Set Application ID
ACCREDITATION_ID = "YOUR_EIS_CERT_NUMBER" # Set Test EIS Cert Number
AUTH_TOKEN = "AUTH_TOKEN" # Set auth token key
SESSION_KEY = "SESSION_KEY" # Set session key

HMAC_SHA_256 = "HmacSHA256"
URL = "https://eis-cert.bir.gov.ph/api/invoice_result"

# funtion
def requestInformation(submitId): 
    # create HMAC
    method = "GET"
    dateTime = datetime.now().strftime("%Y%m%d%H%M%S")
    value = dateTime + method + "/api/invoice_result/"+submitId
    mac = base64.b64encode(hmac.new(SESSION_KEY.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).digest())
    signature = "Bearer " + mac.decode('utf-8')

    #header    
    headers = {
        'AuthToken': AUTH_TOKEN,
        'Authorization': signature, 
        'ApplicationId': APPLICATION_ID, 
        'AccreditationId': ACCREDITATION_ID,
        'Datetime': dateTime, 
        'Content-Type': 'application/json; chearset=utf-8'
    }

    # GET
    res = requests.get(URL+"/"+submitId, data="", headers=headers)

    # response result
    responseJSON = json.loads(res.text)

    #case Error
    if (res.status_code != 200):
        print("status_code : " + str(res.status_code))
        print("errorCode : " + responseJSON["errorDetails"]["errorCode"])
        print("errorMessage : " + responseJSON["errorDetails"]["errorMessage"])
        sys.exit()
        
    print('status_code : ' + str(res.status_code))
    print(responseJSON)


# set submit id what you want know
requestInformation("SUBMIT_ID")