var map, click_point_layer, river_layer, basin_layer, snap_point_layer;
var outlet_x, outlet_y, dam_height, interval;

var wd_status = $('#wd-status');
var sc_status = $('#sc-status');

$(document).ready(function () {

    map = new ol.Map({
	layers: [ ],
	controls: ol.control.defaults(),
	target: 'map',
	view: new ol.View({
		zoom: 8,
        projection: "EPSG:3857"
	})
    });

    bing_layer = new ol.layer.Tile({
		source: new ol.source.BingMaps({
			imagerySet: 'AerialWithLabels',
			key: 'SFpNe1Al6IDxInoiI7Ta~LX-BVFN0fbUpmO4hIUm3ZA~AsJ3XqhA_0XVG1SUun4_ibqrBVYJ1XaYJdYUuHGqVCPOM71cx-3FS2FzCJCa2vIh'
		})
	});

    // river_layer = new ol.layer.Vector({
    //     source: new ol.source.Vector({
    //       url: "/static/watershed_delineation_app/kml/streams_1k_vect.kml",
    //       format: new ol.format.KML(),
    //      })
    //   });

    click_point_layer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#ffcc33',
          width: 2
        }),
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: '#ffcc33'
          })
        })
      })
    });

    snap_point_layer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#00ff00',
          width: 2
        }),
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: '#00ff00'
          })
        })
      })
    });

    basin_layer = new ol.layer.Vector({
    source: new ol.source.Vector({
        features: new ol.format.GeoJSON()
    }),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
        color: 'blue',
        lineDash: [4],
        width: 3
        }),
        fill: new ol.style.Fill({
        color: 'rgba(0, 0, 255, 0.1)'
        })
    })
    });

    map.addLayer(bing_layer);

    map.addLayer(click_point_layer);
    //map.addLayer(river_layer);
    map.addLayer(basin_layer);
    map.addLayer(snap_point_layer);

    var ylat = 40.1;
    var xlon = -111.55;
    CenterMap(xlon,ylat);
    map.getView().setZoom(10);

    map.on('click', function(evt) {
        var coordinate = evt.coordinate;
        addClickPoint(evt.coordinate);

        outlet_x = coordinate[0];
        outlet_y = coordinate[1];
        run_wd_calc(outlet_x,outlet_y);
        // map.getView().setCenter(evt.coordinate);
        // map.getView().setZoom(14);

    })

});

function CenterMap(xlon,ylat){
    var dbPoint = {
        "type": "Point",
        "coordinates": [xlon, ylat]
    };
    var coords = ol.proj.transform(dbPoint.coordinates, 'EPSG:4326','EPSG:3857');
    map.getView().setCenter(coords);
}

function addClickPoint(coordinates){
    // Check if the feature exists. If not then create it.
    // If it does exist, then just change its geometry to the new coords.
    var geometry = new ol.geom.Point(coordinates);
    if (click_point_layer.getSource().getFeatures().length==0){
        var feature = new ol.Feature({
            geometry: geometry,
            attr: 'Some Property'
        });
        click_point_layer.getSource().addFeature(feature);
    } else {
        click_point_layer.getSource().getFeatures()[0].setGeometry(geometry);
    }
}

function geojson2feature(myGeoJSON) {
    //Convert GeoJSON object into an OpenLayers 3 feature.
    var geojsonformatter = new ol.format.GeoJSON();
    var myFeature = geojsonformatter.readFeatures(myGeoJSON);
    //var myFeature = new ol.Feature(myGeometry);
    return myFeature;

}

function run_wd_calc(xlon, ylat){

    basin_layer.getSource().clear();
    snap_point_layer.getSource().clear();
    wd_status.removeClass('success');
    wd_status.removeClass('error');
    wd_waiting_output();

    $.ajax({
        type: 'GET',
        url: 'run-wd',
        dataType:'json',
        data: {
                'xlon': outlet_x,
                'ylat': outlet_y
        },
        success: function (data) {

            basin_layer.getSource().addFeatures(geojson2feature(data.watershed_GEOJSON));
            snap_point_layer.getSource().addFeatures(geojson2feature(data.snappoint_GEOJSON));
            // wd_status.removeClass('calculating');
            wd_status.addClass('success');
            wd_status.html('<em>Success!</em>');

            map.getView().fit(basin_layer.getSource().getExtent(), map.getSize())


        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error");
            // wd_status.removeClass('calculating');
            wd_status.addClass('error');
            wd_status.html('<em>' + errorThrown + '</em>');
        }
    });
}

function run_sc_calc(xlon, ylat){

    sc_status.removeClass('success');
    sc_status.removeClass('error');
    sc_waiting_output();

    // $.ajax({
    //     type: 'GET',
    //     url: 'run-sc',
    //     dataType:'json',
    //     data: {
    //             'xlon': outlet_x,
    //             'ylat': outlet_y
    //     },
    //     success: function (data) {
    //
    //         basin_layer.getSource().addFeatures(geojson2feature(data.watershed_GEOJSON));
    //         snap_point_layer.getSource().addFeatures(geojson2feature(data.snappoint_GEOJSON));
    //         // wd_status.removeClass('calculating');
    //         wd_status.addClass('success');
    //         wd_status.html('<em>Success!</em>');
    //
    //         map.getView().fit(basin_layer.getSource().getExtent(), map.getSize())
    //
    //
    //     },
    //     error: function (jqXHR, textStatus, errorThrown) {
    //         alert("Error");
    //         // wd_status.removeClass('calculating');
    //         wd_status.addClass('error');
    //         wd_status.html('<em>' + errorThrown + '</em>');
    //     }
    // });
}

function wd_waiting_output() {
    var wait_text = "<strong>Watershed delineation processing...</strong><br>" +
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src='/static/hydroprospector_app/images/earth_globe.gif'>";
    document.getElementById('wd-status').innerHTML = wait_text;
}

function sc_waiting_output() {
    var wait_text = "<strong>Storage capacity curve calculating ...</strong><br>" +
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src='/static/hydroprospector_app/images/earth_globe.gif'>";
    document.getElementById('wd-status').innerHTML = wait_text;
}

