import React, { useState } from 'react'
import { MapContainer, GeoJSON, TileLayer, ImageOverlay, WMSTileLayer } from 'react-leaflet'
import * as L from "leaflet";
import "leaflet/dist/leaflet.css"
import 'leaflet-fullscreen/dist/Leaflet.fullscreen.js';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import BaseMap from '../components/BaseMap';
import { MonthsArray, SelectedFeaturesAverageStatsFunction, YearsArray, calculateAverageOfArray, calculateSumOfArray, fillDensityColor, getAnnualDataFromMonthly, renderTimeOptions } from '../helpers/functions';
import { BaseMapsLayers, mapCenter, maxBounds, pngRasterBounds, setDragging, setInitialMapZoom } from '../helpers/mapFunction';
import MapLegend from '../components/MapLegend';
import { ColorLegendsData } from "../assets/data/ColorLegendsData";
import { useSelectedFeatureContext } from '../contexts/SelectedFeatureContext';
import TotalConsumptionChart from '../components/charts/TotalConsumptionChart';
import UnitConsumptionChart from '../components/charts/UnitConsumptionChart';
import { HydroclimaticStats } from "../assets/data/HydroclimaticStats.js";
import RasterLayerLegend from '../components/RasterLayerLegend';
import PixelValue from '../components/PixelValue.js';
import FiltereredDistrictsFeatures from '../components/FiltereredDistrictsFeatures.js';
import SelectedFeatureHeading from '../components/SelectedFeatureHeading.js';
import hydronomic_zones from "../assets/legends/hydronomic_zones.jpg"

const MapDataLayers = [
  {
    name: "Hydronomic zoning",
    value: "hydronomic_zones",
    legend: "",
    attribution: ""
  },

]


