import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'
import SunCalc from 'suncalc'
import ApexCharts from 'apexcharts'


document.querySelector('#app').innerHTML = `
<body>
  <div class="container">
    <div class="hero">
      <div class="hero-text">
        <h1>UnNamed Center</h1>
        <p>Los Angeles, California</p>
      </div>
    </div>
    
    <!-- New Ticker Section -->
    <div class="ticker-container">
      <div class="ticker" id="liveTicker">
        <!-- Items will be populated by JavaScript -->
        <div class="ticker-item">
          <i class="fas fa-bolt ticker-icon"></i>
          <span>Current Power: <span class="ticker-value" id="tickerKW">--</span> kW</span>
        </div>
        <div class="ticker-item">
          <i class="fas fa-users ticker-icon"></i>
          <span>Foot Traffic: <span class="ticker-value">1,250</span> visitors/hr</span>
        </div>
        <div class="ticker-item">
          <i class="fas fa-cloud-sun weather-icon"></i>
          <span>Weather: <span class="ticker-value">72°F, Sunny</span></span>
        </div>
        <div class="ticker-item">
          <i class="fas fa-leaf ticker-icon"></i>
          <span>Today's Savings: <span class="ticker-value">$1,250</span> from solar</span>
        </div>
        <div class="ticker-item">
          <i class="fas fa-car ticker-icon"></i>
          <span>Parking: <span class="ticker-value">45%</span> capacity</span>
        </div>
        <div class="ticker-item">
          <img src="/instagram_32x32.png" alt="Metron Logo" />
          <span>Upcoming Event: <span class="ticker-value">Summer Fashion Show</span> June 25</span>
        </div>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h2>883,000</h2>
        <p>Square Feet</p>
      </div>
      <div class="stat-card">
        <h2>100+</h2>
        <p>Stores</p>
      </div>
      <div class="stat-card">
        <h2>15+</h2>
        <p>Restaurants</p>
      </div>
      <div class="stat-card">
        <h2 id="liveKW">--</h2>
        <p>Live Energy (kW)</p>
      </div>
    </div>
    
    <div class="chart-container">
      <div class="chart-card">
        <h2>Traffic vs Demand</h2>
        <div class="chart-wrapper">
          <div id="popularTimesChart"></div>
        </div>
      </div>
      
      <div class="chart-card">
        <h2>Solar Elevation vs Energy Demand</h2>
        <div class="chart-wrapper">
          <div id="sunChart"></div>
        </div>
      </div>
    </div>
  </div>
</body>
`

