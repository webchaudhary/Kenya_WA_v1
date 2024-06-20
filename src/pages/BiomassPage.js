import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import {
  MapContainer,
  GeoJSON,
  TileLayer,
  ImageOverlay,
  WMSTileLayer,
} from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-fullscreen/dist/Leaflet.fullscreen.js";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import BaseMap from "../components/BaseMap";
import {
  MonthsArray,
  SelectedFeaturesAverageStatsFunction,
  calculateAverageOfArray,
  fillDensityColor,
  getAnnualDataFromMonthly,
  renderTimeOptions,
} from "../helpers/functions";
import {
  BaseMapsLayers,
  mapCenter,
  maxBounds,
  setDragging,
  setInitialMapZoom,
} from "../helpers/mapFunction";
import MapLegend from "../components/MapLegend";
import { ColorLegendsData } from "../assets/data/ColorLegendsData";
import { useSelectedFeatureContext } from "../contexts/SelectedFeatureContext";
import BiomassProductionChart from "../components/charts/BiomassProductionChart";
import { HydroclimaticStats } from "../assets/data/HydroclimaticStats.js";
import RasterLayerLegend from "../components/RasterLayerLegend";
import FiltereredDistrictsFeatures from "../components/FiltereredDistrictsFeatures.js";
import SelectedFeatureHeading from "../components/SelectedFeatureHeading.js";
import PixelValue from "../components/PixelValue.js";

const MapDataLayers = [
  {
    name: "Annual Biomass Production",
    value: "avg_biomass_raster",
    legend: "",
    attribution: "Data Source: <a href='https://www.fao.org/in-action/remote-sensing-for-water-productivity/wapor-data/en' target='_blank'>WaPOR L1 V3	</a>"
  },
  {
    name: "Biomass Production",
    value: "NPP",
    legend: "",
    attribution: "Data Source: <a href='https://www.fao.org/in-action/remote-sensing-for-water-productivity/wapor-data/en' target='_blank'>WaPOR L1 V3	</a>"
  },
];

