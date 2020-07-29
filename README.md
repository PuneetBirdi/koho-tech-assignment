### Running Script

```
// node solution.js
```

Please note: if you run this multiple times using the same input, the function will continue to compare against the overall history, changing the results and likely rejecting more of them with each run as all customers will start to hit limits.

For a fresh run every time please delete history.txt before running again.

### Application Assumptions

1.  In order to evaluate loads, there must be a historical datastore of accepted transactions to compare against. This will be done with a writeStream to history.txt.

2.  Each load is provided by line in a .txt file. In order to evaluate values it must be converted to JSON.

    - After doing some research I chose to use a readStream and writeStream because of scalability: If the dataset gets much larger, the application would be limited by resources. If I were to load in transaction history, input and output to arrays before writing to a file I'd likely be limited by memory usage after a certain file size.
    - Streaming data may lead to slower performance but won't run into a memory limit.

3.  The history.txt datastore will be formatted exactly as input is provided, in lines. Storing as JSON would allow for easier evaluation but I'm doing this for file consistency.

4.  No third-party libraries.

### Naming

1. The incoming load will be refered to as 'load', until load_amount is converted to a float and time is converted to a Date object. From there it will be refered to as 'transaction'.
2. Existing historical transactions will be referred to as 'record'.

### Submission

My solution isn't working completely correctly but I've identified some issues that may help me debug:

1. Line alignment was off from example output: this may be due to a duplicate entry not being ignored properly, causing file comparison to show more errors even if responses is correct

2. I think at some point the asynchronicity of one of the functions may have caused responses being returned in the improper order:

   For example:

   ```
   //EXPECTED OUTPUT
   line 31: {"id":"21336","customer_id":"477","accepted":true}
   line 32: {"id":"27940","customer_id":"120","accepted":false}
   line 33: {"id":"7843","customer_id":"35","accepted":false}

   //MY OUPUT:
   line 31: {"id":"27940","customer_id":"120","accepted":false}
   line 32: {"id":"21336","customer_id":"477","accepted":true}
   line 33: {"id":"7843","customer_id":"35","accepted":false}

   //Lines 31 and 32 seem to be switched in my output even though the responses are the same.
   //Also, the the following response (line 33) is unaffected.

   ```

Overall, I'm disappointed I couldn't get it to work correctly but I learned a lot while completing this assignment about streaming and comparing dates. Using history.txt as a datastore added complexity but if you run the script multiple times with the same input it will continue to validate against history so more loads will be rejected as customers hit limits.

### Process Flow Diagram

![processMap](/processFlow.png)
