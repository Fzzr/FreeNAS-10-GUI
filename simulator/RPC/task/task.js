// Tasks RPC Class
// ===============
// Handles task calls for the simulation middleware. Actual tasks are handled
// in their respective namespace classes.

"use strict";

import { EventEmitter } from "events";

class Tasks extends EventEmitter {

  constructor () {
    super();
  }

  query ( system, filter, params ) {
    console.log( "tasks.query is not yet implemented." )
  }

  submit ( system, args, systemChangeCallback ) {

    var taskCall;
    var taskNamespace;
    var secondTaskNamespace;
    var taskNamespaceClass;
    var taskMethod;
    var responseContent;
    var response;

    taskCall = args[0].split( "." );

    taskNamespace = taskCall.shift();

    // This is a filthy thing to do, but it's better than changing things in
    // the GUI that will break when we reunite with the new middleware.
    // Basically, most task and RPC namespaces match, but for zfs volumes, the
    // RPC namespace is "volumes" and the task namespace is "volume"... for only
    // some tasks. Maybe because those calls apply only to one volume at a time?
    if ( taskNamespace === "volume" ) {
      taskNamespace =  "volumes";
    }

    if ( taskCall.length > 1 ) {
      secondTaskNamespace = taskCall.shift;
    }

    taskNamespaceClass =
      new ( require( "../" + taskNamespace + "/" + taskNamespace ) )( system );

    taskMethod = taskCall[0];

    if ( taskNamespaceClass ) {
      if ( secondTaskNamespace ) {
        responseContent =
          taskNamespaceClass[ secondTaskNamespace ][ taskMethod ]( system
                                                                 , args[1] );
      } else {
        responseContent = taskNamespaceClass[ taskMethod ]( system, args[0] );
      }
    }

    if ( !responseContent ) {
      responseContent =
        [ "Task " + args[0] + " failed or is not implemented." ];
    }

    return responseContent;

  }

}


export default Tasks;
