var request = require('request');

var document_titile = "A comparison of SOAP and REST implementations of a service based interaction independence middleware framework";
request('http://ieeexplore.ieee.org/gateway/ipsSearch.jsp?ti='+ document_titile, function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred 
  //console.log('response:', response); // Print the response
  console.log('body:', body); // Print the results
});

