# Bikewatching

Bikewatching is an interactive map of the Boston and Cambridge bike network. It displays bike lanes alongside Bluebikes stations, with station-circle size representing trip activity and color representing the balance of departures and arrivals.

## Features

- Pan and zoom around the map and its bike-lane overlays.
- Use the time slider to show trips that started or ended within one hour of the selected time. The default **any time** setting shows all trips.
- Hover over a station marker to see its total trips, departures, and arrivals.
- Compare station traffic using the legend: blue indicates more departures, orange indicates more arrivals, and intermediate colors indicate a more balanced flow.

## Run locally

This project is a static web app and does not require a build step or package installation. Because it uses JavaScript modules and fetches remote data, serve the project directory over HTTP rather than opening `index.html` directly. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in a browser with an internet connection.

## Data and map

The app loads data at runtime from these sources:

- Bluebikes station information and March 2024 trip records: [DSC 209R course data](https://dsc-courses.github.io/dsc209r-2025-fa/labs/lab07/data/)
- Boston bike network: [Boston Open Data](https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson)
- Cambridge bike facilities: [Cambridge GIS data](https://github.com/cambridgegis/cambridgegis_data)
- Basemap: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

The app imports D3.js and Mapbox GL JS as browser modules from jsDelivr. The basemap and remote data therefore require internet access; map rendering also depends on the Mapbox access token configured in `map.js`.

## Project files

- `index.html` — page structure and time-filter controls.
- `map.js` — map setup, data loading, station markers, and time filtering.
- `map.css` and `global.css` — map and page styles.
- `Existing_Bike_Network_2022 (1).geojson` — a local copy of Boston's 2022 bike network data.