// setupCounter(document.querySelector('#counter'))
const lat = 34.07556, lon = -118.37667;

      function initializeDashboard() {
        console.log('Dashboard initializing...');
        fetchTrafficAndDemandChart();
        fetchSunPositionChart();
        setupTicker();
        
        // Simulate live data updates
        setInterval(() => {
          const liveValue = (Math.random() * 500 + 1500).toFixed(0);
          document.getElementById('liveKW').textContent = liveValue;
          document.getElementById('tickerKW').textContent = liveValue;
        }, 3000);
      }

      function setupTicker() {
        // Duplicate ticker items for seamless scrolling
        const ticker = document.getElementById('liveTicker');
        const tickerContent = ticker.innerHTML;
        ticker.innerHTML = tickerContent + tickerContent + tickerContent;
        
        // Simulate updating some ticker values
        setInterval(() => {
          // Update foot traffic randomly
          const trafficElement = document.querySelectorAll('.ticker-item:nth-child(2) .ticker-value')[0];
          trafficElement.textContent = Math.floor(Math.random() * 500 + 1000);
          
          // Update parking capacity randomly
          const parkingElement = document.querySelectorAll('.ticker-item:nth-child(5) .ticker-value')[0];
          parkingElement.textContent = Math.floor(Math.random() * 30 + 30) + '%';
        }, 5000);
        
        // Simulate weather fetch (in a real app, you'd call a weather API)
        fetchWeather();
      }
      
      function fetchWeather() {
        // In a real implementation, you would call a weather API here
        // For demo purposes, we'll simulate LA weather
        const weatherConditions = [
          { temp: 72, condition: "Sunny", icon: "fa-sun" },
          { temp: 68, condition: "Partly Cloudy", icon: "fa-cloud-sun" },
          { temp: 75, condition: "Clear", icon: "fa-sun" },
          { temp: 70, condition: "Mostly Sunny", icon: "fa-cloud-sun" }
        ];
        
        const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
        
        const weatherElements = document.querySelectorAll('.ticker-item:nth-child(3)');
        weatherElements.forEach(el => {
          const icon = el.querySelector('.weather-icon');
          const value = el.querySelector('.ticker-value');
          
          icon.className = `fas ${randomWeather.icon} weather-icon`;
          value.textContent = `${randomWeather.temp}°F, ${randomWeather.condition}`;
        });
      }

      function fetchTrafficAndDemandChart() {
        console.log('Fetching traffic and demand chart...');
        Promise.all([
          fetch("/popularTimes.json").then(res => res.json()),
          fetch("/bev_avg_hourly_demand.csv").then(res => res.text())
        ]).then(([popularData, csvText]) => {
          console.log("popular Data", popularData);
          const { labels: busynessLabels, values: popValues } = getPopularTimesForDay(popularData, "saturday");
          const demand = extractDemandByHour(csvText, busynessLabels);
          renderTrafficChart(busynessLabels, popValues, demand);
        });
      }

      function fetchSunPositionChart() {
        const now = new Date();
        fetch("/bev_avg_hourly_demand.csv")
          .then(res => res.text())
          .then(csv => {
            const labels = getHourlyLabels();
            const hourMap = extractDemandMap(csv);
            const demand = labels.map(label => hourMap[parseInt(label.split(":")[0])] || 0);

            const sunElevation = [], azimuthNotes = [];
            labels.forEach(label => {
              const hour = parseInt(label.split(":")[0]);
              const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
              const pos = SunCalc.getPosition(date, lat, lon);
              sunElevation.push((pos.altitude * 180 / Math.PI).toFixed(2));
              azimuthNotes.push((pos.azimuth * 180 / Math.PI + 180).toFixed(1));
            });

            renderSunChart(labels, demand, sunElevation, azimuthNotes);
          });
      }

      function getHourlyLabels() {
        return Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0') + ":00");
      }
      function convertTo24Hour(timeStr) {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:00`;
      }
      function extractDemandMap(csv) {
        const lines = csv.trim().split("\n").slice(1);
        const map = {};
        lines.forEach(row => {
          const [hourLabel, valueStr] = row.split(",");
          const h = parseInt(hourLabel.trim());
          const v = parseFloat(valueStr);
          if (!isNaN(h) && !isNaN(v)) map[h] = v;
        });
        return map;
      }
      function extractDemandByHour(csv, labels) {
        const lines = csv.trim().split("\n").slice(1); // skip header
        const hourMap = {};
        lines.forEach(row => {
          const [hourLabel, valueStr] = row.split(",");
          const hour = parseInt(hourLabel.trim(), 10);
          hourMap[hour] = parseFloat(valueStr);
        });
      
        return labels.map(label => {
          const hour = parseInt(label.split(":")[0], 10);
          return hourMap[hour] !== undefined ? parseFloat(hourMap[hour].toFixed(2)) : 0;
        });
      }

      
      function getPopularTimesForDay(data, day = "saturday") {
        const dayData = data[day.toLowerCase()];
        const labels = dayData.map(d => convertTo24Hour(d.time));
        const values = dayData.map(d => d.busyness_score);
        return { labels, values };
      }

      function renderTrafficChart(labels, popValues, demandValues) {
        const options = {
          chart: {
            type: 'line',
            height: '100%',
            fontFamily: 'Montserrat'
          },
          series: [
            {
              name: 'Avg Demand (kW)',
              type: 'column',
              data: demandValues
            },
            {
              name: 'Popular Times',
              type: 'line',
              data: popValues
            }
          ],
          xaxis: {
            categories: labels,
            grid: {
              borderColor: 'rgba(0,0,0,0.05)'
            }
          },
          yaxis: [
            {
              title: {
                text: 'Avg Demand (kW)'
              },
              seriesName: 'Avg Demand (kW)'
            },
            {
              opposite: true,
              title: {
                text: 'Busyness Score'
              },
              max: 110,
              seriesName: 'Popular Times'
            }
          ],
          colors: ['rgba(26, 115, 232, 0.8)', 'rgba(255, 99, 132, 1)'],
          fill: {
            type: ['solid', 'gradient'],
            gradient: {
              shade: 'light',
              type: 'vertical',
              shadeIntensity: 0.25,
              gradientToColors: undefined,
              inverseColors: true,
              opacityFrom: 0.85,
              opacityTo: 0.55
            }
          },
          legend: {
            position: 'top'
          },
          responsive: [{
            breakpoint: 480,
            options: {
              chart: {
                width: 200
              },
              legend: {
                position: 'bottom'
              }
            }
          }]
        };

        const chart = new ApexCharts(document.querySelector("#popularTimesChart"), options);
        chart.render();
      }

      function renderSunChart(labels, demand, sunElevation, azimuthNotes) {
        const options = {
          chart: {
            type: 'line',
            height: '100%',
            fontFamily: 'Montserrat'
          },
          series: [
            {
              name: 'Energy Demand (kW)',
              data: demand
            },
            {
              name: 'Sun Elevation (°)',
              data: sunElevation
            }
          ],
          xaxis: {
            categories: labels,
            grid: {
              borderColor: 'rgba(0,0,0,0.05)'
            }
          },
          yaxis: [
            {
              title: {
                text: 'kW'
              },
              seriesName: 'Energy Demand (kW)'
            },
            {
              opposite: true,
              title: {
                text: 'Sun Elevation (°)'
              },
              seriesName: 'Sun Elevation (°)'
            }
          ],
          colors: ['#00bcd4', 'orange'],
          fill: {
            type: 'gradient',
            gradient: {
              shade: 'light',
              type: 'vertical',
              shadeIntensity: 0.25,
              gradientToColors: undefined,
              inverseColors: true,
              opacityFrom: 0.85,
              opacityTo: 0.55
            }
          },
          stroke: {
            width: 2,
            curve: 'smooth'
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            custom: function({series, seriesIndex, dataPointIndex, w}) {
              return '<div class="arrow_box">' +
                '<span>' + w.globals.labels[dataPointIndex] + '</span><br>' +
                '<span>' + w.config.series[seriesIndex].name + ': ' + series[seriesIndex][dataPointIndex] + '</span><br>' +
                '<span>Azimuth: ' + azimuthNotes[dataPointIndex] + '°</span>' +
                '</div>';
            }
          }
        };

        const chart = new ApexCharts(document.querySelector("#sunChart"), options);
        chart.render();
      }
      
      initializeDashboard();