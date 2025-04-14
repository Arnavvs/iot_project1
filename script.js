const channelID = 2454679;
const readAPIKey = "0UN888059PJ9KW30";

let minPH = null;
let maxPH = null;
let email = "";

const ctx = document.getElementById("phChart").getContext("2d");
const phChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'pH Level',
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      data: [],
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 5,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'HH:mm',
          unit: 'minute',
          displayFormats: { minute: 'HH:mm' }
        },
        title: {
          display: true,
          text: 'Time',
          color: '#fff'
        },
        ticks: {
          color: '#ccc',
          maxRotation: 0,
          autoSkip: true
        }
      },
      y: {
        title: {
          display: true,
          text: 'pH Level',
          color: '#fff'
        },
        min: 0,
        max: 14,
        ticks: {
          color: '#ccc'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff'
        }
      }
    }
  }
});

async function fetchData() {
  const url = `https://api.thingspeak.com/channels/${channelID}/fields/1.json?api_key=${readAPIKey}&results=8000`;
  const response = await fetch(url);
  const data = await response.json();
  const feeds = data.feeds;

  const selectedDate = document.getElementById("datePicker").value;
  const filteredFeeds = selectedDate
    ? feeds.filter(feed => feed.created_at.startsWith(selectedDate))
    : feeds;

  const times = filteredFeeds.map(feed => feed.created_at);
  const values = filteredFeeds.map(feed => parseFloat(feed.field1));

  phChart.data.labels = times;
  phChart.data.datasets[0].data = values;
  phChart.update();

  updateTable(filteredFeeds);

  const latestPH = parseFloat(feeds[feeds.length - 1]?.field1);
  if (minPH !== null && maxPH !== null && email !== "") {
    if (latestPH < minPH || latestPH > maxPH) {
      sendEmailAlert(latestPH);
    }
  }
}

function updateTable(feeds) {
  const tableBody = document.querySelector("#dataTable tbody");
  tableBody.innerHTML = "";
  feeds.forEach(feed => {
    const row = `<tr><td>${feed.created_at}</td><td>${feed.field1}</td></tr>`;
    tableBody.innerHTML += row;
  });
}

function setAlertTrigger() {
  minPH = parseFloat(document.getElementById("minPH").value);
  maxPH = parseFloat(document.getElementById("maxPH").value);
  email = document.getElementById("userEmail").value;

  alert("Alert trigger set!");
}

function sendEmailAlert(value) {
    emailjs.send("service_ji1xqko", "template_mu4z8lm", {
      to_email: email,
      ph_value: value,
      min: minPH,
      max: maxPH
    })
    .then(() => {
      console.log("Email alert sent successfully!");
      alert("Email alert sent to " + email);
    }, (error) => {
      console.error("Email sending failed:", error);
      alert("Failed to send email.");
    });
  }
  

// CSV Download
document.getElementById("downloadBtn").addEventListener("click", () => {
  const rows = [["Timestamp", "pH Value"]];
  const tableRows = document.querySelectorAll("#dataTable tbody tr");
  tableRows.forEach(row => {
    const cols = row.querySelectorAll("td");
    rows.push([cols[0].innerText, cols[1].innerText]);
  });

  let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "ph_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

document.getElementById("datePicker").addEventListener("change", fetchData);

setInterval(fetchData, 15000);
fetchData();
