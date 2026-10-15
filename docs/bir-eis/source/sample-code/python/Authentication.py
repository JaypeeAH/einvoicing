# from os import write
import sys
import hmac
import hashlib
import requests
import json
import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
from Crypto.Cipher import AES
from datetime import datetime

# Set EIS Public key : Fixed value - EIS Public key published on the download page of the EIS Certification portal.
PUBLIC_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgMbSxoPRLi4P98qbfdFvwYCEf6l2QcKHhyE+m7Fh8OSqKqQFWud0+SSqydzYZzQYZIQ0hwZ/Vvd6StsEY80O7XC6ELVZ052s91PjAlh38TSzmJGy8ZZUYLsg8S2DzKaCpQ0ZmvphYf0ZB8ZoOXBTVPpg4cGBVbMZLdTtnXYxSegXhog6XBsIkAXmAWHwzJ0t6x0NbMnsfbHvFlqtUrsbwBc4BD+0rO3lJHPbDO4HEiMmrlM/bD/hL4uKzXv3jeXCkDbQdYsZZgI7tglu2Al/jB8VdMDJRJjsQf0Z5Ye3FdOsqp1v3SF3ENns8F/0A8xrrB/SuKcwO7Rvm2fjogoqqwIDAQAB"

# Set User ID, Password
USER_ID = "YOUR_USER_ID"
PASSWORD = "YOUR_PASSWORD"

APPLICATION_ID = "YOUR_APPLICATION_ID" # Set Application ID
# Set Applicat Key - You can see or regenerate it on the setting page of your application in the EIS Certification portal.
APPLICATION_SECRET_KEY = "YOUR_APPLICATION_KEY"
ACCREDITATION_ID = "YOUR_EIS_CERT_NUMBER" # Set Test EIS Cert Number
FORCE_REFRESH_TOKEN = "false" # Set Force refresh token

HMAC_SHA_256 = "HmacSHA256"
URL = "https://eis-cert.bir.gov.ph/api/authentication"

def unpad(s):
    # Unpad for AES decryption
    return s[:-ord(s[len(s)-1:])]

# Generate a 32-digit auth key. (make it what you want. Check 32 digits.)
# The auth key is encrypted with Public Kek and transmitted, and in EIS, it is encrypted with the auth key and transmitted.
# Decrypt the received information with the auth key and check the received information.
AUTH_KEY = "abcdefghijklmnopqrstuvwxyz012345"

# User information to JSON
dataMap = {"userId": USER_ID, "password": PASSWORD, "authKey": AUTH_KEY}
data = json.dumps(dataMap)

# User information encrypted
key = base64.b64decode(PUBLIC_KEY)
key = RSA.importKey(key)
cipher = PKCS1_v1_5.new(key)
ciphertext = base64.b64encode(cipher.encrypt(bytes(data, "utf-8")))

# body data
# forceRefreshToken : if you want new auth token and session key then set value true
bodyJson = {"data": ciphertext.decode("utf-8"), "forceRefreshToken": FORCE_REFRESH_TOKEN} 
body = json.dumps(bodyJson)

# create HMAC
method = "POST"
dateTime = datetime.now().strftime("%Y%m%d%H%M%S")
value = dateTime + method + "/api/authentication"
mac = base64.b64encode(hmac.new(APPLICATION_SECRET_KEY.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).digest())
signature = "Bearer " + mac.decode('utf-8')

# header
headers = {
    'Authorization': signature, 
    'ApplicationId': APPLICATION_ID, 
    'AccreditationId': ACCREDITATION_ID,
    'Datetime': dateTime, 
    'Content-Type': 'application/json; chearset=utf-8'       
}

# POST (JSON)
res = requests.post(URL, data=body, headers=headers)

# response result
responseJSON = json.loads(res.text)

# case Error
if (res.status_code != 200):
    print("errorCode : " + responseJSON["errorDetails"]["errorCode"])
    print("errorMessage : " + responseJSON["errorDetails"]["errorMessage"])
    sys.exit()

# response data decrypted
rData = base64.b64decode(responseJSON["data"])
iv = AUTH_KEY[:AES.block_size]
cipherAES = AES.new(AUTH_KEY.encode('utf-8'), AES.MODE_CBC, iv.encode('utf-8'))
responseResult = unpad(cipherAES.decrypt(rData))

# response data to JSON
responseResultJSON = json.loads(responseResult.decode('utf-8'))

# save response result JSON to result.json file
authToken = responseResultJSON["authToken"]
sessionkey = responseResultJSON["sessionKey"]

print("AUTHTOKEN : " + authToken)
print("SESSION KEY : " + sessionkey)