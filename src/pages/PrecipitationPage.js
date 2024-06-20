import React, { useState } from 'react'
import { MapContainer, GeoJSON, TileLayer, ImageOverlay, WMSTileLayer } from 'react-leaflet'
import * as L from "leaflet";
import "leaflet/dist/leaflet.css"
import 'leaflet-fullscreen/dist/Leaflet.fullscreen.js';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import BaseMap from '../components/BaseMap';
import { MonthsArray, SelectedFeaturesAverageStatsFunction, YearsArray, fillDensityColor, getAnnualDataFromMonthly, renderTimeOptions } from '../helpers/functions';
import { BaseMapsLayers, mapCenter, maxBounds, pngRasterBounds, setDragging, setInitialMapZoom } from '../helpers/mapFunction';
import { ColorLegendsData } from "../assets/data/ColorLegendsData";
import MapLegend from '../components/MapLegend';
import { useSelectedFeatureContext } from '../contexts/SelectedFeatureContext';
import { HydroclimaticStats } from "../assets/data/HydroclimaticStats.js";
import PCPTrendChart from '../components/charts/PCPTrendChart';
import FiltereredDistrictsFeatures from '../components/FiltereredDistrictsFeatures.js';
import RasterLayerLegend from '../components/RasterLayerLegend.js';
import SelectedFeatureHeading from '../components/SelectedFeatureHeading.js';
import PixelValue from '../components/PixelValue.js';


const MapDataLayers = [
  {
    name: "Annual Precipitation",
    value: "avg_pcp_raster",
    legend: "",
    attribution: "Data Source:<a href='https://www.chc.ucsb.edu/data/chirps' target='_blank'> Chirps </a>"
  },
  // {
  //   name: "Long Term Precipitation (1981-2023 mean)",
  //   value: "avg_longterm_pcp_raster",
  //   legend: "",
  //   attribution: "Data Source:<a href='https://www.chc.ucsb.edu/data/chirps' target='_blank'> Chirps </a>"
  // },
  {
    name: "Annual Ref. ET",
    value: "avg_ret_raster",
    legend: "",
    attribution: "Data Source: <a href='https://data.apps.fao.org/catalog/dataset/global-weather-for-agriculture-agera5' target='_blank'>AgERA5 </a>"
  },
  // {
  //   name: "Annual Potential ET",
  //   value: "avg_pet_raster",
  //   legend: "",
  //   attribution: "Data Source: <a href='https://developers.google.com/earth-engine/datasets/catalog/NASA_GLDAS_V021_NOAH_G025_T3H' target='_blank'>GLDAS </a>"
  // },
  {
    name: "Annual Aridity Index",
    value: "avg_aridityIndex_raster",
    legend: "",
    attribution: ""
  },
  {
    name: "Precipitation",
    value: "PCP",
    legend: "",
    attribution: "Data Source:<a href='https://www.chc.ucsb.edu/data/chirps' target='_blank'> Chirps </a>"
  },
  {
    name: "Ref. Evapotranspiration",
    value: "RET",
    legend: "",
    attribution: "Data Source: <a href='https://data.apps.fao.org/catalog/dataset/global-weather-for-agriculture-agera5' target='_blank'>AgERA5 </a>"
  },
  {
    name: "Aridity Index",
    value: "AridityIndex",
    legend: "",
    attribution: ""
  },
]


