import React, { useEffect } from 'react';
import { GeoJSON, Pane, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { mapCenter, setDragging, setInitialMapZoom } from '../helpers/mapFunction';

import { useSelectedFeatureContext } from '../contexts/SelectedFeatureContext';
import Kenya_provinces from '../assets/data/shapefiles/Kenya_provinces.json';

const FiltereredDistrictsFeatures = ({ DistrictStyle, DistrictOnEachfeature, layerKey,attribution }) => {
    const { selectedView, selectedFeatureName } = useSelectedFeatureContext();
    const map = useMap();
    const initialZoom = setInitialMapZoom()


    const selectedFeatureData = selectedView && selectedFeatureName !== "" ? Kenya_provinces.features.filter(item => item.properties[selectedView] === selectedFeatureName) : Kenya_provinces.features;


    useEffect(() => {
        const geoJsonLayer = L.geoJSON(selectedFeatureData);
        const bounds = geoJsonLayer.getBounds();

        if (bounds.isValid()) {
            map.fitBounds(bounds);
        } else {
            map.setView(mapCenter, initialZoom);
        }
    }, [selectedFeatureData, map, initialZoom]);




    return (
        <Pane name="selected_districts">
            <GeoJSON
                // key={selectedDataType.value + selectedTime + intervalType }
                key={layerKey}
                // style={{ fillColor: 'none', weight: 4, color: 'yellow', fillOpacity: "0.4" }}
                data={selectedFeatureData}
            style={DistrictStyle}
            onEachFeature={DistrictOnEachfeature}
            attribution={attribution}
            />
        </Pane>
    );
};

export default FiltereredDistrictsFeatures;
