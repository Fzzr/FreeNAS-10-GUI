// ZFS POOLS AND VOLUMES - STORAGE
// ===============================
// This view is defined by vertical stripes in the Storage page. It contains
// depictions of all active pools, pools which have not yet been imported, and
// also the ability to create a new storage pool. The boot pool is explicitly
// excluded from this view.

"use strict";

import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Motion, spring } from "react-motion";

// ACTIONS
import * as CONTEXTUAL from "../actions/contextual";
import * as ELEMENTS from "../constants/ContextualElements";
import * as DISKS from "../actions/disks";
import * as VOLUMES from "../actions/volumes";
import * as SHARES from "../actions/shares";
import * as SUBSCRIPTIONS from "../actions/subscriptions";
import * as USERS from "../actions/users";
import * as GROUPS from "../actions/groups";

// UTILITY
import { ghost, ghostUpdate } from "../utility/motions";
import VolumeUtilities from "../utility/VolumeUtilities";

// COMPONENTS
import HelpButton from "../components/HelpButton";
import ConfirmationDialog from "../components/ConfirmationDialog";
import CreateStorage from "./Storage/CreateStorage";
import Volume from "./Storage/Volume";


// STYLESHEET
if ( process.env.BROWSER ) require( "./Storage.less" );


// REACT
class Storage extends React.Component {

  constructor( props ) {
    super( props );

    this.displayName = "Storage";
  }

  componentDidMount () {
    this.props.subscribe( this.displayName );

    this.props.fetchData();
  }

  componentWillUnmount () {
    this.props.unsubscribe( this.displayName );

    this.props.cleanup();
  }

  componentDidUpdate () {
    // FIXME: Oh god, it burns, it burrrrns
    this.props.fetchAvailableDisksIfNeeded()
  }

  // RENDER METHODS
  renderVolumes ( ALL_VOLUMES ) {
    const { volumes } = this.props;

    const VOLUME_IDS = Object.keys( ALL_VOLUMES );
    const ALL_SHARES =
      Object.assign( {}
                   , this.props.shares.serverShares
                   , this.props.shares.clientShares
                   );
    const NESTED_SHARES = VolumeUtilities.getNestedSharesByVolume( ALL_SHARES );

    return VOLUME_IDS.map( ( id, index ) => {
      const { datasets, shares, ...volumeData } = ALL_VOLUMES[ id ];

      return (
        <Volume
          { ...volumeData }
          key = { index }
          active = { id === volumes.activeVolume }
          existsOnServer = { Boolean( volumes.serverVolumes[ id ] ) }
          existsOnClient = { Boolean( volumes.clientVolumes[ id ] ) }

          onDiskSelect = { this.props.onDiskSelect.bind( this, id ) }
          onDiskDeselect = { this.props.onDiskDeselect.bind( this, id ) }

          // DATASETS AND SHARES
          shares = { this.props.shares }
          volumeShares = { NESTED_SHARES[ volumeData.name ] }
          datasets = { VolumeUtilities.normalizeDatasets( datasets ) }
          rootDataset = { VolumeUtilities.getRootDataset( datasets, volumeData.name ) }

          // ACCOUNTS (for share permissions)
          users = { this.props.users }
          groups = { this.props.groups }

          // DISKS
          disks = { this.props.disks }
          availableDisks = { this.props.availableDisks }
          SSDs = { this.props.SSDs }
          HDDs = { this.props.HDDs }
          availableSSDs = { this.props.availableSSDs }
          availableHDDs = { this.props.availableHDDs }

          // VOLUMES
          onUpdateVolume = { this.props.onUpdateVolume.bind( this, id ) }
          onRevertVolume = { this.props.onRevertVolume.bind( this, id ) }
          onSubmitVolume = { this.props.onSubmitVolume.bind( this, id ) }
          onRequestDestroyVolume = { this.props.onRequestDestroyVolume.bind( this, id ) }

          // SHARES
          onUpdateShare = { this.props.onUpdateShare.bind( this, id ) }
          onRevertShare = { this.props.onRevertShare.bind( this, id ) }
          onSubmitShare = { this.props.onSubmitShare.bind( this, id ) }
          onRequestDeleteShare = { this.props.onRequestDeleteShare.bind( this, id ) }

          // GUI
          onFocusVolume = { this.props.onFocusVolume.bind( this, id ) }
          onFocusShare = { this.props.onFocusShare.bind( this, id ) }
          onBlurShare = { this.props.onBlurShare.bind( this, id ) }
          onBlurVolume = { this.props.onBlurVolume.bind( this, id ) }
          onToggleShareFocus = { this.props.onToggleShareFocus.bind( this, id ) }
        />
      );
    });
  }

