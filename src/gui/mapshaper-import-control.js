/* @requires
mapshaper-data-table
mapshaper-zip-reader
mapshaper-progress-message
mapshaper-import
mapshaper-gui-options
*/

// tests if filename is a type that can be used
gui.isReadableFileType = function(filename) {
  return !!MapShaper.guessInputFileType(filename);
};

// @cb function(<FileList>)
function DropControl(cb) {
  var el = El('body');
  el.on('dragleave', ondrag);
  el.on('dragover', ondrag);
  el.on('drop', ondrop);
  function ondrag(e) {
    // blocking drag events enables drop event
    e.preventDefault();
  }
  function ondrop(e) {
    e.preventDefault();
    cb(e.dataTransfer.files);
  }
}

// @el DOM element for select button
// @cb function(<FileList>)
function FileChooser(el, cb) {
  var btn = El(el).on('click', function() {
    input.el.click();
  });
  var input = El('form')
    .addClass('g-file-control').appendTo('body')
    .newChild('input')
    .attr('type', 'file')
    .attr('multiple', 'multiple')
    .on('change', onchange);

  function onchange(e) {
    var files = e.target.files;
    // files may be undefined (e.g. if user presses 'cancel' after a file has been selected)
    if (files) {
      // disable the button while files are being processed
      btn.addClass('selected');
      input.attr('disabled', true);
      cb(files);
      btn.removeClass('selected');
      input.attr('disabled', false);
    }
  }
}

