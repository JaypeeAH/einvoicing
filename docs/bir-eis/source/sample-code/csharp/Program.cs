using System;

namespace SampleCode
{
    class Program
    {
        static void Main(string[] args)
        {
            // Before executing the program,
            // change the information in the EisCredential class
            // to the credential information suitable for your application.

            var authCaller = new AuthenticationCaller();
            SessionInfo sessionInfo = authCaller.CallAPI();

            string submitId = string.Empty;

            if (sessionInfo != null)
            {
                var issuanceCaller = new InvoiceIssuanceCaller(sessionInfo);
                submitId = issuanceCaller.CallAPI();
            }

            if (!string.IsNullOrEmpty(submitId))
                Console.WriteLine("SubmitID: " + submitId);

            // If the invoice issuance is successful, 
            // You should uncomment the below line after a few minutes.
            // You can check the Invoice Issuance Result.

            //submitId = "207ZfETF-20220624-a0e92264bef3";
            //var inquiryResultCaller = new InquiryResultCaller(sessionInfo, submitId);
            //inquiryResultCaller.CallAPI();
        }
    }
}
