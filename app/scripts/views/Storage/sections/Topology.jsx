// TOPOLOGY DRAWER
// ==============
// A section of the Pool/Volume UI that shows the constituent VDEVs which are
// being used for log, cache, data, and spare.

"use strict";

import React from "react";
import { Row, Col } from "react-bootstrap";

import ZfsUtil from "../utility/ZfsUtil";

import VDEV from "./Topology/VDEV";

export default class Topology extends React.Component {

  renderVdevs ( purpose ) {
    let sharedProps =
      { purpose: purpose
      , newVdevAllowed: false
      , disks: this.props.disks
      , availableDisks: this.props.availableDisks
      , SSDs: this.props.SSDs
      , HDDs: this.props.HDDs
      , availableSSDs: this.props.availableSSDs
      , availableHDDs: this.props.availableHDDs
      };

    switch ( purpose ) {
      case "log":
      case "cache":
        // Log and Cache currently only allow a single VDEV.
        if ( this.props.topology[ purpose ].length === 0 ) {
          sharedProps.newVdevAllowed = true;
        }
        break;

      case "spare":
        if ( this.props.topology[ purpose ].length === 0 ) {
          sharedProps.newVdevAllowed = true;
        }
        break;

      case "data":
      default:
        sharedProps.newVdevAllowed = true;
        break;
    }

    let vdevs = this.props.topology[ purpose ].map(
      ( vdev, index ) => {
        // Destructure vdev to avoid passing in props which will not be used.
        let { children, type, path } = vdev;

        let members = ZfsUtil.getMemberDiskPaths({ type, path, children });

        let allowedTypes = this.props.existsOnClient
                         ? ZfsUtil.getAllowedVdevTypes( members, purpose )
                         : [ type ];

        return (
          <VDEV
            { ...sharedProps }
            allowedTypes = { allowedTypes }
            children     = { children }
            type         = { type }
            path         = { path }
            vdevKey      = { index }
            key          = { index }
            onDiskAdd = { ( path ) =>
              this.props.onDiskAdd( index, purpose, path )
            }
            onDiskRemove = { ( path ) =>
              this.props.onDiskRemove( index, purpose, path )
            }
            onVdevNuke = { () =>
              this.props.onVdevNuke( index, purpose )
            }
            onTypeChange = { () =>
              this.props.onVdevTypeChange( index, purpose )
            }
          />
        );
      }
    );

    if ( ( this.props.existsOnClient && sharedProps.newVdevAllowed )
         || vdevs.length === 0
       ) {
      // If there are available devices, and the category in question allows the
      // creation of more than one VDEV, the user may create as many as they
      // desire. Eventually, through the act of assigning disks, they'll be left
      // with only populated VDEVs. The OR side of this check covers the case in
      // which there are no devices available and no VDEVs of that type in
      // props. There must always be a VDEV in Winterfell, however, even if it's
      // just going to render a message about "you can't do anything with me".
      vdevs.push(
        <VDEV
          { ...sharedProps }
          allowedTypes = { [] }
          type         = { null }
          vdevKey      = { vdevs.length }
          key          = { vdevs.length }
          onDiskAdd = { ( path ) =>
            this.props.onDiskAdd( vdevs.length, purpose, path )
          }
          onDiskRemove = { ( path ) =>
            this.props.onDiskRemove( vdevs.length, purpose, path )
          }
          onVdevNuke = { () =>
            this.props.onVdevNuke( vdevs.length, purpose )
          }
          onTypeChange = { () =>
            this.props.onVdevTypeChange( vdevs.length, purpose )
          }
        />
      );
    }

    return vdevs;
  }

  render () {
    return (
      <div
        style = { this.props.style }
        className = "pool-topology"
      >

        <Row>
          {/* LOG AND CACHE DEVICES */}
          <Col xs={ 6 } className="pool-topology-section">
            <h4 className="pool-topology-header">Cache</h4>
            { this.renderVdevs( "cache" ) }
          </Col>
          <Col xs={ 6 } className="pool-topology-section">
            <h4 className="pool-topology-header">Log</h4>
            { this.renderVdevs( "log" ) }
          </Col>

          {/* STORAGE VDEVS */}
          <Col xs={ 12 } className="pool-topology-section">
            <h4 className="pool-topology-header">Storage</h4>
            { this.renderVdevs( "data" ) }
          </Col>

          {/* SPARE DISKS */}
          <Col xs={ 12 } className="pool-topology-section">
            <h4 className="pool-topology-header">Spares</h4>
            { this.renderVdevs( "spare" ) }
          </Col>
        </Row>
      </div>
    );
  }

}

Topology.propTypes =
  { existsOnServer: React.PropTypes.bool.isRequired
  , existsOnClient: React.PropTypes.bool.isRequired

  , onDiskAdd        : React.PropTypes.func.isRequired
  , onDiskRemove     : React.PropTypes.func.isRequired
  , onVdevNuke       : React.PropTypes.func.isRequired
  , onVdevTypeChange : React.PropTypes.func.isRequired
  , disks: React.PropTypes.object.isRequired
  , availableDisks: React.PropTypes.instanceOf( Set ).isRequired
  , SSDs: React.PropTypes.instanceOf( Set ).isRequired
  , HDDs: React.PropTypes.instanceOf( Set ).isRequired
  , availableSSDs: React.PropTypes.array.isRequired
  , availableHDDs: React.PropTypes.array.isRequired
  , topology: React.PropTypes.shape(
      { data  : React.PropTypes.array.isRequired
      , log   : React.PropTypes.array.isRequired
      , cache : React.PropTypes.array.isRequired
      , spare : React.PropTypes.array.isRequired
      }
    )
  };