const PrecipitationPage = () => {
  const { selectedView, selectedFeatureName } = useSelectedFeatureContext();
  const [selectedDataType, setSelectedDataType] = useState(MapDataLayers[0]);
  const [intervalType, setIntervalType] = useState('Yearly');
  const [selectedTime, setSelectedTime] = useState(5);

  const filteredFeaturesItems = selectedView && selectedFeatureName !== "" ? HydroclimaticStats.filter(item => item[selectedView] === selectedFeatureName) : HydroclimaticStats;
  const SelectedFeaturesStatsData = SelectedFeaturesAverageStatsFunction(filteredFeaturesItems)


  const [selectedBasemapLayer, setSelectedBasemapLayer] = useState(BaseMapsLayers[0]);


  const handleBasemapSelection = (e) => {
    const selectedItem = BaseMapsLayers.find((item) => item.name === e.target.value);
    setSelectedBasemapLayer(selectedItem);


  };







  const ColorLegendsDataItem = ColorLegendsData[`${intervalType}_${selectedDataType.value}`];

  function DistrictOnEachfeature(feature, layer) {
    layer.on("mouseover", function (e) {
      const DataItem = HydroclimaticStats.find(
        (item) => item.DISTRICT === feature.properties.DISTRICT
      );

      let popupContent;

      if (!DataItem) {
        popupContent = `<div> Data not available for ${feature.properties.DISTRICT}</div>`;
      } else if (selectedDataType.value === "AridityIndex") {
        popupContent = `
            <div>
              District: ${feature.properties.DISTRICT}<br/>
              ${selectedDataType.name}: ${DataItem["AridityIndex"][selectedTime]}  
              
            </div>
          `;
      } else {
        popupContent = `
            <div>
              District: ${feature.properties.DISTRICT}<br/>
              ${selectedDataType.name}  ${selectedDataType.value === 'AridityIndex' ? '' : `(${intervalType === 'Yearly' ? 'mm/year' : 'mm/month'})`}: ${intervalType === 'Monthly' ? DataItem[selectedDataType.value][selectedTime] : getAnnualDataFromMonthly(DataItem[selectedDataType.value])[selectedTime]}
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
    if (selectedTime !== "") {
      const getDensityFromData = (name) => {
        const DataItem = HydroclimaticStats.find((item) => item.DISTRICT === name);
        if (selectedDataType.value === "AridityIndex") {
          if (intervalType === 'Yearly') {
            return DataItem["AridityIndex"][selectedTime];
          }
        } else {
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
        // fillColor: selectedTime !== '' ? Annual_Density(density) : "none",
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




  const TableAnnualData = {
    Year: YearsArray,
    Yearly_AETI: getAnnualDataFromMonthly(SelectedFeaturesStatsData.AETI),
    Yearly_PCP: getAnnualDataFromMonthly(SelectedFeaturesStatsData.PCP),
    Yearly_RET: getAnnualDataFromMonthly(SelectedFeaturesStatsData.RET),
    Yearly_AridityIndex: SelectedFeaturesStatsData.AridityIndex,
    Yearly_ETB: SelectedFeaturesStatsData.ETB,
    Yearly_ETG: SelectedFeaturesStatsData.ETG,
  }

  console.log(SelectedFeaturesStatsData)



  return (
    <div className='dasboard_page_container'>
      <div className='main_dashboard'>

        

        <div className='right_panel_equal' >
          <div className='card_container' style={{ height: "100%" }}>
            <MapContainer
              fullscreenControl={true}
              center={mapCenter}
              style={{ width: '100%', height: "100%", backgroundColor: 'white', border: 'none', margin: 'auto' }}
              zoom={setInitialMapZoom()}
              // maxZoom={8}
              minZoom={setInitialMapZoom()-1}
              keyboard={false}
              dragging={setDragging()}
              maxBounds={maxBounds}
              // attributionControl={false}
              // scrollWheelZoom={false}
              doubleClickZoom={false}
              // zoomSnap={0.5}
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



              {selectedDataType.value === 'avg_pcp_raster' ? (
                <>
                  <WMSTileLayer
                    attribution={selectedDataType.attribution}
                    url={`${process.env.REACT_APP_GEOSERVER_URL}/geoserver/Kenya/wms`}
                    params={{ LAYERS: '	Kenya:PCP_2018-2023_avg' }}
                    version="1.1.0"
                    transparent={true}
                    format="image/png"
                    key="avg_pcp_raster"
                  />
                  <RasterLayerLegend
                    layerName="PCP_2018-2023_avg"
                    Unit="(mm/year)"
                  />

                  <PixelValue layername="PCP_2018-2023_avg" unit="mm/year" />


                </>

              ) :selectedDataType.value === 'avg_longterm_pcp_raster' ? (
                <>
                  <WMSTileLayer
                    attribution={selectedDataType.attribution}
                    url={`${process.env.REACT_APP_GEOSERVER_URL}/geoserver/Kenya/wms`}
                    params={{ LAYERS: '	Kenya:PCP_Long_Term_Mean_1981-2023' }}
                    version="1.1.0"
                    transparent={true}
                    format="image/png"
                    key="avg_longterm_pcp_raster"
                  />
                  <RasterLayerLegend
                    layerName="PCP_Long_Term_Mean_1981-2023"
                    Unit="(mm/year)"
                  />

                  <PixelValue layername="PCP_Long_Term_Mean_1981-2023" unit="mm/year" />


                </>

              ) : selectedDataType.value === 'avg_ret_raster' ? (
                <>
                  <WMSTileLayer
                    attribution={selectedDataType.attribution}
                    url={`${process.env.REACT_APP_GEOSERVER_URL}/geoserver/Kenya/wms`}
                    params={{ LAYERS: '	Kenya:RET_2018-2023_avg' }}
                    version="1.1.0"
                    transparent={true}
                    format="image/png"
                    key="avg_ret_raster"
                  />
                  <PixelValue layername="RET_2018-2023_avg" unit="mm/year" />

                  <RasterLayerLegend
                    layerName="RET_2018-2023_avg"
                    Unit="(mm/year)"
                  />


                </>

              ) : selectedDataType.value === 'avg_pet_raster' ? (
                <>
                  <WMSTileLayer
                    attribution={selectedDataType.attribution}
                    url={`${process.env.REACT_APP_GEOSERVER_URL}/geoserver/Kenya/wms`}
                    params={{ LAYERS: 'Kenya:PET_2018-2023_avg' }}
                    version="1.1.0"
                    transparent={true}
                    format="image/png"
                    key="avg_pet_raster"
                  />
                  <PixelValue layername="PET_2018-2023_avg" unit="mm/year" />

                  <RasterLayerLegend
                    layerName="PET_2018-2023_avg"
                    Unit="(mm/year)"
                  />



                </>

              ) : selectedDataType.value === 'avg_aridityIndex_raster' ? (
                <>

                  <WMSTileLayer
                    attribution={selectedDataType.attribution}
                    url={`${process.env.REACT_APP_GEOSERVER_URL}/geoserver/Kenya/wms`}
                    params={{ LAYERS: '	Kenya:AridityIndex_2018-2023_avg' }}
                    version="1.1.0"
                    transparent={true}
                    format="image/png"
                    key="avg_aridityIndex_raster"
                  />
                  <PixelValue layername="AridityIndex_2018-2023_avg" unit="" />

                  <RasterLayerLegend
                    layerName="AridityIndex_2018-2023_avg"
                    Unit=""
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





              <BaseMap />

            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrecipitationPage