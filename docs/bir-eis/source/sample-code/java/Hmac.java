package com.sample.eis;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.Charset;
import java.util.Base64;

public class Hmac {

    public String generate(String secretKey, String dateTime, String httpMethod, String uri) throws Exception {
        SecretKeySpec key = new SecretKeySpec(secretKey.getBytes(), "HmacSHA256");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(key);

        String value = dateTime + httpMethod + uri;
        byte[] rawHmac = mac.doFinal(value.getBytes(Charset.forName("UTF-8")));
        String hmac= "Bearer " + Base64.getEncoder().encodeToString(rawHmac);

        return hmac;
    }

}