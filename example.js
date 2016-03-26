p = require("./pdfRuler");
p.pdf2JSON("draw.pdf").then(pdf_json => {
   var tolerance = .2;
   p.tolerance = tolerance;

   // identify anchor objects
   var draw_header               = p.findCoords(pdf_json, 'Prezime');
   var last_draw_details_column  = p.findCoords(pdf_json, 'Klub');
   var footnote_header           = p.findCoords(pdf_json, 'Rang-lista')
   var tournament_details        = p.findCoords(pdf_json, 'Datum turnira');

   // sort items matching header criteria based on y-axis
   draw_header = draw_header.sort((a, b) => a.y - b.y);

   // specify boundaries of target area
   x_range = { 
      min: 0, 
      max: last_draw_details_column[0].x + tolerance 
   };

   y_range = { 
      min: draw_header[0].y + tolerance, 
      max: footnote_header[0].y - tolerance 
   };

   // extract rows and columns from target area
   draw_box = p.extractLines(pdf_json, x_range, y_range);

   // only interested in rows that have more than one item
   draw_details = draw_box.rows.filter(r => r.length > 1);

   players = draw_details.map(m => m.filter(f => f.column == 3)).map(m => m[0].value)
   console.log(players);

   y_range = { 
      min: tournament_details[0].y - tolerance, 
      max: draw_header[0].y - tolerance 
   };

   header = p.extractLines(pdf_json, undefined, y_range);

   console.log('headings:', header.rows[0].map(m => m.value));
   console.log('values::',  header.rows[1].map(m => m.value));

}, function(err) {
   console.log(err);
});

