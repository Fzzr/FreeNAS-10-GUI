// CONTEXTUAL ACTION CREATORS
// ==========================

"use strict";

import * as TYPES from "./actionTypes";
import * as ELEMENTS from "../constants/ContextualElements";
import * as DOCS from "../docs";

export function requestContext ( element ) {
  return ( dispatch, getState ) => {
    if ( ELEMENTS.hasOwnProperty( element ) ) {
      dispatch(
        { type: TYPES.REQUEST_CONTEXT
        , payload: { activeElement: element }
        }
      );
    } else {
      console.warn( `Could not find element "${ element }"` );
    }
  }
}

export function releaseContext ( element ) {
  return ( dispatch, getState ) => {
    if ( ELEMENTS.hasOwnProperty( element ) ) {
      dispatch(
        { type: TYPES.RELEASE_CONTEXT
        , payload: { toRelease: element }
        }
      );
    } else {
      console.warn( `Could not find element "${ element }"` );
    }
  }
}

export function setDocsSection ( section ) {
  return ( dispatch, getState ) => {
    if ( DOCS.hasOwnProperty( section ) ) {
      dispatch(
        { type: TYPES.SET_DOCS_SECTION
        , payload: { activeDocs: section }
        }
      );
    } else {
      console.warn( `Could not find docs for "${ section }"` );
    }
  }
}

export function unsetDocsSection ( section ) {
  return { type: TYPES.UNSET_DOCS_SECTION };
}
