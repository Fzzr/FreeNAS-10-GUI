// GULPFILE
// ========
// Entry point for the live development environment. Automatically builds and
// transpiles the GUI's source code with inteligent watchers and pipelines.

"use strict";

var gulp        = require( "gulp" );
var path        = require( "path" );
var runSequence = require( "run-sequence" );

var argv = require( "yargs" ).argv;

var prettyPrint = require( "./gulp_common/prettyPrint" );

// Load all independent tasks defined in the gulp_tasks directory, including
// those in subdirectories.
require( "require-dir" )( "./gulp_tasks/", { recurse: true } );

gulp.task( "default", function ( callback ) {
  runSequence( [ "clean", "install-packages" ]
             , "favicons"
             , "serve"
             , "webpack-dev-server"
             , callback
             );
});

gulp.task( "deploy", function ( callback ) {
  if ( !argv.output ) {
    throw new Error( "An --output was not set!" );
    callback();
  }
  prettyPrint.tag( "bgBlue"
                 , "DEPLOY"
                 , "Creating deployment in "
                 + path.join( __dirname, argv.output )
                 );
  runSequence( [ "clean", "install-packages" ]
             , "favicons"
             , [ "package-src"
               , "package-server"
               , "package-node-modules"
               , "package-build"
               ]
             , callback
             );
});
