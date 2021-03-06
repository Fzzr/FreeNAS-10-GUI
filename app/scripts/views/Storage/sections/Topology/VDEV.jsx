// VDEV
// ====
// A simple wrapper component for representing a single VDEV.

"use strict";

import React from "react";
import { Well, Col } from "react-bootstrap";

import ZfsUtil from "../../utility/ZfsUtil";

import Disk from "../../../../components/items/Disk";
import DragTarget from "../../../../components/DragTarget";
import DropTarget from "../../../../components/DropTarget";
import VDEVInfo from "./VDEV/VDEVInfo";
import BreakdownChart from "../../common/BreakdownChart";

const REQUIRE_SSDS =
  { "data"  : false
  , "log"   : true
  , "cache" : true
  , "spare" : false
  };

export default class VDEV extends React.Component {

  constructor ( props ) {
    super( props );

    this.displayName = "VDEV";
  }

  createDiskItem ( path, key ) {
    let content;
    let mutable = this.props.availableDisks.has( path );

    let disk = (
      <Disk disk = { this.props.disks[ path ] } />
    );

    if ( mutable ) {
      content = (
        <DragTarget
          namespace = "disk"
          payload = { path }
          callback = { this.props.onDiskRemove.bind( null, path ) }
        >
          { disk }
          <span
            className = "disk-remove"
            onClick = { this.props.onDiskRemove.bind( null, path ) }
            onMouseDown = { event => event.stopPropagation() }
          />
        </DragTarget>
      );
    } else {
      content = disk;
    }

    return (
      <div
        className="disk-wrapper"
        key = { key }
      >
        { content }
      </div>
    );
  }

  render () {
    const DEVICES_AVAILABLE =
      Boolean( REQUIRE_SSDS[ this.props.purpose ]
             ? this.props.availableSSDs.length
             : this.props.availableHDDs.length
             );

    let toolbar   = null;
    let vdevDisks = null;
    let addDisks  = null;
    let message   = null;

    if ( this.props.type === "disk" ) {
      // "Disk" is an unusual case in the sense that it will have no children
      // and "path" will be defined at the top level. Much of the complexity
      // in this component has to do with transitioning back and forth from
      // "disk" to other layouts.
      vdevDisks = this.createDiskItem( this.props.path, 0 );
    } else if ( this.props.type ) {
      vdevDisks = this.props.children.map( ( diskVdev, index ) => {
        return this.createDiskItem( diskVdev.path, index );
      });
    }

    // DISPLAY LOGIC
    // Rather than trying to split this up into a verbose logic tree, each
    // potential display component in VDEV has its own condition for display.

    // TOOLBAR
    // We want to see the toolbar anytime the VDEV is capable of displaying
    // disks. This means that we should see if when there are disks available or
    // disks have already been added (this.props.type will have a string value)
    // "Spares" should not show the bar, as it will always be a collection of
    // "disk" VDEVs
    if ( this.props.purpose !== "spare"
       && ( DEVICES_AVAILABLE || this.props.type )
       ) {
      let breakdown;
      let chart = null;

      if ( this.props.purpose === "data"
        && ( this.props.path || this.props.children )
        ) {
        breakdown = ZfsUtil.calculateBreakdown( [ this.props ], this.props.disks );
        chart = (
          <BreakdownChart
            total  = { breakdown.avail + breakdown.parity }
            parity = { breakdown.parity }
            used   = { 0 }
            free   = { breakdown.avail }
          />
        );
      }

      toolbar = (
        <VDEVInfo
          type = { this.props.type }
          allowedTypes = { this.props.allowedTypes }
          onTypeChange = { this.props.onTypeChange }
          onVdevNuke = { this.props.onVdevNuke }
        >
          { chart }
        </VDEVInfo>
      );
    }

    // ADD DISKS
    // FIXME: Right now, you can add disks if they're available.
    // TODO: Make this not a dropdown
    if ( DEVICES_AVAILABLE && !vdevDisks ) {
      addDisks = (
        <h5 className="text-center text-muted">
          { `Drag and drop ${ REQUIRE_SSDS[ this.props.purpose ] ? "SSDs" : "disks" } to add `
          + `${ this.props.purpose }`
          }
        </h5>
      );
    }

    // NO AVAILABLE DEVICES MESSAGE
    // There are no available devices, and nothing has been added to the VDEV
    // already - it's empty and nothing can be added.
    if ( !DEVICES_AVAILABLE && !vdevDisks ) {
      message = (
        <div className="text-center pool-vdev-message">
          { `No available ${ this.props.purpose } devices.` }
        </div>
      );
    }

    return (
      <Col xs={ 12 }>
        <DropTarget
          namespace = "disk"
          disabled = { DEVICES_AVAILABLE }
          preventDrop = { ( payload ) =>
            REQUIRE_SSDS[ this.props.purpose ] && this.props.SSDs.has( payload )
          }
          callback = { this.props.onDiskAdd }
          activeDrop
        >
          <Well className="clearfix vdev-bucket">
            { toolbar }
            { vdevDisks }
            { addDisks }
            { message }
          </Well>
        </DropTarget>
      </Col>
    );
  }

}

VDEV.propTypes =
  { onDiskAdd: React.PropTypes.func.isRequired
  , onDiskRemove: React.PropTypes.func.isRequired
  , onVdevNuke: React.PropTypes.func.isRequired
  , onTypeChange: React.PropTypes.func.isRequired
  , disks: React.PropTypes.object.isRequired
  , availableDisks: React.PropTypes.instanceOf( Set ).isRequired
  , SSDs: React.PropTypes.instanceOf( Set ).isRequired
  , HDDs: React.PropTypes.instanceOf( Set ).isRequired
  , availableSSDs: React.PropTypes.array.isRequired
  , availableHDDs: React.PropTypes.array.isRequired
  , children: React.PropTypes.array
  , path: React.PropTypes.string
  , purpose: React.PropTypes.oneOf(
      [ "data"
      , "log"
      , "cache"
      , "spare"
      ]
    ).isRequired
  , type: React.PropTypes.oneOf(
      // null is used for new vdevs. Such a vdev should have a falsy path, no
      // children, and a falsy existsOnServer.
      [ null
      , "disk"
      , "stripe"
      , "mirror"
      , "raidz1"
      , "raidz2"
      , "raidz3"
      ]
    )
  };
