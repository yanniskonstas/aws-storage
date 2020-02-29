const express = require("express");
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'})
const fs = require("fs");

const app = express();
const port = 3002;
const DEBUG = false;
const containerName = "vappmedia";

app.get("/video", (req, res) => {

    const videoPath = req.query.path;
    console.log(`Streaming video from path ${containerName}/${videoPath}.`);
    var s3 = new AWS.S3({apiVersion: '2006-03-01'});
    var params = {Bucket: containerName, Key: videoPath};        

    if (DEBUG) {
        AWS.config.getCredentials(function(err) {
            if (err) console.log(err.stack);
            // credentials not loaded
            else {
                console.log("Access key:", AWS.config.credentials.accessKeyId);
                console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
                console.log("Region: ", AWS.config.region);                
            }
        });    

        // Call S3 to list the buckets
        s3.listBuckets(function(err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data.Buckets);
            }
        });
    }

    var s3StreamSize = 0;
    s3.headObject(params, (err, data) => {
        if (err) {
            console.log("Error", err);
        } else {            
            s3StreamSize = data.ContentLength;            
            console.log("Success", s3StreamSize);
        }        
    });
    
    var fileStream = require('fs').createWriteStream(`${VIDEOS_PATH}/temp.mp4`);
    var s3Stream = s3.getObject(params).createReadStream();      

    s3Stream.on('error', function(err) {
        console.error(`Error occurred getting properties for video ${containerName}/${videoPath}.`);
        console.error(err && err.stack || err);
        res.sendStatus(500);
        return;
    });       

    s3Stream.pipe(fileStream).on('error', function(err) {
        // capture any errors that occur when writing data to the file
        console.error('File Stream:', err);
    }).on('close', function() {
        console.log('Done.');
    }); 

    res.writeHead(200, {
         "Content-Length": s3StreamSize,
         "Content-Type": "video/mp4",
     });  
    res.send('good');
    
});

app.get("/test/video", (req, res) => {
    const videoPath = "SampleVideo_1280x720_1mb.mp4";
    console.log(`Streaming video from path ${containerName}/${videoPath}.`);
    var s3 = new AWS.S3({apiVersion: '2006-03-01'});
    var params = {Bucket: containerName, Key: videoPath};    

    var path = "./videos/file.mp4";
    var file = require('fs').createWriteStream(path); 
    s3.getObject(params).createReadStream().pipe(file); 

    fs.stat(path, (err, stats) => {
        if (err) {
            console.error("An error occured");
            res.sendStatus(500);
            return;
        }

        res.writeHead(200, {
            "Content-Length": stats.size,
            "Content-Type": "video/mp4",            
        })

        fs.createReadStream(path).pipe(res);
    });
});

app.listen(port, () => {
    console.log(`Microservice online`);
});