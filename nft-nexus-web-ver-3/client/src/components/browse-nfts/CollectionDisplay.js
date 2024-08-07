import React, { useState, useEffect } from 'react';
import { getToken, isAuthenticated } from '../../utils/auth';
import axios from 'axios';
import { loadSalesGraph } from '../../utils/api';
import SalesGraphModal from './SalesGraphModal';

const Results = ({ content, interval, resultsType, status }) => {
  const [collection, setCollection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [heatmapSrc, setHeatmapSrc] = useState({ outlier: null, noOutlier: null });
  const [scatterSrc, setScatterSrc] = useState({ outlier: null, noOutlier: null });
  const [volumeSrc, setVolumeSrc] = useState({ outlier: null, noOutlier: null });

  const getColor = (value) => {
    if (value > 0) return 'green';
    if (value < 0) return 'red';
    return 'black';
  };

  const numberStyle = (num) => ({
    color: getColor(num)
  });

  const handleViewSaleGraph = async (name, slug, sales, interval) => {
    try {
      if (sales == 0) {
        alert("No sales found. Graph will not load.");
        return;
      }
      let loadingTime = Math.round(sales / 42);
      setTimeout(() => {
        if (loadingTime > 2) {
          alert(`Loading ${sales} items will take about ${loadingTime} seconds. Press 'OK' to load`);
        }
      }, 100);
      const response = await loadSalesGraph({ name, slug, interval });
      const { heatmap, scatter, volume, heatmap_no_outlier, scatter_no_outlier, volume_no_outlier } = response;
      if (heatmap && scatter && volume && heatmap_no_outlier && scatter_no_outlier && volume_no_outlier) {
        setCollection(name);
        setHeatmapSrc({
          outlier: `data:image/png;base64,${heatmap}`,
          noOutlier: `data:image/png;base64,${heatmap_no_outlier}`,
        });
        setScatterSrc({
          outlier: `data:image/png;base64,${scatter}`,
          noOutlier: `data:image/png;base64,${scatter_no_outlier}`,
        });
        setVolumeSrc({
          outlier: `data:image/png;base64,${volume}`,
          noOutlier: `data:image/png;base64,${volume_no_outlier}`,
        });
        setIsModalOpen(true);
      } else {
        alert('Failed to fetch sales graph');
      }
    } catch (error) {
      console.error('Error fetching sales graph:', error);
      alert('Failed to fetch sales graph');
    }
  };

  const handleAddToWatchlist = (name, slug) => {

    if (!isAuthenticated()) {
      alert(`Please login first`);
      return;
    } else {// Add the collection to the watchlist
      
      const token = getToken(); // retrieve token
      
      // Send a request to the backend to update the watchlist
      axios.post('https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/watchlist/add_from_nft_browser', 
        { name, slug },
        { headers: { Authorization: `Bearer ${token}` }})
        .then(response => {
          console.log('Added to watchlist:', response.data);
          alert(`Added ${name} to watchlist`);
        })
        .catch(error => {
          console.error('Error adding to watchlist:', error);
          alert(`${error.response.data.error}`);
        });

    }
  };

  if (status === null) {
    return (
      <p>null</p>
    )
  } else if (status === "loading") {
    return (
      <p>Loading...</p>
    )
  }
   else if (status === "400") {
    return (
      <p>invalid input</p>
    )
  } else if (status === "500") {
    return (
      <p>Internal server error. Please try again later.</p>
    )
  }
  else {
    try {
      var output = content;
      console.log(output);

      const columns = [
        { header: 'No.' },
        { header: 'Collection' },
        { header: (resultsType === 'load' ? 'Type' : 'Supply')},
        { header: 'Floor Price' },
        { header: 'Market Cap', accessor: 'market-cap' },
        { header: 'No. of Sales' },
        { header: 'Volume' },
        { header: 'Volume % Chg.' },
        { header: 'View Sales Graph' },
        { header: 'Add to Watchlist' }
      ];
      
      var i = 0;
      if (interval === '1') {
        i = 0;
      } else if (interval === '7') {
        i = 1;
      } else if (interval === '30') {
        i = 2;
      }

      return (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {output.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{rowIndex + 1}</td>
                  <td>
                    <div class="collection">
                      <img class="colle_icon" src={row[2]} alt={row[0]} />
                      <a href={row[4]} target="_blank" rel="noopener noreferrer">{row[0]}</a>
                    </div>
                  </td>
                  <td>{row[3] ? row[3] : "--"}</td>
                  <td>{row[6]["floor_price"] > 0 ? String(Math.round(row[6]["floor_price"] * 1000) / 1000) +
                    " ETH" : "--"}</td>
                  <td>{String(Math.round(row[6]["market_cap"])) + " ETH"}</td>
                  <td>{row[7][i]['sales']}</td>
                  <td>{String(Math.round(row[7][i]['volume'] * 100) / 100) + " ETH"}</td>
                  <td>
                    <p style={numberStyle(row[7][i]['volume_change'])}>
                      {String(Math.round(row[7][i]['volume_change'] * 1000) / 10) + "%"}
                    </p>
                  </td>
                  <td><button onClick={() => handleViewSaleGraph(row[0], row[1], row[7][i]['sales'], Number(interval))}>View</button></td>
                  <td><button onClick={() => handleAddToWatchlist(row[0], row[1])}>Add</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <SalesGraphModal
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            heatmapSrc={heatmapSrc}
            scatterSrc={scatterSrc}
            volumeSrc={volumeSrc}
            name={collection}
          />
        </div>
      );
    } catch {
      return (
        <p>Unknown error</p>
      )
    }
  }
};
export default Results;