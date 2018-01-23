// Dependencias
var async = require('async');
var AWS = require('aws-sdk');
var gm = require('gm').subClass({ imageMagick: true });
var util = require('util');
var pdf2png = require('pdf2png');
pdf2png.ghostscriptPath = "/usr/bin";



var s3 = new AWS.S3();


exports.handler = function(event, context) {

  var srcBucket = event.Records[0].s3.bucket.name;
  var srcKey    =
    decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));  
  var isTest = srcBucket.indexOf('-test') >= 0;
  var dstBucket = srcBucket.split('-')[0];
  dstBucket += "-thumbnails";
  if (isTest) {
    dstBucket += '-test';
  }
  var dstKey    = srcKey;

  if (srcBucket == dstBucket) {
    console.error("Destination bucket must not match source bucket.");
    return;
  }

  var typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.error('unable to infer image type for key ' + srcKey);
    return;
  }
  var imageType = typeMatch[1].toLowerCase();
  if (imageType != "jpg" && imageType != "png" && imageType != "pdf") {
    console.log('skipping non-image ' + srcKey);
    return;
  }

  async.waterfall([
      function download(next) {
        s3.getObject({
          Bucket: srcBucket,
          Key: srcKey
        },
        next);
      },
      function transform(response, next) {
        if (imageType == "pdf") {
          pdf2png.convert(response.Body, function(resp) {
            if (!resp.success) {
              next(resp.error);
              return;
            }
            next(null, "image/png", resp.data);
          });
        } else {

        gm(response.Body).size(function(err, size) {
          var scalingFactor = Math.min(
              size.width,
              size.height
              );
          var width  = scalingFactor * size.width;
          var height = scalingFactor * size.height;

          // Transform the image buffer in memory.
          this.resize(width, height)
            .toBuffer(imageType, function(err, buffer) {
              if (err) {
                next(err);
              } else {
                next(null, response.ContentType, buffer);
              }
            });
        });
}
      },
      function upload(contentType, data, next) {
        var ext = '';
        if (imageType == "pdf") {
          ext = '.png';
          dstBucket = srcBucket;
        }

        s3.putObject({
          Bucket: dstBucket,
          Key: dstKey + ext,
          Body: data,
          ContentType: contentType,
          ACL:'public-read'
        },
        next);
      }
    ], function (err) {
      if (err) {
        console.error(
            'Unable to resize ' + srcBucket + '/' + srcKey +
            ' and upload to ' + dstBucket + '/' + dstKey +
            ' due to an error: ' + err
            );
      } else {
        console.log(
            'Successfully resized ' + srcBucket + '/' + srcKey +
            ' and uploaded to ' + dstBucket + '/' + dstKey
          );
      }

      context.done();
    }
  );
};  