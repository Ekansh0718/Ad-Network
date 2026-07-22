(function () {
  'use strict';

  var currentStep = 1;
  var totalSteps = 3;
  var loginForm = document.getElementById('loginForm');
  var campaignForm = document.getElementById('campaignForm');
  var prevStep = document.getElementById('prevStep');
  var nextStep = document.getElementById('nextStep');
  var submitCampaign = document.getElementById('submitCampaign');
  var campaignStatus = document.getElementById('campaignStatus');
  var sessionStatus = document.getElementById('sessionStatus');

  function formJson(form) {
    var data = new FormData(form);
    var body = {};

    body.campaignName = data.get('campaignName');
    body.totalBudget = Number(data.get('totalBudget'));
    body.dailyBudget = Number(data.get('dailyBudget'));
    body.maxCpc = Number(data.get('maxCpc'));
    body.targetCountries = data.getAll('targetCountries');
    body.targetDevices = data.getAll('targetDevices');
    body.creativeType = data.get('creativeType');
    body.creativeUrl = data.get('creativeUrl') || undefined;
    body.creativeHtml = data.get('creativeHtml') || undefined;

    return body;
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

  function renderStep() {
    document.querySelectorAll('.step-panel').forEach(function (panel) {
      panel.hidden = Number(panel.getAttribute('data-step')) !== currentStep;
    });

    document.querySelectorAll('.steps span').forEach(function (step, index) {
      step.classList.toggle('active', index + 1 === currentStep);
    });

    prevStep.disabled = currentStep === 1;
    nextStep.hidden = currentStep === totalSteps;
    submitCampaign.hidden = currentStep !== totalSteps;
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

  prevStep.addEventListener('click', function () {
    currentStep = Math.max(1, currentStep - 1);
    renderStep();
  });

  nextStep.addEventListener('click', function () {
    currentStep = Math.min(totalSteps, currentStep + 1);
    renderStep();
  });

  campaignForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var body = formJson(campaignForm);

    if (body.dailyBudget > body.totalBudget) {
      campaignStatus.textContent = 'Daily budget cannot exceed total budget';
      return;
    }

    campaignStatus.textContent = 'Submitting campaign...';

    request('/api/v1/advertiser/campaigns', {
      method: 'POST',
      body: body,
    })
      .then(function (payload) {
        campaignStatus.textContent =
          payload.campaign.campaignName + ' submitted as ' + payload.campaign.status;
      })
      .catch(function (error) {
        campaignStatus.textContent = error.message;
      });
  });

  renderStep();
})();
