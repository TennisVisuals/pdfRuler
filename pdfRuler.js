!function() { 

   var pdfRuler = {};

   var fs                = require('fs');
   var PDFParser         = require("pdf2json");
   var removeDiacritics  = require('diacritics').remove;

   pdfRuler.files = [];
   pdfRuler.pdfCache = "./";
   pdfRuler.tolerance = .2;

   pdfRuler.localCacheList = localCacheList;
   function localCacheList() {
      var files = fs.readdirSync(pdfRuler.pdfCache);
      pdfRuler.files = files.filter(function(f) { return f.indexOf('DS_Store') < 0 && f.indexOf('un~') < 0; });
   }

   pdfRuler.fetchPDF = fetchPDF;
   function fetchPDF(fileName, callback) {
      if (!pdfRuler.files.length) return;
      var pdfParser = new PDFParser();
      pdfParser.on("pdfParser_dataError", errData => console.error(errData) );
      pdfParser.on("pdfParser_dataReady", pdfData => {
         pJSON = pdfData.data;
         console.log("parsing succeeded");
         if (callback && typeof callback == 'function' ) callback(pJSON);
      });

      fs.readFile(pdfRuler.pdfCache + fileName, function (err, pdfBuffer) {
         if (!err) {
           pdfParser.parseBuffer(pdfBuffer);
         }
      });
   }

   pdfRuler.pdf2JSON = pdf2JSON;
   function pdf2JSON(fileName) {
      var pdfParser = new PDFParser();
      return new Promise(function(resolve, reject) {
         pdfParser.on("pdfParser_dataError", reject);
         pdfParser.on("pdfParser_dataReady", pdfData => { 
            pJSON = pdfData.data;
            resolve(pdfData.data); 
         });

         if (!pdfRuler.files.length) reject();
         fs.readFile(pdfRuler.pdfCache + fileName, function (err, pdfBuffer) {
            if (!err) { 
               pdfParser.parseBuffer(pdfBuffer); 
            } else {
               reject();
            }
         });
      });
   }

   pdfRuler.findCoords = findCoords;
   function findCoords(pdf_json, text, page) {
      var matches = [];
      page = page || 0;
      var texts = pdf_json.Pages[page].Texts;
      for (var t=0; t < texts.length; t++) {
         var value = removeDiacritics(decodeURIComponent(texts[t].R[0].T)).toLowerCase(); 
         if (value.indexOf(text.toLowerCase()) >= 0) {
            matches.push(texts[t]);
         }
      }
      return matches;
   }

   function useRuler(line) {
      var results = [];
      var ranges = [];
      var line_keys = Object.keys(line);
      line_keys.forEach(function(e) {
        var range = [];
        range.push(e.toString());
        line_keys.forEach(function(f) {
           if (f != e && Math.abs(f - e) < pdfRuler.tolerance) range.push(f);
        })

        var dupes = ranges.filter(function(r) {
           return r.indexOf(e) >= 0;
        });
        if (!dupes.length) {
           results.push([]);
           ranges.push(range);
        }
      });
      return { lines: results, ranges: ranges };
   }

   pdfRuler.extractLines = extractLines;
   function extractLines(pdf_json, x_range, y_range, page) {
      page = page || 0;
      x_range = x_range || { min: 0, max: 100 };
      y_range = y_range || { min: 0, max: 100 };
      var xr = {};
      var yr = {};

      pdf_json.Pages[page].Texts.forEach(function(e) { 
         if (e.y >= y_range.min && e.y <= y_range.max && 
             e.x >= x_range.min && e.x <= x_range.max) 
         {
            xr[e.x] = xr[e.x] ? xr[e.x] + 1 : 1; 
            yr[e.y] = yr[e.y] ? yr[e.y] + 1 : 1; 
         }
      });

      var lines_x = useRuler(xr);
      var lines_y = useRuler(yr);
      lines_x.ranges.sort(function(a, b) { return Math.min.apply(null, a) - Math.min.apply(null, b) });
      lines_y.ranges.sort(function(a, b) { return Math.min.apply(null, a) - Math.min.apply(null, b) });

      pdf_json.Pages[page].Texts.forEach(function(e) { 
         var range_x;
         for (var r=0; r < lines_x.ranges.length; r++) { 
            if (lines_x.ranges[r].indexOf(e.x.toString()) >= 0) {
               range_x = r;
               break; 
            }
         }
         if (range_x < lines_x.ranges.length && e.y >= y_range.min && e.y <= y_range.max) {

            var row;
            lines_y.ranges.forEach((c, i) => { if (c.indexOf(e.y.toString()) >= 0) row = i; });

            lines_x.lines[range_x].push({ 
               value: removeDiacritics(decodeURIComponent(e.R[0].T)), 
               flag: e.R[0].TS[2], 
               y: e.y, 
               row: row 
            });
         }

         var range_y;
         for (var r=0; r < lines_y.ranges.length; r++) { 
            if (lines_y.ranges[r].indexOf(e.y.toString()) >= 0) {
               range_y = r;
               break; 
            }
         }
         if (range_y < lines_y.ranges.length && e.x >= x_range.min && e.x <= x_range.max) {
            var column;
            lines_x.ranges.forEach((c, i) => { if (c.indexOf(e.x.toString()) >= 0) column = i; });

            lines_y.lines[range_y].push({ 
               value: removeDiacritics(decodeURIComponent(e.R[0].T)), 
               flag: e.R[0].TS[2], 
               x: e.x, 
               column: column 
            });
         }
      });
      
      lines_x.lines.forEach(l => l.sort(function(a, b) { return a.y - b.y; }));
      lines_y.lines.forEach(l => l.sort(function(a, b) { return a.y - b.y; }));

      return { columns: lines_x.lines, rows: lines_y.lines };
   }

   if (typeof define === "function" && define.amd) define(pdfRuler); else if (typeof module === "object" && module.exports) module.exports = pdfRuler;
   this.pdfRuler = pdfRuler;
 
}();
