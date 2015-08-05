// Common Volume-related functions
// ===============================
// Class exporting functions to be used across volume-related middleware
// simulator areas.

"use strict";

import _ from "lodash";

const vdevRedundancy =
  { raidz3 : 3
  , raidz2 : 2
  , raidz1 : 1
  // Do not include mirror; it's variable.
  , disk   : 0
  };

class VolumeCommon {

  static getDiskSize ( disks, path ) {
    return _.find( disks, { name: path } )[ "mediasize" ];
  }

  static calculateVolumeSize ( dataVdevs, disks ) {

    var volumeSize = 0;

    var smallestDiskSize = Infinity;
    var vdevSize = 0;

    var i;
    var j;

    _.forEach( dataVdevs
             , function calculateVdevSize ( vdev ) {
               vdevSize = 0;
               // Disk vdevs have only one disk and no children to iterate over.
               if ( vdev.type === "disk" ) {
                 vdevSize = VolumeCommon.getDiskSize( disks, vdev[ "path" ] );
               } else {
                 // Search for the smallest disk
                 for ( i = 0; i < vdev[ "children" ].length; i++ ) {
                   if ( VolumeCommon.getDiskSize( disks
                                   , vdev[ "children" ][ i ][ "path" ]
                                   )
                      < smallestDiskSize
                      ) {
                     smallestDiskSize =
                       VolumeCommon.getDiskSize( disks
                                  , vdev[ "children" ][ i ][ "path" ]
                                  );
                   }
                 }
                 // The size of a mirror vdev is always the size of its smallest
                 // component disk.
                 if ( vdev[ "type" ] === "mirror" ) {
                   vdevSize = smallestDiskSize;
                 } else {
                   // Add the smallest disk size to the vdev size for each disk
                   // over the vdev redundancy level.
                   for ( j = 0
                       ; j < vdev[ "children" ].length
                           - vdevRedundancy[ vdev[ "type" ] ]
                       ; j ++
                       ) {
                     vdevSize += smallestDiskSize;
                   }
                 }
                 volumeSize += vdevSize;
               }
             }
             );

    return volumeSize;

  }
}

export default VolumeCommon;