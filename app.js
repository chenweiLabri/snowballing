var request = require('request');
const XmlReader = require('xml-reader');
const xmlQuery = require('xml-query');
var scrape = require('website-scraper');
var fs=require('fs');
var jsonfile = require('jsonfile');
const stringifyObject = require('stringify-object');
var json = require('json');
var cheerio = require('cheerio');
var http = require("http");
var https = require("https");
var scholar = require('google-scholar')
const doesInclude = require('does-include');
const replaceString = require('replace-string');
var split = require('split-string');
var xmlTojson = require('fast-xml-parser');


//var document_title = 'A Concept for Generating Simplified RESTful Interfaces';
//var document_title = 'A Conversation Based Approach for Modeling REST APIs';
//var document_title = 'Adaptive matchmaking for RESTful services based on hRESTS and MicroWSMO';
//var writeFilePath = 'Documents/research copy 2/'+ document_title+'.json';//write file path



var originalFile = 'Documents/snowballingpapers.json';
//var originalFile = 'Documents2/module2.json';
getAllRefs(originalFile);



//getReferencesIEEEpartnum(document_title);
//googleScholarSearch1(document_title);

//getACM(document_title);

//getScopusReferencesTitles(document_title);
// saveScopusReferencesTitles(document_title,writeFilePath);


function getAllRefs(originalFile){
  //get all the references of the papers and save as json 
  var papers = [];  
  getOriginalTitles(originalFile,function(papers){
    if(papers){
      console.log(papers.length);
      for(var item in papers){
        var original_title = papers[item];
        //googleScholarSearch(original_title); //change to google scholar as main
        //console.log(papers);
        isExist(original_title); 
      }
    }

  });  
}

//get the original titles of the papers of snowballing(first input)
function getOriginalTitles(originalFile,callback) {
  fs.exists(originalFile, function(exists) {
    //console.log(exists);
    if(exists){
      var result=JSON.parse(fs.readFileSync(originalFile));
      var origianlPapers = [];
      for (var item in result) {
        origianlPapers[item] = result[item].title;   
      }
      callback(origianlPapers);
    }
  });  
}



// Utility function that downloads a URL and invokes
// callback with the data.
//https and http 
function download(url, callback) {
  if(doesInclude(url, ['eh', 'https:'])){
    https.get(url, function(res) {
      //console.log('HTTPS'+url);
      var data = "";
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on("end", function() {
        callback(data);
      });
    }).on("error", function() {
      callback(null);
    });
  }else{
    http.get(url, function(res) {
      //console.log(url);
      var data = "";
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on("end", function() {
        callback(data);
      });
    }).on("error", function() {
      callback(null);
    });
  }
  
}

