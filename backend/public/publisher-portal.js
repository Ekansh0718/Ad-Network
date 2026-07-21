(function () {
  'use strict';

  var loginForm = document.getElementById('loginForm');
  var domainForm = document.getElementById('domainForm');
  var zoneForm = document.getElementById('zoneForm');
  var sessionStatus = document.getElementById('sessionStatus');
  var domainStatus = document.getElementById('domainStatus');
  var zoneStatus = document.getElementById('zoneStatus');
  var snippet = document.getElementById('snippet');
  var copySnippet = document.getElementById('copySnippet');

  function formJson(form) {
    var data = new FormData(form);
    var value = {};

    data.forEach(function (fieldValue, key) {
      value[key] = fieldValue;
    });

    return value;
  }

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

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    sessionStatus.textContent = 'Signing in...';

    request('/api/v1/auth/login', {
      method: 'POST',
      body: formJson(loginForm),
    })
      .then(function (payload) {
        sessionStatus.textContent = payload.user.email + ' signed in as ' + payload.user.role;
      })
      .catch(function (error) {
        sessionStatus.textContent = error.message;
      });
  });

  domainForm.addEventListener('submit', function (event) {
    event.preventDefault();
    domainStatus.textContent = 'Checking ads.txt...';

    request('/api/v1/publisher/domains/validate', {
      method: 'POST',
      body: formJson(domainForm),
    })
      .then(function (payload) {
        domainStatus.textContent = payload.domain + ' verified';
      })
      .catch(function (error) {
        domainStatus.textContent = error.message;
      });
  });

  zoneForm.addEventListener('submit', function (event) {
    event.preventDefault();
    zoneStatus.textContent = 'Saving placement...';
    var body = formJson(zoneForm);
    body.width = Number(body.width);
    body.height = Number(body.height);

    request('/api/v1/publisher/ad-zones', {
      method: 'POST',
      body: body,
    })
      .then(function (payload) {
        snippet.value = payload.snippet;
        copySnippet.disabled = false;
        zoneStatus.textContent = 'Zone ' + payload.zone.id + ' is ready';
      })
      .catch(function (error) {
        zoneStatus.textContent = error.message;
      });
  });

  copySnippet.addEventListener('click', function () {
    navigator.clipboard.writeText(snippet.value);
  });
})();