const BiomassPage = () => {
  const [intervalType, setIntervalType] = useState("Yearly");
  const [selectedTime, setSelectedTime] = useState(5);
  const [selectedDataType, setSelectedDataType] = useState(MapDataLayers[0]);

  const { selectedView, selectedFeatureName } = useSelectedFeatureContext();

  const filteredFeaturesItems =
    selectedView && selectedFeatureName !== ""
      ? HydroclimaticStats.filter(
        (item) => item[selectedView] === selectedFeatureName
      )
      : HydroclimaticStats;
  const SelectedFeaturesStatsData = SelectedFeaturesAverageStatsFunction(
    filteredFeaturesItems
  );

  const [selectedBasemapLayer, setSelectedBasemapLayer] = useState(
    BaseMapsLayers[0]
  );

  const handleBasemapSelection = (e) => {
    const selectedItem = BaseMapsLayers.find(
      (item) => item.name === e.target.value
    );
    setSelectedBasemapLayer(selectedItem);
  };

  const ColorLegendsDataItem =
    ColorLegendsData[`${intervalType}_${selectedDataType.value}`];

  function DistrictOnEachfeature(feature, layer) {
    layer.on("mouseover", function (e) {
      const DataItem = HydroclimaticStats.find(
        (item) => item.DISTRICT === feature.properties.DISTRICT
      );
      const biomassProduction =
        intervalType === "Monthly"
          ? (DataItem[selectedDataType.value][selectedTime] * 22.222).toFixed(2)
          : (
            getAnnualDataFromMonthly(DataItem[selectedDataType.value])[
            selectedTime
            ] * 22.222
          ).toFixed(2);

      const popupContent = `
            <div>
              District: ${feature.properties.DISTRICT}<br/>
              Biomass Production: ${biomassProduction} ${intervalType === "Yearly" ? "(kg/ha/year)" : "(kg/ha/month)"
        }<br/>
            </div>
          `;
      layer.bindTooltip(popupContent, { sticky: true });
      layer.openTooltip();
    });

    layer.on("mouseout", function () {
      layer.closeTooltip();
    });
  }

  const DistrictStyle = (feature) => {
    if (selectedTime !== "") {
      const getDensityFromData = (name) => {
        const DataItem = HydroclimaticStats.find((item) => item.DISTRICT === name);
        if (!DataItem) return null;
        if (intervalType === "Monthly") {
          return DataItem[selectedDataType.value][selectedTime] * 22.222; // Monthly density calculation
        } else {
          const annualData = getAnnualDataFromMonthly(DataItem[selectedDataType.value]);
          return DataItem[selectedDataType.value] ? annualData[selectedTime] * 22.222 : null;
        }

      };
      const density = getDensityFromData(feature.properties.DISTRICT);
      return {
        // fillColor: density ? selectedDensityFunc(density):"none",
        fillColor: ColorLegendsDataItem
          ? fillDensityColor(ColorLegendsDataItem, density)
          : "none",
        weight: 1,
        opacity: 1,
        color: "black",
        dashArray: "2",
        fillOpacity: 1,
      };
    }
  };

  const handleDataLayerSelection = (e) => {
    const value = e.target.value;
    const selectedItem = MapDataLayers.find((item) => item.value === value);
    setSelectedDataType(selectedItem);
  };

  const handleIntervalTypeChange = (e) => {
    setIntervalType(e.target.value);
    setSelectedTime("");
  };

  return (
    <div className="dasboard_page_container">
      <div className="main_dashboard">
       

        <div className="right_panel_equal">
          <div className="card_container" style={{ height: "100%" }}>
            <MapContainer
             fullscreenControl={true}
             center={mapCenter}
             style={{ width: '100%', height: "100%", backgroundColor: 'white', border: 'none', margin: 'auto' }}
             zoom={setInitialMapZoom()}
             maxBounds={maxBounds}
            //  zoomSnap={0.5}
             minZoom={setInitialMapZoom() - 1}
             keyboard={false}
             dragging={setDragging()}
             doubleClickZoom={false}
            >
              <div className="map_heading">
                <p> {selectedDataType.name} </p>
              </div>

              <div className="map_layer_manager">
                <div className="accordion" id="accordionPanelsStayOpenExample">
                <div className="accordion-item">
                      <h2 className="accordion-header" id="panelsStayOpen-headingOne">
                        <button className="accordion-button map_layer_collapse" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseOne" aria-expanded="true" aria-controls="panelsStayOpen-collapseOne">
                          Base Map
                        </button>
                      </h2>
                      <div id="panelsStayOpen-collapseOne" className="accordion-collapse collapse show" aria-labelledby="panelsStayOpen-headingOne">
                        <div className="accordion-body map_layer_collapse_body">
                          {BaseMapsLayers.map((option, index) => (
                            <div key={index} className="form-check">
                              <input
                                type="radio"
                                className="form-check-input"
                                id={option.name}
                                name="data_type"
                                value={option.name}
                                checked={selectedBasemapLayer?.name === option.name}
                                onChange={handleBasemapSelection}
                              />
                              <label htmlFor={option.name}>{option.name}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  <div className="accordion-item">
                    <h2
                      className="accordion-header"
                      id="panelsStayOpen-headingTwo"
                    >
                      <button
                        className="accordion-button map_layer_collapse"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#panelsStayOpen-collapseTwo"
                        aria-expanded="true"
                        aria-controls="panelsStayOpen-collapseTwo"
                      >
                        Raster Layers
                      </button>
                    </h2>
                    <div
                      id="panelsStayOpen-collapseTwo"
                      className="accordion-collapse collapse show"
                      aria-labelledby="panelsStayOpen-headingTwo"
                    >
                      <div className="accordion-body map_layer_collapse_body">
                        {MapDataLayers.slice(0, 1).map((item, index) => (
                          <div key={index} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={item.value}
                              value={item.value}
                              checked={selectedDataType.value === item.value}
                              onChange={handleDataLayerSelection}
                            />
                            <label htmlFor={item.value}> {item.name}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
               
                </div>
              </div>

              <TileLayer
                key={selectedBasemapLayer.url}
                attribution={selectedBasemapLayer.attribution}
                url={selectedBasemapLayer.url}
                subdomains={selectedBasemapLayer.subdomains}
              />

              <BaseMap />

              {selectedDataType.value === "avg_biomass_raster" ? (
                <>
                  <WMSTileLayer
                    attribution={selectedDataType.attribution}
                    url={`${process.env.REACT_APP_GEOSERVER_URL}/geoserver/Kenya/wms`}
                    params={{ LAYERS: "Kenya:TBP_2018-2023_avg" }}
                    version="1.1.0"
                    transparent={true}
                    format="image/png"
                    key="avg_biomass_raster"
                  />
                  <PixelValue
                    layername="TBP_2018-2023_avg"
                    unit="kg/ha/year"
                  />
                  <RasterLayerLegend
                    layerName="TBP_2018-2023_avg"
                    Unit="(kg/ha/year)"
                  />



                </>
              ) : (
                <>

                </>
              )}

              {selectedDataType && selectedDataType.value && selectedTime !== "" && intervalType !== "" && ColorLegendsDataItem ? (

                <>
                  <FiltereredDistrictsFeatures
                    DistrictStyle={DistrictStyle}
                    DistrictOnEachfeature={DistrictOnEachfeature}
                    layerKey={selectedDataType.value + selectedTime + intervalType}
                    attribution={selectedDataType.attribution}
                  />

                  {ColorLegendsDataItem && (
                    <MapLegend ColorLegendsDataItem={ColorLegendsDataItem} />
                  )}

                </>

              ) : (
                <>
                  <FiltereredDistrictsFeatures
                    DistrictStyle={
                      {
                        fillColor: "none",
                        weight: 2,
                        opacity: 1,
                        color: "black",
                        fillOpacity: 1,
                      }}
                    layerKey={selectedDataType.value + selectedTime + intervalType}
                  />
                </>


              )}


              {/* <FiltererdJsonFeature /> */}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiomassPage;
