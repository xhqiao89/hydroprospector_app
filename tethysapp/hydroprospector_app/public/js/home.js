var map, click_point_layer, river_layer, basin_layer, snap_point_layer,lake_layer;
var outlet_x, outlet_y, dam_height, interval;
var snappoint_coords, snappoint_x, snappoint_y;
var chart;
var is_running = false;
var dam_height_list, lake_volume_list, lake_geojson_list;

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
        color: '#0F08A6',
        lineDash: [4],
        width: 3
        }),
        fill: new ol.style.Fill({
        color: 'rgba(0, 0, 255, 0.3)'
        })
    })
    });

    lake_layer = new ol.layer.Vector({
    source: new ol.source.Vector({
        features: new ol.format.GeoJSON()
    }),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
        color: '#FF0000',
        lineDash: [0],
        width: 1
        }),
        fill: new ol.style.Fill({
        color: 'rgba(255, 0, 0, 0.5)'
        })
    })
    });

    river_layer = new ol.layer.Tile({
        source: new ol.source.TileWMS({
            //url: 'https://geoserver.byu.edu/arcgis/services/sherry/utah_streams1k/MapServer/WMSServer?',
            url:'https://geoserver.byu.edu/arcgis/services/sherry/dr_streams/MapServer/WMSServer?',
            params: {'LAYERS': '0'},
            crossOrigin: 'anonymous'
        }),
        keyword: 'dr'
    });

    map.addLayer(bing_layer);
    map.addLayer(click_point_layer);
    map.addLayer(snap_point_layer);
    map.addLayer(river_layer);
    map.addLayer(basin_layer);
    map.addLayer(lake_layer);

    // var ylat = 40.1;
    // var xlon = -111.55;
    var ylat = 18.9108;
    var xlon = -70.7500;
    CenterMap(xlon,ylat);
    map.getView().setZoom(8);

    map.on('click', function(evt) {
        var coordinate = evt.coordinate;
        addClickPoint(evt.coordinate);

        outlet_x = coordinate[0];
        outlet_y = coordinate[1];
        // map.getView().setCenter(evt.coordinate);
        // map.getView().setZoom(12);

    });

    //define highchart
    var chart_options = {
		chart: {
			renderTo: 'sc-chart',
			zoomType: 'x'
		},
		loading: {
			labelStyle: {
				top: '45%',
				left: '50%',
				// backgroundImage: 'url("/static/snow_inspector/images/ajax-loader.gif")',
				display: 'block',
				width: '134px',
				height: '100px',
				backgroundColor: '#000'
			}
		},
		title: {
			text: 'Storage Capacity Curve'
		},
		xAxis: {
			type: 'Storage(m3)'
			// min: 0,
			// max: 100
		},
		yAxis: {
			title: {
				text: 'Dam height(m)'
			}
			// min: 0.0,
			// max: 100.0
		},
		legend: {
			enabled: false
		},
                tooltip: {
                    useHTML: true
                },
		plotOptions: {
			series: {
				cursor: 'pointer',
				allowPointSelect: true,
				point: {
					events: {
						click: function (e) {
							// mouse click event
							console.log('You clicked the chart!');
							var selected_dam_height = this.y;
							add_lake_to_map(map, selected_dam_height);
						}
					}
				}
			},
			line: {
				color: Highcharts.getOptions().colors[0],
				marker: {
					radius: 2,
					states: {
                		select: {
                    		fillColor: 'red',
                    		lineWidth: 0,
							radius: 4
                		}
            		}
				},
				lineWidth: 1,
				states: {
					hover: {
						lineWidth: 1
					}
				},
				threshold: null
			}
		},
		series: [{}]
	};

	chart_options.series[0].type = 'line';
	chart_options.series[0].name = 'Dam Height';
	chart = new Highcharts.Chart(chart_options);

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

    if (is_running == true){
        return;
    }

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

    if (is_running == true){
        return;
    }

    lake_layer.getSource().clear();
    basin_layer.getSource().clear();
    snap_point_layer.getSource().clear();
    wd_status.removeClass('success');
    wd_status.removeClass('error');
    wd_waiting_output();
    is_running = true;

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
            wd_status.addClass('success');
            wd_status.html('<em>Success!</em>');

            map.getView().fit(basin_layer.getSource().getExtent(), map.getSize());
            is_running = false;


        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error");
            wd_status.addClass('error');
            wd_status.html('<em>' + errorThrown + '</em>');
            is_running = false;
        }
    });
}

function feature2geojson(myFeature) {
    //Convert an OpenLayers 3 feature to GeoJSON object
    var geojsonformatter = new ol.format.GeoJSON();
    var myGeojson = geojsonformatter.writeFeature(myFeature,{featureProjection:'EPSG:3857', dataProjection:'EPSG:3857'});
    //var myFeature = new ol.Feature(myGeometry);
    return myGeojson;

}

