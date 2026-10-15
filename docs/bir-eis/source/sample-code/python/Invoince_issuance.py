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
URL = "https://eis-cert.bir.gov.ph/api/invoices"

# Private key generated in Setting Application page of EIS Cert.
# Key id generated in Setting Application page of EIS Cert.
JWS_KEY_ID = "JWS_KEY_ID"

# set between fixed values [-----BEGIN PRIVATE KEY-----\n] and [\n-----END PRIVATE KEY-----\n]
JWS_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\n" + "YOUR_DIGITAL_SIGNING_KEY_PAIR_PRIVATE_KEY" + "\n-----END PRIVATE KEY-----\n"

UNIQUE_CHARS = list("0123456789abcdef") # Set use create submit id

now = datetime.now()  # current date and time
strNowDate = now.strftime("%Y%m%d") # current date and time to string

# getSubmitId function for create SubmitId
def getSubmitId(accreditationId):
    randResult = ""
    for i in range(12):
        randResult += random.choice(UNIQUE_CHARS)
        
    submitId = accreditationId+"-"+datetime.now().strftime("%Y%m%d")+"-"+randResult
    print("SUBMIT ID : " + submitId)
    return submitId

# r_pad function for AES encrypt
def r_pad(payload, block_size=16):
    length = block_size - (len(payload) % block_size)
    return payload + chr(length) * length

# unpad function for AES decrypt
def unpad(s):
    return s[:-ord(s[len(s)-1:])]

# send Invoice function
def sendInvoice(file): 
    tokens=""

    # create invoice JWS
    jsonFile = open(file, 'r')
    dictDataJson = json.loads(jsonFile.read())
    DATA_JSON = json.dumps(dictDataJson)
    # create jws from DATA_JSON
    # multi invoice data are separated by commas.
    token = jws.sign(DATA_JSON.encode('utf-8'), JWS_PRIVATE_KEY.encode('utf-8'), headers={"kid": JWS_KEY_ID}, algorithm="RS256")
    tokens += token +","

    # remove last comma
    if tokens!="":
        tokens = tokens[:-1]

    # create submitId
    submitId = getSubmitId(ACCREDITATION_ID)

    # JWS encrypted
    iv = SESSION_KEY[:AES.block_size]
    cipherAES = AES.new(SESSION_KEY.encode('utf-8'), AES.MODE_CBC, iv.encode('utf-8'))
    encrypted = cipherAES.encrypt(r_pad(tokens, AES.block_size).encode('utf-8'))
    encryptedData = base64.b64encode(encrypted)

    # body
    bodyJson = {"submitId": submitId, "data": encryptedData.decode("utf-8")}
    body = json.dumps(bodyJson)

    # create HMAC
    method = "POST"
    dateTime = datetime.now().strftime("%Y%m%d%H%M%S")
    value = dateTime + method + "/api/invoices"
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

    # POST (JSON)
    res = requests.post(URL, data=body, headers=headers)

    # response result logic
    responseJSON = json.loads(res.text)
    
    #case Error
    if (res.status_code != 200):
        print("errorCode : " + responseJSON["errorDetails"]["errorCode"])
        print("errorMessage : " + responseJSON["errorDetails"]["errorMessage"])
        sys.exit()

    # response data decrypted
    rData = base64.b64decode(responseJSON["data"])
    iv = SESSION_KEY[:AES.block_size]
    cipherAES = AES.new(SESSION_KEY.encode('utf-8'),
                        AES.MODE_CBC, iv.encode('utf-8'))
    responseResult = unpad(cipherAES.decrypt(rData))

    # response data to JSON
    responseResultJSON = json.loads(responseResult.decode('utf-8'))
    print(responseResultJSON)
    
sendInvoice('JSON_INVOIC_FE_FILIPINAS_CAS_30.json')