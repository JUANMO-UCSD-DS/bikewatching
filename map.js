// Import D3 and Mapbox GL JS as ES modules
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// import Mapbox as ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@3.35.0/+esm';
// import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
// console.log("mapbox GL JS loaded:",mapboxgl);

// set mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiajhtbyIsImEiOiJjbXdoN3M1ZmwwMWUzMnpvbnNwZTBza2czIn0.25KmiAs3G6uA6Zv33z9IKg';
// initialize the map


const map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will render
    style: 'mapbox://styles/j8mo/cmwhb14jz00a001sm02x16tpl',
    // 'mapbox://styles/mapbox/streets-v12'
    // Map style
    center: [-71.09415, 42.36027], // [longitude, latitude]
    zoom: 12, // Initial zoom level
    minZoom: 5, // Minimum allowed zoom
    maxZoom: 18, // Maximum allowed zoom
});


const svg = d3.select('#map').select('svg');


function getCoords(station) {
    const point = new mapboxgl.LngLat(station.lon, station.lat);  //convert station coordinates to Mapbox LngLat object 
    const {x,y} = map.project(point); //project to pixel coordinates
    return {cx: x, cy: y};  //return pixel coordinates for SVG circle placement
}

function computeStationTraffic(stations, trips) {  
    const departures = d3.rollup(trips, v => v.length, d => d.start_station_id);
    const arrivals = d3.rollup(trips, v => v.length, d => d.end_station_id);
    return stations.map(station => {
        let id =station.short_name;
        station.arrivals = arrivals.get(id) ?? 0;
        station.departures = departures.get(id) ?? 0;
        station.totalTraffic = station.arrivals + station.departures;
        return station;
    });
}



// format time for display
function formatTime(minutes) {
    const date = new Date(0, 0, 0, 0, minutes); //set hours and minutes based on slider value
    return date.toLocaleTimeString('en-US', { timeStyle: 'short' }); //format as HH:MM AM/PM
}


function minutesSinceMidnight(date) {
    return date.getHours() * 60 + date.getMinutes();
}


function filterTripsByTime(trips, timeFilter) {
        return timeFilter === -1 ? trips // if no filter is applied,return all trips
        : trips.filter(trip => {
            // Convert trip start and end times to minutes since midnight
            const startedMinutes = minutesSinceMidnight(trip.started_at);
            const endedMinutes = minutesSinceMidnight(trip.ended_at);
            //inclued trips that started or ended within 60 minutes of the selected time
            return(
                Math.abs(startedMinutes - timeFilter) <= 60 ||
                Math.abs(endedMinutes - timeFilter) <= 60
            )
        });
    }



