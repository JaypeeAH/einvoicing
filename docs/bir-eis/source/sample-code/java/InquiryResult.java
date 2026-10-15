package com.sample.eis;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.HttpClients;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class InquiryResult {
    // Set Your Authentication Token - Result of Authentication API
    private final String AUTH_TOKEN = "YOUR_AUTH_TOKEN";
    // Set Your Session Secret Key - Result of Authentication API
    private final String SESSION_SECRET_KEY = "YOUR_SESSION_SECRET_KEY";

    // Set Application Information
    // Set EIS Certification Number
    private final String ACCREDITATION_ID ="YOUR_EIS_CERT_NUMBER";
    // Set Your Application ID
    private final String APPLICATION_ID ="YOUR_APPLICATION_ID";

    public HttpResponse send(String submitId) throws Exception {
        String url = "https://eis-cert.bir.gov.ph/api/invoice_result/" + submitId;
        String api = "/api/invoice_result/" + submitId;

        HttpClient httpClient = HttpClients.createDefault();

        // Set Request URL
        HttpGet httpGet = new HttpGet(url);

        // Set Request Header
        String dateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));    // Asia/Manila
        httpGet.addHeader("datetime", dateTime);

        String hmac = new Hmac().generate(SESSION_SECRET_KEY, dateTime, httpGet.getMethod(), api);
        httpGet.addHeader("authorization", hmac);

        httpGet.addHeader("authToken", AUTH_TOKEN);
        httpGet.addHeader("accreditationId", ACCREDITATION_ID);
        httpGet.addHeader("applicationId", APPLICATION_ID);
        httpGet.addHeader("Content-Type", "application/json; charset=utf-8");

        return httpClient.execute(httpGet);
    }
}