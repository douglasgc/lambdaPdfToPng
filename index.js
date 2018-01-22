var exec = require('child_process').exec;
var tmp = require('tmp');
var fs = require('fs');
var filesource = require('filesource');

var initialized = false;

// Add Ghostscript executables path
var projectPath = __dirname.split("\\");
projectPath.pop();
projectPath = projectPath.join("\\");

exports.ghostscriptPath = projectPath + "\\executables\\ghostScript";

// for linux compability
exports.ghostscriptPath = exports.ghostscriptPath.split("\\").join("/");

exports.convert = function() {
	var filepathOrData = arguments[0];
	var callback = arguments[1];
	var options = {};
	
	var tmpFileCreated = false;
	
	if(arguments[2] != null)
	{
		options = arguments[1];
		callback = arguments[2];
	}
	
	if(!initialized)
	{
		if(!options.useLocalGhostscript)
		{
			process.env.Path += ";" + exports.ghostscriptPath;
		}
		
		initialized = true;
	}
	
	options.quality = options.quality || 100;
	
	filesource.getDataPath(filepathOrData, function(resp){
		if(!resp.success)
		{
			callback(resp);
			return;
		}
		
		// get temporary filepath
		tmp.file({ postfix: ".png" }, function(err, imageFilepath, fd) {
			if(err)
			{
				callback({ success: false, error: "Error getting second temporary filepath: " + err });
				return;
			}// dependencies
var async = require('async');
var AWS = require('aws-sdk');
// Enable ImageMagick integration.
var gm = require('gm').subClass({ imageMagick: true });
var util = require('util');
var pdf2png = require('pdf2png');
pdf2png.ghostscriptPath = "/usr/bin";

// constants
var MAX_WIDTH  = 320;
var MAX_HEIGHT = 320;

// get reference to S3 client 
var s3 = new AWS.S3();

exports.handler = function(event, context) {
  // Read options from the event.
  console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
  var srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey    =
    decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));  
  var isTest = srcBucket.indexOf('-test') >= 0;
  var dstBucket = srcBucket.split('-')[0];
  dstBucket += "-thumbnails";
  if (isTest) {
    dstBucket += '-test';
  }
  var dstKey    = srcKey;

  // Sanity check: validate that source and destination are different buckets.
  if (srcBucket == dstBucket) {
    console.error("Destination bucket must not match source bucket.");
    return;
  }

  // Infer the image type.
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

  // Download the image from S3, transform, and upload to a different S3 bucket.
  async.waterfall([
      function download(next) {
        // Download the image from S3 into a buffer.
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
          // Infer the scaling factor to avoid stretching the image unnaturally.
          var scalingFactor = Math.min(
              MAX_WIDTH / size.width,
              MAX_HEIGHT / size.height
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
        // Stream the transformed image to a different S3 bucket.
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
			
			exec("gs -dQUIET -dPARANOIDSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r" + options.quality + " -dFirstPage=1 -dLastPage=1 -sOutputFile=" + imageFilepath + " " + resp.data, function (error, stdout, stderr) {
				// Remove temp files
				resp.clean();
				
				if(error !== null)
				{
					callback({ success: false, error: "Error converting pdf to png: " + error });
					return;
				}
				
				if(options.returnFilePath)
				{
					callback({ success: true, data: imageFilepath });
					return;
				}
				
				var img = fs.readFileSync(imageFilepath);
				
				// Remove temp file
				fs.unlink(imageFilepath);
				
				callback({ success: true, data: img });
			});
		});
	});
};