function ImportControl(model) {
  new SimpleButton('#import-buttons .submit-btn').on('click', submitFiles);
  new SimpleButton('#import-buttons .cancel-btn').on('click', cancel);
  var importCount = 0;
  var queuedFiles = [];

  model.addMode('import', turnOn, turnOff);
  new DropControl(receiveFiles);
  new FileChooser('#file-selection-btn', receiveFiles);
  new FileChooser('#import-buttons .add-btn', receiveFiles);
  new FileChooser('#add-file-btn', receiveFiles);
  model.enterMode('import');
  model.on('mode', function(e) {
    // re-open import opts if leaving alert or console modes and nothing has been imported yet
    if (!e.name && importCount === 0) {
      model.enterMode('import');
    }
  });

  function turnOn() {
    if (importCount > 0) {
      El('#import-intro').hide(); // only show intro before first import
    }
    El('#import-options').show();
  }

  function close() {
    El('#import-options').hide();
  }

  function turnOff() {
    El('#fork-me').hide();
    clearFiles();
    close();
  }

  function cancel() {
    if (importCount === 0) {
      clearFiles();
    } else {
      model.clearMode();
    }
  }

  function clearFiles() {
    queuedFiles = [];
    El('#dropped-file-list .file-list').empty();
    El('#dropped-file-list').hide();
  }

  function addFiles(a, b) {
    var index = {};
    return a.concat(b).reduce(function(memo, f) {
      if ((gui.isReadableFileType(f.name) || /\.zip$/i.test(f.name)) &&
          f.name in index === false) {
        index[f.name] = true;
        memo.push(f);
      }
      return memo;
    }, []);
  }

  function showQueuedFiles() {
    var list = El('#dropped-file-list .file-list').empty();
    El('#dropped-file-list').show();
    queuedFiles.forEach(function(f) {
      El('<p>').text(f.name).appendTo(El("#dropped-file-list .file-list"));
    });
  }

  function receiveFiles(files) {
    var prevSize = queuedFiles.length;
    queuedFiles = addFiles(queuedFiles, utils.toArray(files));
    if (queuedFiles.length === 0) return;
    model.enterMode('import');
    if (importCount === 0 && prevSize === 0 && containsImportableFile(queuedFiles)) {
      // if the first batch of files will be imported, process right away
      submitFiles();
    } else {
      showQueuedFiles();
      El('#import-buttons').show();
    }
  }

  // Check if an array of File objects (probably) contains a file that can be imported
  function containsImportableFile(files) {
    return utils.some(files, function(f) {
        var type = MapShaper.guessInputFileType(f.name);
        return type == 'shp' || type == 'json';
    });
  }

  function submitFiles() {
    readFiles(queuedFiles);
    model.clearMode();
  }

  function readFiles(files) {
    // read in alphabetical order, so Shapefiles aren't interleaved
    files.sort(function(a, b) {
      return a.name > b.name ? 1 : -1;
    });
    utils.forEach((files || []), readFile);
  }

  function getImportOpts() {
    var freeform = El('#import-options .advanced-options').node().value,
        opts = gui.parseFreeformOptions(freeform, 'i');
    opts.no_repair = !El("#g-repair-intersections-opt").node().checked;
    opts.auto_snap = !!El("#g-snap-points-opt").node().checked;
    return opts;
  }

  function loadFile(file, cb) {
    var reader = new FileReader(),
        isBinary = MapShaper.isBinaryFile(file.name);
    // no callback on error -- fix?
    reader.onload = function(e) {
      cb(null, reader.result);
    };
    if (isBinary) {
      reader.readAsArrayBuffer(file);
    } else {
      // TODO: improve to handle encodings, etc.
      reader.readAsText(file, 'UTF-8');
    }
  }

  function importFile(file) {
    loadFile(file, function(err, content) {
      var name = file.name;
      var type = MapShaper.guessInputType(name, content);
      if (type == 'shp' || type == 'json') {
        importFileContent(type, name, content);
      } else if (type == 'dbf' || type == 'prj') {
        // merge auxiliary Shapefile files with .shp content
        gui.receiveShapefileComponent(name, content);
      } else {
        console.log("Unexpected file type: " + name + '; ignoring');
      }
    });
  }

  function importFileContent(type, path, content) {
    var importOpts = getImportOpts(),
      size = content.byteLength || content.length, // ArrayBuffer or string
      message = size > 4e7 ? 'Importing' : null, // don't show message if dataset is small
      dataset;

    gui.runWithMessage(
      function proc() {
        importOpts.files = [path]; // TODO: try to remove this
        dataset = MapShaper.importFileContent(content, path, importOpts);
        if (type == 'shp') {
          gui.receiveShapefileComponent(path, dataset);
        }
        dataset.info.no_repair = importOpts.no_repair;
      },
      function done() {
        if (dataset) {
          importCount++;
          model.clearMode();
          model.updated({select: true}, dataset.layers[0], dataset);
        }
      }, message);
  }

  // @file a File object
  function readFile(file) {
    var name = file.name,
        ext = utils.getFileExtension(name).toLowerCase();
    if (ext == 'zip') {
      gui.readZipFile(file, function(err, files) {
        if (err) {
          console.log("Zip file loading failed:");
          throw err;
        }
        readFiles(files);
      });
    } else if (gui.isReadableFileType(name)) {
      importFile(file);
    }
  }
}

// Cache and merge data from Shapefile component files (.prj, .dbf, shp) in
// whatever order they are received in.
//
gui.receiveShapefileComponent = (function() {
  var cache = {};

  function merge() {
    var dataset = cache.shp,
        lyr, info;
    if (dataset) {
      lyr = dataset.layers[0];
      info = dataset.info;
      // only use prj or dbf if the dataset lacks this info
      // (the files could be intended for a future re-import of .shp content)
      if (cache.prj && !info.output_prj) {
        info.input_prj = cache.prj;
      }
      if (cache.dbf && !lyr.data) {
        // TODO: handle unknown encodings interactively
        lyr.data = new ShapefileTable(cache.dbf);
        delete cache.dbf;
        if (lyr.data.size() != lyr.shapes.length) {
          lyr.data = null;
          stop("Different number of records in .shp and .dbf files");
        }
      }
    }
  }

  // @content: imported dataset if .shp, raw file content if other file type
  return function(path, content) {
    var name = utils.getFileBase(path),
        ext = utils.getFileExtension(path).toLowerCase();
    if (name != cache.name) {
      cache = {name: name};
    }
    cache[ext] = content;
    merge();
  };
}());
