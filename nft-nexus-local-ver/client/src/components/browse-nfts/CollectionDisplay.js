import React, { useState, useEffect } from 'react';

const Results = ({ content, interval }) => {

  if (content.length === 0) {
    return (
      <p>null</p>
    )
  } else if (content === "400") {
    return (
      <p>invalid input</p>
    )
  } else if (content === "error") {
    return (
      <p>error</p>
    )
  }
  else {
    try {
      var output = content;
      console.log(output);

      const columns = [
        { header: 'Collection' },
        { header: 'Type'},
        { header: 'Floor Price' },
        { header: 'Market Cap', accessor: 'market-cap' },
        { header: 'No. of Sales' },
        { header: 'Volume' },
        { header: 'Volume % Chg.' }
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
                  <td>
                    <div class="collection">
                      <img class="colle_icon" src={row[2]} alt={row[0]} />
                      <a href={row[4]} target="_blank" rel="noopener noreferrer">{row[0]}</a>
                    </div>
                  </td>
                  <td>{row[3] ? row[3] : "--"}</td>
                  <td>{row[5]["floor_price"] > 0 ? String(Math.round(row[5]["floor_price"] * 1000) / 1000) +
                    " ETH" : "--"}</td>
                  <td>{String(Math.round(row[5]["market_cap"])) + " ETH"}</td>
                  <td>{row[6][i]['sales']}</td>
                  <td>{String(Math.round(row[6][i]['volume'] * 100) / 100) + " ETH"}</td>
                  <td>{String(Math.round(row[6][i]['volume_change'] * 1000) / 10) + "%"}</td>
                </tr>
              ))}
            </tbody>
          </table>
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