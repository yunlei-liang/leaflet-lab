/* Lab 1 java script by Yunlei Liang, 2019 */


//function to instantiate the Leaflet map

function createMap(){
    //create the map
    var map = L.map('map', {
        center: [40,-93],
        zoom: 4
    });
	
	
    //add OSM base tilelayer
   L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' +'<br>Data sources: United States Census Bureau <br> Creator: Yunlei Liang'
    }).addTo(map);

	
	//initial map with the proportional symbol map
    getDataProp(map);

	
	//create the map title
	createTitle(map);   

};

//add the title to the map
function createTitle(map){
	//add a new control to the map to show the text content
    var TitleControl = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'title-container');
			
			//specify the title content
			var content = "Spending in Education in USA by state from 1983 to 2018";

			//replace legend content
			$(container).append(content);
			
			//disable click inside the container
			L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new TitleControl());

};



//Popup constructor function
function Popup(properties, attribute, layer, radius){
    this.properties = properties;
    this.attribute = attribute;
    this.layer = layer;
    this.year = attribute.split("g")[1];
    this.spending = this.properties[attribute];
    this.content = "<p><b>State:</b> " + this.properties.name + "</p><p><b>Education Spending in " + this.year + ":</b> " + this.spending + " billion $US</p>";

    this.bindToLayer = function(){
        this.layer.bindPopup(this.content, {
            offset: new L.Point(0,-radius)
        });
    };
};


//specify the color based on a give value
function getColor(d) {
    return d > 100 ? '#800026' :
           d > 75 ? '#BD0026' :
           d > 50  ? '#E31A1C' :
           d > 30  ? '#FC4E2A' :
           d > 20 ? '#FD8D3C' :
           d > 10  ? '#FEB24C' :
           d > 5  ? '#FED976' :
                     '#FFEDA0';
}

//a customized function to style the new feature 
function style(feature, attributes){

	var attribute = attributes[0];
   
    return {
        fillColor: getColor(feature.properties[attribute]),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}


//a customized function for each feature in the polygon of the choropleth map
function onEachFeature(feature,attributes,layer){

	var attribute = attributes[0];		
	var popupContent = "<p><b>State:</b> " + feature.properties.name + "</p>";
	
	var year = attribute.split("g")[1];
    popupContent += "<p><b>Education Spending in " + year + ":</b> " + feature.properties[attribute] + " billion $US</p>";
	
	layer.bindPopup(popupContent);
	
    layer.on({
        click: function(){
			this.openPopup();
		}
    });

}



//create the choropleth map
function createChoropleth(response, map, attributes){
	
    //create a Leaflet GeoJSON layer
    var geojson1 = L.geoJson(response, {
		onEachFeature: function(feature,layer){
			return onEachFeature(feature,attributes,layer)
		},
		style: function (feature) {		
			return style(feature, attributes);			
		}
    });

	//generate the legend for the choropleth map
	var legend1 = L.control({position: 'topleft'});

	legend1.onAdd = function (map) {

		var div = L.DomUtil.create('div', 'info legend'),
			grades = [0, 5, 10, 20, 30, 50, 75, 100],
			labels = [];
			
		var content = "Spending in Education ($US billion)<br>";
		$(div).append(content);

		// loop through our density intervals and generate a label with a colored square for each interval
		for (var i = 0; i < grades.length; i++) {
			div.innerHTML +=
				'<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
				grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
		}			

		return div;
	};
	legend1.addTo(map);	
	
	//return the geojson layer for display
	return geojson1;

};



//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 15;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    //check
    //console.log(attribute);
    
    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

	//create new popup
	var popup = new Popup(feature.properties, attribute, layer, options.radius);

	//add popup to circle marker
	popup.bindToLayer();
	   
	//event listeners to open popup on hover
    layer.on({
        /*mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },*/
		click: function(){
            this.openPopup();
        }
	
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


//Add circle markers for point features to the map
function createPropSymbols(response, map, attributes){
    //create a Leaflet GeoJSON layer
    var geojson2;
	geojson2 = L.geoJson(response, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    });
	
	return geojson2;
};


//build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Spending") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};


//generate the choropleth map data and the two layer control
function getDataChoro(map,geojson2){
    //load the data
	var geojson1;
    $.ajax("data/PolygonData.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);
			//get the generated map layer
			geojson1 = createChoropleth(response, map, attributes);
            
			//create a overlay of two map layers
			var overlay = {
				"Proportional Map": geojson2,
				"Choropleth Map": geojson1
			};			
			L.control.layers(overlay).addTo(map);
        }
    });
	
};

