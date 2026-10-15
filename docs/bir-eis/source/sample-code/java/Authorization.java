package com.sample.eis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClients;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public class Authorization {
    private final String URL ="https://eis-cert.bir.gov.ph/api/authentication"; // Authentication API endpoint URL
    private final String API = "/api/authentication";

    // Set Application Information
    // Set EIS Certification Number
    private final String ACCREDITATION_ID ="YOUR_EIS_CERT_NUMBER";
    private final String APPLICATION_ID ="YOUR_APPLICATION_ID";
    private final String FORCE_REFRESH_TOKEN = "false"; // Whether to force authentication token refresh (Optional) (true / false)
    // Set Applicat Key - You can see or regenerate it on the setting page of your application in the EIS Certification portal.
    private final String SECRET_KEY = "YOUR_APPLICATION_KEY";

    public HttpResponse send() throws Exception {
        HttpClient httpClient = HttpClients.createDefault();

        // Set Request URL
        HttpPost httpPost = new HttpPost(URL);

        // Set Request Header
        String dateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));    // Asia/Manila
        String hmac = new Hmac().generate(SECRET_KEY, dateTime, httpPost.getMethod(), API);

        httpPost.addHeader("datetime", dateTime);
        httpPost.addHeader("authorization", hmac);
        httpPost.addHeader("accreditationId", ACCREDITATION_ID);
        httpPost.addHeader("applicationId", APPLICATION_ID);
        httpPost.addHeader("Content-Type", "application/json; charset=utf-8");

        // Set Request body
        Map<String, String> map= new HashMap<>();
        String data = new Data().generate();
        map.put("data", data);
        map.put("forceRefreshToken", FORCE_REFRESH_TOKEN);

        // Set Request Body
        ObjectMapper objectMapper = new ObjectMapper();
        String json = objectMapper.writeValueAsString(map);
        httpPost.setEntity(new StringEntity(json, "UTF-8"));

        return httpClient.execute(httpPost);
    }

    public static class Data {
        private final String PKCS5 = "AES/CBC/PKCS5Padding";

        private final String USER_ID = "YOUR_USER_ID";   // EIS Accreditation system user id
        private final String PASSWORD = "YOUR_PASSWORD";    // EIS Accreditation system user password

        // EIS Public Key - You can download it on the download page of the EIS Certification portal.
        private final String PUBLIC_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgMbSxoPRLi4P98qbfdFvwYCEf6l2QcKHhyE+m7Fh8OSqKqQFWud0+SSqydzYZzQYZIQ0hwZ/Vvd6StsEY80O7XC6ELVZ052s91PjAlh38TSzmJGy8ZZUYLsg8S2DzKaCpQ0ZmvphYf0ZB8ZoOXBTVPpg4cGBVbMZLdTtnXYxSegXhog6XBsIkAXmAWHwzJ0t6x0NbMnsfbHvFlqtUrsbwBc4BD+0rO3lJHPbDO4HEiMmrlM/bD/hL4uKzXv3jeXCkDbQdYsZZgI7tglu2Al/jB8VdMDJRJjsQf0Z5Ye3FdOsqp1v3SF3ENns8F/0A8xrrB/SuKcwO7Rvm2fjogoqqwIDAQAB";
        private final String AUTH_KEY = "abcdefghijklmnopqrstuvwxyz012345";

        @Getter
        @ToString
        public static class Entity {
            String status;
            String data;
            ErrorDetails errorDetails;
        }

        @Setter
        @Getter
        @ToString
        public static class ErrorDetails {
            String errorCode;
            String errorMessage;
        }

        public String generate() throws Exception {
            ObjectMapper objectMapper = new ObjectMapper();

            Map<String, String> map= new HashMap<>();
            map.put("userId", USER_ID);
            map.put("password", PASSWORD);
            map.put("authKey", AUTH_KEY);
            String json = objectMapper.writeValueAsString(map);

            // Decode PublicKey
            byte[] decoedPublicKey = Base64.getDecoder().decode(PUBLIC_KEY);

            // PublicKey converts to RSAPublicKey
            RSAPublicKey rsaPublicKey = (RSAPublicKey) KeyFactory.getInstance("RSA").
                    generatePublic(new X509EncodedKeySpec(decoedPublicKey));

            // Specify RSA Algorithm
            Cipher cipher = Cipher.getInstance("RSA");
            // Set to Encryption RSAPublicKey
            cipher.init(Cipher.ENCRYPT_MODE, rsaPublicKey);
            // Cipher converts connect byte array
            byte[] bytePlain = cipher.doFinal(json.getBytes());
            // Encrypt content
            String encryptedData =Base64.getEncoder().encodeToString(bytePlain);

            return encryptedData;
        }

        /**
         * Deocde Data
         *
         * @param entity
         */
        public String decodeData(Data.Entity entity) throws Exception {
            // SecretKey converts to bytearray
            byte[] secretKeyByte = AUTH_KEY.getBytes();
            // Set to SecretKeySpec to AES
            SecretKey key = new SecretKeySpec(secretKeyByte, "AES");
            Cipher cipher = Cipher.getInstance(PKCS5);
            // Set to DecryptionMode using AES
            cipher.init(
                    Cipher.DECRYPT_MODE,key,
                    new IvParameterSpec(AUTH_KEY.substring(0,16).getBytes("UTF-8")));
            // Decode encrypted content
            byte[] byteStr = Base64.getDecoder().decode(entity.getData().getBytes());

            return new String(cipher.doFinal(byteStr), "UTF-8");
        }
    }
}