map.on('load', async () => {
    // Add Boston bike lanes source
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson',
    });

    //code to add bike lanes layer
    map.addLayer({
        id: 'bike-lanes',
        type: 'line',
        source: 'boston_route',
        paint: {
            'line-color': 'green',
            'line-width': 3,
            'line-opacity': 0.4,},
    });


    // Add Cambridge bike lanes source
    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson',
    });

    // Add Cambridge bike lanes layer
    map.addLayer({
        id: 'cambridge-bike-lanes',
        type: 'line',
        source: 'cambridge_route',
        paint: {
            'line-color': 'green',
            'line-width': 3,
            'line-opacity': 0.4,},
    });

    // Fetch and display station data as SVG circles
    let jsonData;
    try {
        const jsonurl = 'https://dsc-courses.github.io/dsc209r-2025-fa/labs/lab07/data/bluebikes-stations.json';
        // Await JSON fetch
        jsonData = await d3.json(jsonurl);
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }

    const trips = await d3.csv(
            'https://dsc-courses.github.io/dsc209r-2025-fa/labs/lab07/data/bluebikes-traffic-2024-03.csv',
            (trip) => {
                trip.started_at= new Date(trip.started_at);
                trip.ended_at= new Date(trip.ended_at);
                return trip;
                }
        );
    const stations = computeStationTraffic(jsonData.data.stations, trips);


        // function to filter trips based on the selected time
    function updateScatterPlot(timeFilter) {
        // get only the trips that match the selected time filter   
        const filteredTrips = filterTripsByTime(trips, timeFilter);
        // recompute station traffic based on the filtered trips
        const filteredStations = computeStationTraffic(stations, filteredTrips);
        radiusScale.range(timeFilter === -1 ? [0, 25] : [3, 50]);; //reset radius scale to all stations
        // update the scatterplot by adjusting the radius of each circle based on the new traffic data
        circles
            .data(filteredStations,d => d.short_name) // bind the filtered station data to the circles  
            .join('circle')
            .attr('r', d => radiusScale(d.totalTraffic)) // update radius based on new traffic data
            .style('--departure-ratio', d => stationFlow(d.departures / d.totalTraffic)) //set CSS variable for departures ratio 
    }

    // make the time slider active
    const timeSlider = document.getElementById('time-slider');
    const selectedTime  = document.getElementById('selected-time');
    const anyTimeLabel = document.getElementById('any-time');

    // update the displayed time when the slider value changes
    function updateTimeDisplay() {
        timeFilter = Number(timeSlider.value); //get slider value
        if (timeFilter === -1) {
            selectedTime.textContent = ''; //clear time display
            anyTimeLabel.style.display = 'block'; //show "Any Time" label
        } else {
            selectedTime.textContent = formatTime(timeFilter); //display formatted time
            anyTimeLabel.style.display = 'none'; //hide "Any Time" label
        }
        updateScatterPlot(timeFilter); //refresh thescatterplot based on the new time filter   
    }

    // Add SVG circles for each station
    
    // let stations = jsonData.data.stations;
    
    // console.log('Stations Array:', stations);

// calculateing traffic at each station
    // importing traffic data
    // const trips = await d3.csv('https://dsc-courses.github.io/dsc209r-2025-fa/labs/lab07/data/bluebikes-traffic-2024-03.csv');
    // const departures = d3.rollup(trips, v => v.length, d => d.start_station_id);
    // const arrivals = d3.rollup(trips, v => v.length, d => d.end_station_id);
    // stations = stations.map(station => {
    //     let id =station.short_name;
    //     station.arrivals = arrivals.get(id) ?? 0;
    //     station.departures = departures.get(id) ?? 0;
    //     station.totalTraffic = station.arrivals + station.departures;
    //     return station;
    // });

    // size markers according to traffic
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(stations, d => d.totalTraffic)])
        .range([0, 25]); // Adjust the range for desired circle sizes

    let stationFlow = d3.scaleQuantize().domain([0,1]).range([0,0.5,1]);

    // Create SVG circles for each station
    const circles = svg.selectAll('circle')
                .data(stations,(d) => d.short_name)
                .enter()
                .append('circle')
                .attr('r', d => radiusScale(d.totalTraffic)) // radius of the circle
                .attr('fill', 'steelblue') //circl fill color  
                .attr('stroke','white') //circle stroke color
                .attr('stroke-width', 1) //circle stroke width
                .attr('opacity', 0.6) //circle opacity
                .each(function(d) {
                    d3.select(this)
                    .append('title')
                    .text(`${d.totalTraffic} trips at (${d.departures} departures, ${d.arrivals} arrivals)`)        
                })
                .style('--departure-ratio', d => stationFlow(d.departures / d.totalTraffic)) //set CSS variable for departures ratio   

    function updatePositions(){
        circles.attr('cx', d => getCoords(d).cx)  //set circle x position based on station coordinates
                .attr('cy', d => getCoords(d).cy); //set circle y position based on station coordinates
    }

    updatePositions(); //initially update circle positions
    map.on('move', updatePositions); //update circle positions when the map is moved
    map.on('zoom', updatePositions); //update circle positions when the map is zoomed
    map.on('resize', updatePositions); //update circle positions when the map is resized
    map.on('moveend', updatePositions); //final adjustment after map movement ends   


    let timeFilter = -1;
    timeSlider.addEventListener('input', updateTimeDisplay);
    updateTimeDisplay(); //initially update time display
})