  render () {
    const SERVER_VOLUMES_EXIST =
      Boolean( Object.keys( this.props.volumes.serverVolumes ).length );
    const CLIENT_VOLUMES_EXIST =
      Boolean( Object.keys( this.props.volumes.clientVolumes ).length );
    const ALL_VOLUMES =
      Object.assign( {}, this.props.volumes.serverVolumes, this.props.volumes.clientVolumes );

    const LOADING = Boolean( this.props.volumes.volumesRequests.size );
    const SHOW_INTRO = !LOADING && !SERVER_VOLUMES_EXIST && !CLIENT_VOLUMES_EXIST;
    // In the case that no volumes are being edited or created, and disks are
    // available for inclusion in a new pool, the user has the option to
    // create a new pool.
    const SHOW_NEW = !LOADING && !CLIENT_VOLUMES_EXIST && this.props.availableDisks.size;

    const VOLUME_TO_DESTROY = (
      ( this.props.volumeToDestroy && ALL_VOLUMES[ this.props.volumeToDestroy ] )
      ? ALL_VOLUMES[ this.props.volumeToDestroy ].name
      : ""
    );

    const SHARE_TO_DELETE = (
      ( this.props.shareToDelete && this.props.shares.serverShares[ this.props.shareToDelete ] )
      ? this.props.shares.serverShares[ this.props.shareToDelete ].name
      : ""
    );

    return (
      <main>
        <h1 className="view-header section-heading type-line">
          <span className="text">Storage</span>
          <HelpButton
            className = "pull-right"
            docs = "STORAGE_GENERAL"
            activeDocs = { this.props.contextual.activeDocs }
            requestDocs = { this.props.requestDocs }
            releaseDocs = { this.props.releaseDocs }
          />
        </h1>

        {/* LOADING SPINNER */}
        <Motion
          defaultStyle = { LOADING ? ghost.defaultIn : ghost.defaultOut }
          style        = { LOADING ? ghost.in : ghost.out }
        >
          { ({ y, opacity }) =>
            <h1
              className = "text-center"
              style = { ghost.update( y, opacity ) }
            >
              LOADING VOLUMES
            </h1>
          }
        </Motion>


        {/* INTRODUCTORY MESSAGE */}
        <Motion
          defaultStyle = { SHOW_INTRO ? ghost.defaultIn : ghost.defaultOut }
          style        = { SHOW_INTRO ? ghost.in : ghost.out }
        >
          { ({ y, opacity }) =>
            <div
              className = "clearfix storage-first-pool"
              style = { ghost.update( y, opacity ) }
            >
              <img src="/images/hdd.png" />
              <h3>Create Storage</h3>
              <p>
                { "Click the \"Create new storage pool\" button to format your disks into a storage pool."}
              </p>
              <p>
                { "Click the \"?\" icon to learn more about storage pools."}
              </p>
            </div>
          }
        </Motion>


        {/* VOLUMES */}
        { this.renderVolumes( ALL_VOLUMES ) }


        {/* CREATE NEW POOL */}
        <CreateStorage
          style = { SHOW_NEW ? {} : { display: "none" } }
          onClick = { this.props.onInitNewVolume }
        />


        {/* CONFIRMATION - POOL DESTRUCTION */}
        <ConfirmationDialog
          show = { Boolean( this.props.volumeToDestroy ) }
          onCancel = { this.props.onCancelDestroyVolume }
          onConfirm = { this.props.onConfirmDestroyVolume }
          confirmStyle = { "danger" }
          title = { "Confirm Destruction of " + VOLUME_TO_DESTROY }
          body = {
            <span>
              { "Bro are you like, really really sure you want to do this? "
              + "Once you destroy "}<b>{ VOLUME_TO_DESTROY }</b>{" "
              + "it's not coming back. (In other words, I hope you backed up "
              + "your porn.)"
              }
            </span>
          }
          cancel = { "Uhhh no" }
          confirm = { "Blow my pool up fam" }
        />


        {/* CONFIRMATION - SHARE DELETION */}
        <ConfirmationDialog
          show = { Boolean( SHARE_TO_DELETE ) }
          onCancel = { this.props.onCancelDeleteShare }
          onConfirm = { this.props.onConfirmDeleteShare }
          confirmStyle = { "danger" }
          title = { `Confirm Deletion of ${ SHARE_TO_DELETE }` }
          body = {
            <span>
              { `Yo this is going to delete ${ SHARE_TO_DELETE } . All `
              + `the data that was in it will go bye-bye, and nobody will be `
              + `able to access it anymore. You sure that's what you want?`
              }
            </span>
          }
          cancel = { "MY BABY" }
          confirm = { "I didn't like that share anyways" }
        />

      </main>
    );
  }

}