var excludeSpecial = function(s) {
    // 去掉转义字符
    s = s.replace(/[\'\"\\\/\b\f\n\r\t]/g, '');
    // 去掉特殊字符
    //s = s.replace(/[\@\#\$\%\^\&\*\(\)\{\}\:\"\L\<\>\?\[\]]/);
    return s;
 };

// IEEE get partnum of references, the num is helpful to get references
function getReferencesIEEEpartnum(document_title,filename) {
  //var filename = writeFilePath;
  //var urlIEEE = 'http://ieeexplore.ieee.org/gateway/ipsSearch.jsp?ti='+ document_title;
  // body...
  request('http://ieeexplore.ieee.org/gateway/ipsSearch.jsp?ti='+ document_title, function (error, response, body) {
    const ast = XmlReader.parseSync(body);
    const xq = xmlQuery(ast);
    var partnum = xmlQuery(ast).find("partnum").text();
    console.log(partnum);

    var refURL = 'http://ieeexplore.ieee.org/rest/document/'+ partnum +'/references';
    //var filename = json.new('Documents/research/'+ document_title+'.json');    
    getReferencesIEEE(refURL,filename);
  });
}

function getReferencesIEEE(refURL, filename){  
  request(refURL, function (error, response, body) {
    //console.log(body);
    //get references of a paer in json type
    if(body){
      fs.writeFileSync(filename, body);
      fs.exists(filename, function(exists) {
        if(exists){          
          var result=JSON.parse(fs.readFileSync(filename));
          var references = result.references;
          var refs = [];

          for (var item in references) {
            refs[item] = references[item].title;
            //console.log(references[item].title);
          }
          //console.log(refs);
          if(refs.length>0){
            var temp = JSON.stringify(refs);
            fs.writeFileSync(filename, temp);//only writes the references of the paper
          }          
        }
      }); 
    }
  }); 
}

function isExist(document_title){
  var filename = 'Documents/research/'+ document_title+'.json';//file exist
  var writeFilePath = 'Documents/research/'+ document_title+'.json';//write file path

  fs.exists(filename, function(exists) {
    if(exists){

      // fs.readFileSync(filename, function(err, content) {
      //   var resJson;
       
      //   if (err) { 
      //     //throw err; 
      //     console.log(err);
      //   }
       
      //   resJson = JSON.parse(content);
      //   if (resJson === undefined){
      //     console.log(resJson);
      //   }
      // });
      

    }else{
      //search the references in other database

      // var filenameCopy = 'Documents/research copy/'+ document_title+'.json';//file exist
      // fs.exists(filenameCopy,function(exists){
      //   if(!exists){
      //     //try IEEE 
      //     getReferencesIEEEpartnum(document_title,writeFilePath);
      //   }
      // });

      getReferencesIEEEpartnum(document_title,writeFilePath);
      
      //try acm 
      getACM(document_title,writeFilePath);

      //try scopus
      saveScopusReferencesTitles(document_title,writeFilePath);

      writeSprLinkRefs(document_title,writeFilePath);
      //console.log(document_title);

      
    }


  });  

 

}



//ACM DL 
function getACM(document_title,writeFilePath){  
  getACMrefs(document_title,function(jsonStr){
    if(jsonStr){
      //console.log(jsonStr);
      //fs.writeFileSync(writeFilePath, jsonStr);
      var temp = JSON.stringify(jsonStr);
      fs.writeFileSync(writeFilePath, temp);
    }
  });
}

function getACMrefs(document_title,callback){
  var num = searchACMnum(document_title,function(num){
    if(num){
      //console.log(num);
      //var url = "http://dl.acm.org/tab_references.cfm?id="+num;
      request("http://dl.acm.org/tab_references.cfm?id="+num, function (error, response, body) {

        if (body) {
          var html = body.toString();
          //console.log(html);
          var $ = cheerio.load(html);
          var jsonStr = [];
          $("tr").each(function(i, e) {
           var link = $(this).children('td').eq(2).children('div').children('a');
           var refs = link.html();
           if(refs!=null){
             jsonStr[i] = excludeSpecial(refs);//if not null,             
           }
           //jsonStr.push(refs);
          }); //$ div each end
          callback(jsonStr);
        }
        else console.log("error"); 
      });
    }
  });
}

function searchACMnum(document_title,callback){
  //var url = "http://dl.acm.org/results.cfm?query=" + document_title;
  request("http://dl.acm.org/results.cfm?query=" + document_title, function (error, response, body) {
    if (body) {
      //console.log(data);
      var html = body.toString();
      //console.log(html);
      var $ = cheerio.load(html);
      console.log($("div .title>a").length);
      //console.log($(".details").eq(0));
      var link = $("div .title>a").eq(0);
      //console.log(link);
      var title = link.html();//search result title upper and low word
      var Linkhref = link.attr("href");
      var titleLower = title;
      if(title){
        titleLower = title.toLowerCase();
      }      
      var document_titleLower = document_title.toLowerCase();
      
      if(doesInclude(document_titleLower, ['eh', titleLower])){
        //console.log(title);
        //console.log(Linkhref);
        var tempNum = split(Linkhref, '=')[1]; //citation.cfm?id=2488181&CFID=926303072&CFTOKEN=25690034
        var num = split(tempNum,'&')[0];
        //console.log(num);
        callback(num);//var urlRef = "http://dl.acm.org/tab_references.cfm?id="+num;
      }      
    }
    else console.log("error"); 
  });
  
}



//scopus
function doesJSONincludeStr(jsonData,subStr){
  //input the jsonData, get if jsonData include the subStr; true or false
  var str = JSON.stringify(jsonData);
  if(str){
    var include = doesInclude(str, ['eh', subStr]);
    return include;
  }
}

function getScopusID(document_title,callback){
  // var url = 'http://api.elsevier.com/content/search/scopus/application/json?APIKey=96c59901c2da751a143c63d0f5e16c18&query=TITLE('+ document_title+')';
  //var url = 'http://api.elsevier.com/content/search/scopus/?APIKey=96c59901c2da751a143c63d0f5e16c18&query=TITLE('+ document_title+')';
  request('http://api.elsevier.com/content/search/scopus/application/json?APIKey=96c59901c2da751a143c63d0f5e16c18&query=TITLE('+ document_title+')', function (error, response, body) {
    //console.log(body);
    if(doesInclude(body, ['eh', 'search-results'])){
      if(doesJSONincludeStr(body['search-results'],'entry')){
        if(doesJSONincludeStr(body['search-results']['entry'][0],'eid')){

          var resultJson=JSON.parse(body);
          var eid = resultJson['search-results']['entry'][0]['eid'];
          // var resultJson = xml_json(body);
          // console.log(resultJson);
          // var eid = resultJson['search-results']['entry'][0]['eid'];
          
          //var id = split(eid, '-')[2];
          console.log(eid);
          callback(eid);

        }
      }
      //console.log(body);
    }
    else{
      console.log('can not get eid');
      //console.log(body);
      console.log(document_title);
      
      callback(null);
    }    
  });
}

function getScopusReferencesTitles(document_title,callback){
  getScopusID(document_title,function(eid){
    if(eid){
      //console.log(eid);
      //var url = 'https://api.elsevier.com/content/abstract/eid/'+eid+'?apiKey=96c59901c2da751a143c63d0f5e16c18'
      
      request('https://api.elsevier.com/content/abstract/eid/'+eid+'?apiKey=96c59901c2da751a143c63d0f5e16c18', function (error, response, body) {
        //console.log(body);
        if(body){
          if(doesInclude(body, ['eh', 'RESOURCE_NOT_FOUND'])){
            //console.log(body);
          }else{
            //console.log("right value");
            if(doesInclude(body, ['eh', 'abstracts-retrieval-response'])){
              var bodyJson = xml_json(body);
              var testStr = bodyJson['abstracts-retrieval-response'];
              var referencesJson = null;

              if(doesJSONincludeStr(testStr,'item')){
                if(doesJSONincludeStr(testStr['item'], 'bibrecord')){
                  if(doesJSONincludeStr(testStr['item']['bibrecord'], 'tail')){
                    if(doesJSONincludeStr(testStr['item']['bibrecord']['tail'], 'bibliography')){
                      if(doesJSONincludeStr(testStr['item']['bibrecord']['tail']['bibliography'], 'reference')){
                        referencesJson = bodyJson['abstracts-retrieval-response']['item']['bibrecord']['tail']['bibliography']['reference'];
                      }
                    }
                  }
                }
              }              
              //console.log(bodyJson);
              //var referencesJson = bodyJson['abstracts-retrieval-response']['item']['bibrecord']['tail']['bibliography']['reference'];
              //console.log(referencesJson.length);
              var titles = [];
              for(var item in referencesJson){
                var refStr = JSON.stringify(referencesJson[item]);
                if(refStr){
                  if(doesInclude(refStr, ['eh', 'ref-title'])){
                    titles[item] = referencesJson[item]['ref-info']['ref-title']['ref-titletext'];
                  }else{
                    titles[item] = null;
                  }
                }              
                //console.log(titles[item]);
              }
              //console.log(titles);
              callback(titles);
            }                    
          }
        }        
      });
    }
  });
}

function saveScopusReferencesTitles(document_title,writeFilePath){
  getScopusReferencesTitles(document_title,function(jsonStr){
    console.log(jsonStr);
    if(jsonStr.length>0){
      var temp = JSON.stringify(jsonStr);
      fs.writeFileSync(writeFilePath, temp);
    }
  }); 
}

function xml_json(xmlData){
  //input xml data, then get the json data
  var jsonObj = null;
  var options = {
    attrPrefix : "@_",
    textNodeName : "#text",
    ignoreNonTextNodeAttr : true,
    ignoreTextNodeAttr : true,
    ignoreNameSpace : true
  };  
  //Intermediate obj 
  var tObj = xmlTojson.getTraversalObj(xmlData,options);
  var jsonObj = xmlTojson.convertToJson(tObj);
  return jsonObj;
}


//springer link
//search title to find a paper
//document_title = 'An Approach to Enable Replacement of SOAP Services and REST Services in Lightweight Processes';
//var url = 'http://api.springer.com/meta/v1/pam?q=title:'+document_title+'&api_key=f2a1dfe80497f3b2ebc1a744a2e23392';
// var url = 'http://link.springer.com/search?query='+document_title;
// //var url = 'http://api.springer.com/metadata/json?q='+ document_title +'&api_key=f2a1dfe80497f3b2ebc1a744a2e23392';
// request(url, function (error, response, body) {
//   console.log(url);
//   //console.log('error:', error); // Print the error if one occurred 
//   //console.log('body:', JSON.parse(body)); // Print the results
//   console.log(body);
// });

function writeSprLinkRefs(document_title, writeFilePath){
  getSprLinkRefs(document_title,function(refs){
    if(refs.length>0){
      console.log(refs);
      var temp = JSON.stringify(refs);
      fs.writeFileSync(writeFilePath, temp);
    }
  });
}

function getSprLinkRefs(document_title,callback){
  getSprUrl(document_title,function(url){
    if(url){
      download(url, function(data) {
        //console.log(data);
        var html = data.toString();
        //console.log(html);
        var $ = cheerio.load(html);
        var result = $(".BibliographyWrapper").children('li');
        var references = [];
        result.each(function(i, e) {
          references[i] = $(this).children('div').eq(1).text();          
        });
        callback(references);        
      });      
    }
  });  
}

function getSprUrl(document_title, callback){
  download('http://link.springer.com/search?query='+document_title, function(data) {
    if (data) {
      var html = data.toString();
      //console.log(html);
      var $ = cheerio.load(html);
      var link = $("#results-list>li").eq(0).children('h2').children('a');
      //var li = resultsList('li');
      var href = link.attr("href");
      var titleResult = link.html();
      //console.log(document_title);
      //console.log(titleResult);
      if(titleResult!=null){
        var titleResultLower = titleResult.toLowerCase().toString();
        var document_titleLower = document_title.toLowerCase().toString();
        //console.log(titleResultLower);
        //console.log(document_titleLower);
        var urlRef = null;

        if(doesInclude(titleResultLower, ['eh', document_titleLower])||doesInclude(titleResultLower, ['eh', document_titleLower])){
          urlRef = 'http://link.springer.com'+href;         
        }
        callback(urlRef);
      }      
      
    }
    else console.log("error"); 
  });
}