const HydronomicZonesPage = () => {
  const [selectedDataType, setSelectedDataType] = useState(MapDataLayers[0]);
  const [intervalType, setIntervalType] = useState('Yearly');
  const [selectedTime, setSelectedTime] = useState(5);
  const { selectedView, selectedFeatureName } = useSelectedFeatureContext();

  const [selectedBasemapLayer, setSelectedBasemapLayer] = useState(BaseMapsLayers[0]);


  const handleBasemapSelection = (e) => {
    const selectedItem = BaseMapsLayers.find((item) => item.name === e.target.value);
    setSelectedBasemapLayer(selectedItem);
  };
  console.log(selectedBasemapLayer)



  const filteredFeaturesItems = selectedView && selectedFeatureName !== "" ? HydroclimaticStats.filter(item => item[selectedView] === selectedFeatureName) : HydroclimaticStats;
  const SelectedFeaturesStatsData = SelectedFeaturesAverageStatsFunction(filteredFeaturesItems)


  const ColorLegendsDataItem = ColorLegendsData[`${intervalType}_${selectedDataType.value}`];



  function DistrictOnEachfeature(feature, layer) {
    layer.on("mouseover", function (e) {
      const DataItem = HydroclimaticStats.find(
        (item) => item.DISTRICT === feature.properties.DISTRICT
      );
      let popupContent;

      if (!DataItem) {
        popupContent = `<div> Data not available for ${feature.properties.DISTRICT}</div>`;
      } else if (selectedDataType.value === "PCP_ET") {
        const value = intervalType === 'Monthly' ?
          (DataItem["PCP"][selectedTime] - DataItem["AETI"][selectedTime]).toFixed(1) :
          (getAnnualDataFromMonthly(DataItem["PCP"])[selectedTime] - getAnnualDataFromMonthly(DataItem["AETI"])[selectedTime]).toFixed(1);
        popupContent = `
            <div>
              District: ${feature.properties.DISTRICT}<br/>
              ${selectedDataType.name} (${intervalType === 'Yearly' ? 'mm/year' : 'mm/month'}): ${value}
            </div>
          `;
      } else if (selectedDataType.value === "PET") {
        const value = DataItem["PET"][selectedTime]
        popupContent = `
            <div>
              District: ${feature.properties.DISTRICT}<br/>
              ${selectedDataType.name} (mm/year): ${value}
            </div>
          `;
      } else {
        const value = intervalType === 'Monthly' ?
          DataItem[selectedDataType.value][selectedTime] :
          getAnnualDataFromMonthly(DataItem[selectedDataType.value])[selectedTime];
        popupContent = `
            <div>
              District: ${feature.properties.DISTRICT}<br/>
              ${selectedDataType.name} ${selectedDataType.value === 'AridityIndex' ? '' : `(${intervalType === 'Yearly' ? 'mm/year' : 'mm/month'})`} : ${value}
            </div>
          `;
      }

      layer.bindTooltip(popupContent, { sticky: true });
      layer.openTooltip();
    });

    layer.on("mouseout", function () {
      layer.closeTooltip();
    });
  }


  const DistrictStyle = (feature) => {
    if (selectedTime && selectedDataType && selectedDataType.value) {
      const getDensityFromData = (name) => {
        const DataItem = HydroclimaticStats.find((item) => item.DISTRICT === name);
        if (selectedDataType.value === "PCP_ET") {
          if (intervalType === 'Monthly') {
            return DataItem["PCP"][selectedTime] - DataItem["AETI"][selectedTime];
          } else {
            return getAnnualDataFromMonthly(DataItem["PCP"])[selectedTime] - getAnnualDataFromMonthly(DataItem["AETI"])[selectedTime];
          }
        } if (selectedDataType.value === "PET") {
          if (intervalType === 'Yearly') {
            return DataItem["PET"][selectedTime];
          }
        }
        else {
          if (intervalType === 'Monthly') {
            return DataItem[selectedDataType.value] ? DataItem[selectedDataType.value][selectedTime] : null;
          } else {
            return DataItem[selectedDataType.value] ? getAnnualDataFromMonthly(DataItem[selectedDataType.value])[selectedTime] : null;
          }
        }
      };

      const density = getDensityFromData(feature.properties.DISTRICT);

      return {
        fillColor: ColorLegendsDataItem ? fillDensityColor(ColorLegendsDataItem, density) : "none",
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
    setSelectedTime('')
  };


  <option value="AETI">Evapotranspiration</option>


  let TableAnnualData;

  if (SelectedFeaturesStatsData) {
    TableAnnualData = {
      Year: YearsArray,
      Yearly_AETI: getAnnualDataFromMonthly(SelectedFeaturesStatsData.AETI),
      Yearly_PCP: getAnnualDataFromMonthly(SelectedFeaturesStatsData.PCP),
      Yearly_RET: getAnnualDataFromMonthly(SelectedFeaturesStatsData.RET),
      Yearly_ETB: SelectedFeaturesStatsData.ETB,
      Yearly_ETG: SelectedFeaturesStatsData.ETG,
    }
  }



  const maxAETI = Math.max(...SelectedFeaturesStatsData.AETI);
  const maxRET = Math.max(...SelectedFeaturesStatsData.RET);
  const maxRange = Math.max(maxAETI, maxRET);



  return (
    <div className='dasboard_page_container'>
      <div className='main_dashboard'>


        <>

          <div className='right_panel_equal' >
            <div className='card_container' style={{ height: "100%" }}>


              <MapContainer
                fullscreenControl={true}
                center={mapCenter}
                style={{ width: '100%', height: "100%", backgroundColor: 'white', border: 'none', margin: 'auto' }}
                zoom={setInitialMapZoom()}
                maxBounds={maxBounds}
                // zoomSnap={0.5}
                minZoom={setInitialMapZoom() - 1}
                keyboard={false}
                dragging={setDragging()}
                doubleClickZoom={false}
              >

                <div className='map_heading'>
                  <p> {selectedDataType.name} </p>
                </div>


                <div className='map_layer_manager'>
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
                      <h2 className="accordion-header" id="panelsStayOpen-headingTwo">
                        <button className="accordion-button map_layer_collapse" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseTwo" aria-expanded="true" aria-controls="panelsStayOpen-collapseTwo">
                          Raster Layers
                        </button>
                      </h2>
                      <div id="panelsStayOpen-collapseTwo" className="accordion-collapse collapse show" aria-labelledby="panelsStayOpen-headingTwo">
                        <div className="accordion-body map_layer_collapse_body">
                          {MapDataLayers.slice(0, 3).map((item, index) => (
                            <div key={item.value} className="form-check">
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

                {selectedBasemapLayer && selectedBasemapLayer.url && (
                  <TileLayer
                    key={selectedBasemapLayer.url}
                    attribution={selectedBasemapLayer.attribution}
                    url={selectedBasemapLayer.url}
                    subdomains={selectedBasemapLayer.subdomains}
                  />
                )}






                {selectedDataType.value === 'hydronomic_zones' ? (
                  <>
                    <WMSTileLayer
                      attribution={selectedDataType.attribution}
                      url={`${process.env.REACT_APP_GEOSERVER_URL}/geoserver/Kenya/wms`}
                      params={{ LAYERS: '	Kenya:kenya_zoning_nw_v3_nw1' }}
                      version="1.1.0"
                      transparent={true}
                      format="image/png"
                      key="avg_aeti_raster"
                    />


                    <div className="legend-panel" style={{ width: "280px" }}>
                      <img
                        src={hydronomic_zones}
                        alt="Legend_Img"
                      />
                    </div>

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

                <BaseMap />

              </MapContainer>
            </div>
          </div>
        </>


      </div>
    </div >
  )
}

export default HydronomicZonesPage