Storage.propTypes =
  { volumes: React.PropTypes.object
  , disks: React.PropTypes.object
  , tasks: React.PropTypes.object

  , SSDs: React.PropTypes.instanceOf( Set ).isRequired
  , HDDs: React.PropTypes.instanceOf( Set ).isRequired

  // SUBSCRIPTIONS
  , subscribe: React.PropTypes.func.isRequired
  , unsubscribe: React.PropTypes.func.isRequired

  // REQUESTS
  , fetchData: React.PropTypes.func.isRequired

  // HANDLERS
  , onConfirmDestroyVolume: React.PropTypes.func.isRequired
  , onCancelDestroyVolume: React.PropTypes.func.isRequired
  , onConfirmDeleteShare: React.PropTypes.func.isRequired
  , onCancelDeleteShare: React.PropTypes.func.isRequired
  };


// REDUX
const SUB_MASKS =
  [ "entity-subscriber.volumes.changed"
  , "entity-subscriber.disks.changed"
  , "entity-subscriber.shares.changed"
  , "entity-subscriber.users.changed"
  , "entity-subscriber.groups.changed"
  ];

function mapStateToProps ( state ) {
  return (
    { disks: state.disks.disks
    , volumes: state.volumes
    , volumeToDestroy: state.volumes.volumeToDestroy
    , shares: state.shares
    , shareToDelete: state.shares.shareToDelete
    , activeTasks: state.volumes.activeTasks
    , tasks: state.tasks.tasks
    , contextual: state.contextual
    , availableDisks: state.volumes.availableDisks
    , SSDs: state.disks.SSDs
    , HDDs: state.disks.HDDs
    , availableSSDs:
      Array.from( state.disks.SSDs )
           .filter( path => state.volumes.availableDisks.has( path ) )
    , availableHDDs:
      Array.from( state.disks.HDDs )
           .filter( path => state.volumes.availableDisks.has( path ) )
    , users: state.users.users
    , groups: state.groups.groups
    }
  );
}

