package com.sample.eis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
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
import java.security.interfaces.RSAPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.stream.IntStream;

public class IssuanceInvoice {

    private final String URL = "https://eis-cert.bir.gov.ph/api/invoices";
    private final String API = "/api/invoices";

    // Set Your Authentication Token - Result of Authentication API
    private final String AUTH_TOKEN = "YOUR_AUTH_TOKEN";
    // Set Your Session Secret Key - Result of Authentication API
    private final String SESSION_SECRET_KEY = "YOUR_SESSION_SECRET_KEY";
    
    // Set Application Information
    // Set EIS Certification Number
    private final String ACCREDITATION_ID ="YOUR_EIS_CERT_NUMBER";
    // Set Your Application ID
    private final String APPLICATION_ID ="YOUR_APPLICATION_ID";

    // Your Digital Signing Key ID
    private final String KEY_ID = "YOUR_DIGITAL_SIGNING_KEY_ID";
    // Your Digital Signing private key (You can generate Digital Signing Key-pair on the Setting page of your Application in the EIS Certification portal)
    private final String PRIVATE_KEY = "YOUR_DIGITAL_SIGNING_KEY_PAIR_PRIVATE_KEY";

    public final String SAMPLE_CAS = "{\n" +
            "  \"CompInvoiceId\": \"0092699521\",\n" +
            "  \"IssueDtm\": \"20220527\",\n" +
            "  \"EisUniqueId\": \"20220527" + ACCREDITATION_ID + "00000132\",\n" +
            "  \"DocType\": \"01\",\n" +
            "  \"TransClass\": \"01\",\n" +
            "  \"CorrYN\": \"N\",\n" +
            "  \"PrevUniqueId\": \"\",\n" +
            "  \"Rmk1\": \"null\",\n" +
            "  \"SellerInfo\": {\n" +
            "    \"Tin\": \"004587407\",\n" +
            "    \"BranchCd\": \"00000\",\n" +
            "    \"Type\": \"0\",\n" +
            "    \"RegNm\": \"SAMSUNG ELECTRONICS PHILIPPINES CORPORATION\",\n" +
            "    \"BusinessNm\": \"SAMSUNG ELECTRONICS PHILIPPINES CORPORATION\",\n" +
            "    \"Email\": \"andy.cenidoza@yahoo.com\",\n" +
            "    \"RegAddr\": \"7th to 10th Floors Science Hub Tower 4 Mckinley Hill Cyberpark Pinagsama Taguig City 1630\"\n" +
            "  },\n" +
            "  \"BuyerInfo\": {\n" +
            "    \"Tin\": \"000000000\",\n" +
            "    \"BranchCd\": \"00000\",\n" +
            "    \"RegNm\": \"DUTY FREE PHILIPPINES CORPORATION (0006060516)\",\n" +
            "    \"BusinessNm\": \"DUTY FREE PHILIPPINES CORPORATION\",\n" +
            "    \"Email\": null,\n" +
            "    \"RegAddr\": \"ADDRESS ADDRESS  \",\n" +
            "    \"DevAddr\": \"ADDRESS, ADDRESS\"\n" +
            "  },\n" +
            "  \"AirNum\": \"null\",\n" +
            "  \"AirNumDt\": \"null\",\n" +
            "  \"LadNum\": \"null\",\n" +
            "  \"LadNumDt\": \"null\",\n" +
            "  \"Items\": [\n" +
            "    {\n" +
            "      \"Nm\": \"MG30T5018CC/TC\",\n" +
            "      \"Desc\": \"MWO(COMMON),1.1,220-240V 50/60HZ,CLEAN C\",\n" +
            "      \"Qty\": \"5.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"204.05\",\n" +
            "      \"SalesAmt\": \"1020.25\",\n" +
            "      \"RegDscntAmt\": \"234.67\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"785.60\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"Nm\": \"MS28F303TFK/TC\",\n" +
            "      \"Desc\": \"MWO(COMMON),1,230V 60HZ,EBONY BLACK,TACT\",\n" +
            "      \"Qty\": \"5.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"129.82\",\n" +
            "      \"SalesAmt\": \"649.10\",\n" +
            "      \"RegDscntAmt\": \"149.30\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"499.80\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"Nm\": \"WA80T5160WW/TC\",\n" +
            "      \"Desc\": \"OWM,SEPCO,PH,8\",\n" +
            "      \"Qty\": \"5.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"426.76\",\n" +
            "      \"SalesAmt\": \"2133.80\",\n" +
            "      \"RegDscntAmt\": \"490.79\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"1643.05\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"Nm\": \"WA12T5360BV/TC\",\n" +
            "      \"Desc\": \"OWM,SEPCO,PH,12\",\n" +
            "      \"Qty\": \"5.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"630.90\",\n" +
            "      \"SalesAmt\": \"3154.50\",\n" +
            "      \"RegDscntAmt\": \"725.55\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"2428.95\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"Nm\": \"WA10T5360BV/TC\",\n" +
            "      \"Desc\": \"OWM,SEPCO,PH,10\",\n" +
            "      \"Qty\": \"5.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"556.67\",\n" +
            "      \"SalesAmt\": \"2783.35\",\n" +
            "      \"RegDscntAmt\": \"640.19\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"2143.20\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"Nm\": \"WA75T4262VS/TC\",\n" +
            "      \"Desc\": \"OWM,SEPCO,PH,7.5\",\n" +
            "      \"Qty\": \"5.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"371.08\",\n" +
            "      \"SalesAmt\": \"1855.40\",\n" +
            "      \"RegDscntAmt\": \"426.75\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"1428.65\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"Nm\": \"RB27N4020S9/TC\",\n" +
            "      \"Desc\": \"RLF,280.0,230V 60HZ\",\n" +
            "      \"Qty\": \"5.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"556.67\",\n" +
            "      \"SalesAmt\": \"2783.35\",\n" +
            "      \"RegDscntAmt\": \"640.19\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"2143.20\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"Nm\": \"RB30N4020S9/TC\",\n" +
            "      \"Desc\": \"RLF,310.0,230V 60HZ\",\n" +
            "      \"Qty\": \"5.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"630.90\",\n" +
            "      \"SalesAmt\": \"3154.50\",\n" +
            "      \"RegDscntAmt\": \"725.55\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"2428.95\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"Nm\": \"RT43K6251BS/TC\",\n" +
            "      \"Desc\": \"RTF,449.0,230V 60HZ\",\n" +
            "      \"Qty\": \"3.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"797.93\",\n" +
            "      \"SalesAmt\": \"2393.79\",\n" +
            "      \"RegDscntAmt\": \"550.58\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"1843.23\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"Nm\": \"MS32J5133AT/TC\",\n" +
            "      \"Desc\": \"MWO(COMMON),1.1,230V 60HZ,REAL STAINLESS\",\n" +
            "      \"Qty\": \"3.000\",\n" +
            "      \"Unit\": \"PCE\",\n" +
            "      \"UnitCost\": \"139.10\",\n" +
            "      \"SalesAmt\": \"417.30\",\n" +
            "      \"RegDscntAmt\": \"95.99\",\n" +
            "      \"SpeDscntAmt\": \"0.00\",\n" +
            "      \"NetSales\": \"321.33\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"TotNetItemSales\": 15665.96,\n" +
            "  \"Discount\": {\n" +
            "    \"ScAmt\": 0.0,\n" +
            "    \"PwdAmt\": 0.0,\n" +
            "    \"RegAmt\": 4679.56,\n" +
            "    \"SpeAmt\": 0.0,\n" +
            "    \"Rmk2\": \"Regular Discount\"\n" +
            "  },\n" +
            "  \"OtherTaxRev\": 0.0,\n" +
            "  \"TotNetSalesAftDisct\": 15665.96,\n" +
            "  \"VATAmt\": 1879.92,\n" +
            "  \"WithholdIncome\": 0.0,\n" +
            "  \"WithholdBusVAT\": 0.0,\n" +
            "  \"WithholdBusPT\": 0.0,\n" +
            "  \"OtherNonTaxCharge\": \"0.00\",\n" +
            "  \"NetAmtPay\": 17545.88,\n" +
            "  \"ForCur\": {\n" +
            "    \"Currency\": \"USD\",\n" +
            "    \"ConvRate\": 48.5,\n" +
            "    \"ForexAmt\": 15665.96\n" +
            "  },\n" +
            "  \"PtuNum\": \"1909_0116_PTU_CAS_000636\"\n" +
            "}";