//generate the proportional symbol map
function getDataProp(map){
    //load the data
    $.ajax("data/Data.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);	
			
			//get the generated map layer
			geojson2 = createPropSymbols(response, map, attributes);
			
			//add the layer to map	
			geojson2.addTo(map);
			
			//create the sequence control
			createSequenceControls(map, attributes);
			
			//generate the choropleth map
			getDataChoro(map,geojson2);
			
			//create the legend for the proportional symbol map
			createLegend(map, attributes);
        }
    });
	
};

//create the legend for the proportional symbol map
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="60px">';
            
			var circles = {
				max: 20,
				mean: 40,
				min: 60
			};

			//loop to add each circle and text to svg string
			for (var circle in circles){
				//circle string
				svg += '<circle class="legend-circle" id="' + circle + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';

				//text string
				svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
			};
			//close svg string
			svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
	updateLegend(map, attributes[0]);
};

//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("g")[1];
    var content = "Spending in " + year;

    //replace legend content
    $('#temporal-legend').html(content);

    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
	
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 59 - radius,
            r: radius
        });
        
        //Step 4: add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " billion $US");
    };
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};



//Create new sequence controls
function createSequenceControls(map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
			
	           //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());


    //set slider attributes
    $('.range-slider').attr({
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });
    
    //Step 5: input listener for slider
    $('.range-slider').on('input', function(){
        //Step 6: get the new index value
		var index = $(this).val();
		updateChoropleth(map, attributes[index]);	
		updatePropSymbols(map, attributes[index]);		
    });
    
};


//Recolor polygons according to new attribute values
function updateChoropleth(map,attribute){
	map.eachLayer(function(layer){
		if (layer.feature && layer.feature.properties[attribute]){
			//access feature properties
			var props = layer.feature.properties;

			//update each feature's color based on new attribute values
			layer.setStyle({
				fillColor: getColor(props[attribute]),
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.7
			});

			//add state to popup content string
			var popupContent = "<p><b>State:</b> " + props.name + "</p>";

			//add formatted attribute to panel content string
			var year = attribute.split("g")[1];
			popupContent += "<p><b>Education Spending in " + year + ":</b> " + props[attribute] + " billion $US</p>";

			//replace the layer popup
			layer.bindPopup(popupContent);
		};
	});
};



//Resize proportional symbols according to new attribute values
function updatePropSymbols(map,attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
			var props = layer.feature.properties;
			var popup = new Popup(props, attribute, layer, radius);

			//add popup to circle marker
			popup.bindToLayer();

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            layer.setStyle({
				fillColor: "#ff7800",
				color: "#000",
				weight: 1,
				opacity: 1,
				dashArray: '0',
				fillOpacity: 0.8
			});


            //create new popups
			createPopup(props, attribute, layer, radius);
        };
    });
	
	updateLegend(map, attribute);
};

function createPopup(properties, attribute, layer, radius){
    //add state to popup content string
    var popupContent = "<p><b>State:</b> " + properties.name + "</p>";

    //add formatted attribute to panel content string
    var year = attribute.split("g")[1];
    popupContent += "<p><b>Spending in " + year + ":</b> " + properties[attribute] + " billion $US</p>";

    //replace the layer popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
    });
};




$(document).ready(createMap);