function mapDispatchToProps ( dispatch ) {
  return (
    // SUBSCRIPTIONS
    { subscribe: ( id ) =>
      dispatch( SUBSCRIPTIONS.add( SUB_MASKS, id ) )
    , unsubscribe: ( id ) =>
      dispatch( SUBSCRIPTIONS.remove( SUB_MASKS, id ) )

    // INITIAL DATA REQUEST
    , fetchData: () => {
        dispatch( DISKS.requestDiskOverview() )
        dispatch( VOLUMES.fetchVolumes() )
        dispatch( VOLUMES.fetchAvailableDisks() )
        dispatch( SHARES.fetchShares() )
        dispatch( USERS.requestUsers() )
        dispatch( GROUPS.requestGroups () )
      }

    , cleanup: () => {
        dispatch( CONTEXTUAL.releaseContext( ELEMENTS.CONTEXTUAL_DOCUMENTATION ) );
        dispatch( CONTEXTUAL.releaseContext( ELEMENTS.TOPOLOGY_EDIT_CONTEXT ) );
      }

    // DOCS
    , requestDocs: ( section ) => {
        dispatch( CONTEXTUAL.setDocsSection( section ) );
        dispatch( CONTEXTUAL.requestContext( ELEMENTS.CONTEXTUAL_DOCUMENTATION ) );
      }
    , releaseDocs: ( section ) => {
        dispatch( CONTEXTUAL.unsetDocsSection( section ) );
        dispatch( CONTEXTUAL.releaseContext( ELEMENTS.CONTEXTUAL_DOCUMENTATION ) );
      }

    // FIXME: *wet farting noises*
    , fetchAvailableDisksIfNeeded: () =>
      dispatch( VOLUMES.fetchAvailableDisksIfNeeded() )

    // MODIFY VOLUME ON GUI
    , onInitNewVolume: () => {
        dispatch( VOLUMES.initNewVolume() );
        dispatch( CONTEXTUAL.requestContext( ELEMENTS.TOPOLOGY_EDIT_CONTEXT ) );
      }
    , onUpdateVolume: ( volumeID, patch ) =>
      dispatch( VOLUMES.updateVolume( volumeID, patch ) )
    , onRevertVolume: ( volumeID ) =>
      dispatch( VOLUMES.revertVolume( volumeID ) )

    // SUBMIT VOLUME
    , onSubmitVolume: ( volumeID ) =>
      dispatch( VOLUMES.submitVolume( volumeID ) )

    // DESTROY VOLUME
    , onRequestDestroyVolume: ( volumeID ) =>
      dispatch( VOLUMES.intendDestroyVolume( volumeID ) )
    , onConfirmDestroyVolume: () =>
      dispatch( VOLUMES.confirmDestroyVolume() )
    , onCancelDestroyVolume: () =>
      dispatch( VOLUMES.cancelDestroyVolume() )

    // CREATE SHARE
    , onUpdateShare: ( volumeID, shareID, patch ) =>
      dispatch( SHARES.updateShare( volumeID, shareID, patch ) )
    , onRevertShare: ( volumeID, shareID ) =>
      dispatch( SHARES.revertShare( volumeID, shareID ) )
    , onSubmitShare: ( volumeID, shareID ) => {
        dispatch( SHARES.submitShare( volumeID, shareID ) );
        dispatch( CONTEXTUAL.releaseContext( ELEMENTS.TOPOLOGY_EDIT_CONTEXT ) );
      }

    // DELETE SHARE
    , onRequestDeleteShare: ( volumeID, shareID ) =>
      dispatch( SHARES.intendDeleteShare( volumeID, shareID ) )
    , onConfirmDeleteShare: ( volumeID ) =>
      dispatch( SHARES.confirmDeleteShare( volumeID ) )
    , onCancelDeleteShare: ( volumeID ) =>
      dispatch( SHARES.cancelDeleteShare( volumeID ) )

    // GUI
    , onDiskSelect: ( volumeID, path ) =>
      dispatch( VOLUMES.selectDisk( volumeID, path ) )
    , onDiskDeselect: ( volumeID, path ) =>
      dispatch( VOLUMES.deselectDisk( volumeID, path ) )
    , onFocusShare: ( volumeID, shareID ) =>
      dispatch( SHARES.focusShare( volumeID, shareID ) )
    , onBlurShare: ( volumeID, shareID ) =>
      dispatch( SHARES.blurShare( volumeID, shareID ) )
    , onFocusVolume: ( volumeID ) => {
        dispatch( VOLUMES.focusVolume( volumeID ) );
      }
    , onBlurVolume: ( volumeID ) => {
        dispatch( VOLUMES.blurVolume( volumeID ) );
        dispatch( CONTEXTUAL.releaseContext( ELEMENTS.TOPOLOGY_EDIT_CONTEXT ) );
      }
    , onToggleShareFocus: ( volumeID ) => console.log( "fart" )
    }
  );
}

export default connect( mapStateToProps, mapDispatchToProps )( Storage );