    public HttpResponse send() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        HttpClient httpClient = HttpClients.createDefault();
        // Set Request URL
        HttpPost httpPost = new HttpPost(URL);

        // Set Request Header
        String dateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));    // Asia/Manila
        httpPost.addHeader("datetime", dateTime);

        String hmac = new Hmac().generate(SESSION_SECRET_KEY, dateTime, httpPost.getMethod(), API);
        httpPost.addHeader("authorization", hmac);

        httpPost.addHeader("authToken", AUTH_TOKEN);
        httpPost.addHeader("accreditationId", ACCREDITATION_ID);
        httpPost.addHeader("applicationId", APPLICATION_ID);
        httpPost.addHeader("Content-Type", "application/json; charset=utf-8");

        // Set Request Body
        Map<String, String> map= new HashMap<>();
        map.put("submitId", generateSubmitId(ACCREDITATION_ID));

        String data = encrypt(
                SESSION_SECRET_KEY,
                generateJws(KEY_ID, PRIVATE_KEY, SAMPLE_CAS));
        map.put("data", data);

        String json = objectMapper.writeValueAsString(map);
        httpPost.setEntity(new StringEntity(json, "UTF-8"));

        return httpClient.execute(httpPost);
    }

    private String generateJws(String id, String key, String data) throws Exception {
        JWSHeader jwsHeader = new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(id).build();
        Payload payload = new Payload(data);

        JWSObject jwsObject = new JWSObject(jwsHeader, payload);
        byte[] decodePrivateKey = Base64.getDecoder().decode(key);
        RSAPrivateKey rsaPrivateKey =
                (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(decodePrivateKey));
        JWSSigner signer = new RSASSASigner(rsaPrivateKey);
        jwsObject.sign(signer);

        return jwsObject.serialize();
    }

    public String encrypt(String sessionSecretKey, String jws) throws Exception {
        byte[] rawSecretKey = sessionSecretKey.getBytes();
        SecretKey secretKey = new SecretKeySpec(rawSecretKey, "AES");
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");

        cipher.init(
                Cipher.ENCRYPT_MODE,
                secretKey,
                new IvParameterSpec(sessionSecretKey.substring(0, 16).getBytes()));
        byte[] encrypted = cipher.doFinal(jws.getBytes("UTF-8"));

        return Base64.getEncoder().encodeToString(encrypted);
    }

    private String generateSubmitId(String accreditationId) {
        int length = 12;
        char[] uniqueChars = "0123456789abcdef".toCharArray();

        Random random = new Random();
        StringBuffer sb = new StringBuffer(length);

        IntStream.rangeClosed(1, length).forEach(len ->
                sb.append(uniqueChars[random.nextInt(uniqueChars.length)])
        );

        return accreditationId + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + sb;
    }

}