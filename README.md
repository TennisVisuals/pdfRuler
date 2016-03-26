# pdfRuler

pdfRuler is a small set of utilities for working with [pdf2json](https://github.com/modesty/pdf2json)

### functions:
- **pdfRuler.localCacheList()** populates **pdfRuler.files** with filenames found in **pdfRuler.pdfCache** (filters for .pdf extension)
- **pdfRuler.pdf2JSON(*fileName*)** promise wrapper for [pdf2json](https://github.com/modesty/pdf2json)
- **pdfRuler.findCoords(*pdf_json, text, page*)** returns an array of x,y coordinates for page elements with matching text
- **pdfRuler.extractLines(*pdf_json, x_range, y_range, page*)** extracts rows and columns within the target area

### configuration:
- **pdfRuler.pdfCache = "./";**
- **pdfRuler.tolerance = .2;** controls the range within which **extractLines** considers page elements to be part of the same row/column

Please see the attached example.
