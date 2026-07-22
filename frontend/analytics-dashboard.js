(function () {
  'use strict';

  var loginForm = document.getElementById('loginForm');
  var sessionStatus = document.getElementById('sessionStatus');
  var startDate = document.getElementById('startDate');
  var endDate = document.getElementById('endDate');
  var refreshMetrics = document.getElementById('refreshMetrics');
  var dashboardStatus = document.getElementById('dashboardStatus');
  var metricsRows = document.getElementById('metricsRows');
  var canvas = document.getElementById('metricsChart');
  var chartInstance = null;

  function today(offsetDays) {
    var date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().slice(0, 10);
  }

  startDate.value = today(-7);
  endDate.value = today(0);

  function request(path, options) {
    return fetch(path, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then(function (response) {
      return response.json().then(function (payload) {
        if (!response.ok) {
          throw new Error(payload.message || response.statusText);
        }
        return payload;
      });
    });
  }

  function money(value) {
    return '$' + Number(value || 0).toFixed(2);
  }

  function renderTotals(totals) {
    document.getElementById('totalImpressions').textContent = String(totals.impressions || 0);
    document.getElementById('totalClicks').textContent = String(totals.clicks || 0);
    document.getElementById('totalCtr').textContent = Number(totals.ctr || 0).toFixed(2) + '%';
    document.getElementById('totalSpend').textContent = money(totals.spend);
    document.getElementById('totalPayout').textContent = money(totals.payout);
  }

  function renderTable(rows) {
    metricsRows.innerHTML = rows
      .map(function (row) {
        return (
          '<tr>' +
          '<td>' + row.date + '</td>' +
          '<td>' + row.impressions + '</td>' +
          '<td>' + row.clicks + '</td>' +
          '<td>' + Number(row.ctr || 0).toFixed(2) + '%</td>' +
          '<td>' + money(row.spend) + '</td>' +
          '<td>' + money(row.payout) + '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function renderChart(rows) {
    var data = {
      labels: rows.map(function (row) { return row.date; }),
      datasets: [
        {
          label: 'Impressions',
          data: rows.map(function (row) { return row.impressions; }),
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15, 118, 110, 0.15)',
          yAxisID: 'y',
          tension: 0.25,
        },
        {
          label: 'Clicks',
          data: rows.map(function (row) { return row.clicks; }),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          yAxisID: 'y',
          tension: 0.25,
        },
        {
          label: 'CTR %',
          data: rows.map(function (row) { return Number(row.ctr || 0); }),
          borderColor: '#d97706',
          backgroundColor: 'rgba(217, 119, 6, 0.15)',
          yAxisID: 'y1',
          tension: 0.25,
        },
        {
          label: 'Payout ($)',
          data: rows.map(function (row) { return Number(row.payout || 0); }),
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
          yAxisID: 'y1',
          tension: 0.25,
        },
      ],
    };

    var options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: { display: true, text: 'Impressions / Clicks' },
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'CTR % / Payout $' },
        },
      },
    };

    if (chartInstance) {
      chartInstance.data = data;
      chartInstance.options = options;
      chartInstance.update();
      return;
    }

    chartInstance = new Chart(canvas, {
      type: 'line',
      data: data,
      options: options,
    });
  }

  function loadMetrics() {
    dashboardStatus.textContent = 'Loading metrics...';
    request(
      '/api/v1/analytics/daily?startDate=' +
        encodeURIComponent(startDate.value) +
        '&endDate=' +
        encodeURIComponent(endDate.value),
      {}
    )
      .then(function (payload) {
        renderTotals(payload.totals);
        renderTable(payload.rows);
        renderChart(payload.rows);
        dashboardStatus.textContent = payload.rows.length + ' daily rows loaded';
      })
      .catch(function (error) {
        dashboardStatus.textContent = error.message;
      });
  }

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    sessionStatus.textContent = 'Signing in...';
    request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: new FormData(loginForm).get('email'),
        password: new FormData(loginForm).get('password'),
      },
    })
      .then(function (payload) {
        sessionStatus.textContent = payload.user.email + ' signed in as ' + payload.user.role;
      })
      .catch(function (error) {
        sessionStatus.textContent = error.message;
      });
  });

  refreshMetrics.addEventListener('click', loadMetrics);
  loadMetrics();
})();