function wd_waiting_output() {
    var wait_text = "<strong>Watershed delineation processing...</strong><br>" +
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src='/static/hydroprospector_app/images/earth_globe.gif'>";
    document.getElementById('wd-status').innerHTML = wait_text;
}

function sc_waiting_output() {
    var wait_text = "<strong>Storage capacity curve calculating ...</strong><br>" +
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src='/static/hydroprospector_app/images/earth_globe.gif'>";
    document.getElementById('sc-status').innerHTML = wait_text;
}

// using jQuery
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');

function run_sc_calc(){

    if (is_running == true){
        return;
    }

    lake_layer.getSource().clear();

    sc_status.removeClass('success');
    sc_status.removeClass('error');
    sc_waiting_output();
    chart.series[0].setData([]);

    dam_height = document.getElementById("damHeight").value;
    dam_height = parseFloat(dam_height);
    interval = document.getElementById("interval").value;
    interval = parseFloat(interval);

    // read snapped point coordinates from snap point layer
    var snappoint_source = snap_point_layer.getSource();
        snappoint_source.forEachFeature(function(feature){
            snappoint_coords = feature.getGeometry().getCoordinates();
        });
    snappoint_x = snappoint_coords.toString().split(',')[0];
    snappoint_y = snappoint_coords.toString().split(',')[1];
    // conver watershed feature in basin layer to geojson
    var watershed_geojson = feature2geojson(basin_layer.getSource().getFeatures()[0]);
    // alert(watershed_geojson);

    //the number of the request currently executed
    var iRequest = 0;

    //create dam height list based on dam_height and interval
    //dam_height_list=[5,10,15,20,25,30,35,40,45,50,55,60];
    dam_height_list=[];
    for(var i=interval; i < dam_height;){
        dam_height_list.push(i);
        i=i+interval;
    }
    dam_height_list.push(dam_height);
    console.log("dam height list:" + dam_height_list);

    lake_geojson_list = [];
    lake_volume_list=[];

    is_running = true;

    // Instead of using a for-loop of ajax calls, the benefit of using recursive calls of ajax is to make sure the results come
    //back in sequence as they were sent.

    function ajax2() {

        $.ajax({
            type: 'POST',
            url: 'run-sc/',
            headers: {"X-CSRFToken": csrftoken},
            dataType:'json',
            data: {
                'outlet_x': snappoint_x,
                'outlet_y': snappoint_y,
                'dam_height':dam_height_list[iRequest],
                'watershed_geojson':watershed_geojson
        },
        success: function (data) {

            //lake_layer.getSource().addFeatures(geojson2feature(data.lake_GEOJSON));
            var lake_volume_str = data.lake_volume;
            var lake_geojson = data.lake_GEOJSON;


            if (iRequest === 0) {
                // set_chart_tooltip(chart, response_data.tile,
                //                       response_data.xpixel,response_data.ypixel);
                console.log("first point")

            }

            var lake_volume=parseFloat(lake_volume_str);

            lake_volume_list.push(lake_volume);
            console.log(lake_volume_list);
            lake_geojson_list.push(lake_geojson);
            //console.log(lake_geojson_list);

            add_data_to_chart(dam_height_list[iRequest], lake_volume, chart);
            add_lake_to_map(map, dam_height_list[iRequest]);

            iRequest++;
            if (iRequest < dam_height_list.length) {
                ajax2();
            }else{
                sc_status.addClass('success');
                sc_status.html('<em>Success!</em>');
                is_running = false;
            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error");
            sc_status.addClass('error');
            sc_status.html('<em>' + errorThrown + '</em>');
            is_running = false;
        }
    });

    }

    ajax2();

}

function add_data_to_chart(dam_height_y, volume_x, myChart) {
	// var n = myChart.series[0].data.length;
	// var beginDate = Date.parse(response_data.query.startdate);
	// for (var i = 0; i < response_data.data.length; i++){
	// 	if (response_data.data[i] !== null) {
    var newPoint = [volume_x, dam_height_y];
    myChart.series[0].addPoint(newPoint);

}

function add_lake_to_map(map, selected_dam_height) {

    lake_layer.getSource().clear();
    console.log("selected dam height is: "+ selected_dam_height);
    var iDamheight = dam_height_list.indexOf(selected_dam_height);
    var selected_lake_geojson = lake_geojson_list[iDamheight];
    //console.log(selected_lake_geojson);

    lake_layer.getSource().addFeatures(geojson2feature(selected_lake_geojson));

}

