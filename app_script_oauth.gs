function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Update Aggregation')
    .addItem('Authorize', 'showOAuthUrl')
    .addItem('Clear Authorization', 'resetOAuth')
    .addSeparator()
    .addItem('Update', 'update')
    .addToUi();
}

function getMapService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return OAuth2.createService('mapengine')

      // Set the endpoint URLs, which are the same for all Google services.
      .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
      .setTokenUrl('https://accounts.google.com/o/oauth2/token')

      // Set the client ID and secret, from the Google Developers Console.
      .setClientId('490275540058-5tfnelcd56uglv20p65ot2qrjbhbhmcm.apps.googleusercontent.com')
      .setClientSecret('OzKAzW3dAFzblUEmrK-a8ULQ')

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request (space-separated for Google services).
      .setScope('https://www.googleapis.com/auth/mapsengine.readonly')

      // Below are Google-specific OAuth2 parameters.

      // Sets the login hint, which will prevent the account chooser screen
      // from being shown to users logged in with multiple accounts.
      .setParam('login_hint', Session.getActiveUser().getEmail())

      // Forces the approval prompt every time. This is useful for testing,
      // but not desirable in a production application.
      .setParam('approval_prompt', 'force');
}

function showOAuthUrl() {
  // Show the OAuthUrl as a sidebar. The OAuthUrl takes the user
  // to Google Authorization Server, which prompt the user to grant
  // this script access to his Maps. After the user grants the permission,
  // an access token will be returned through the authCallBack function.
  var mapService = getMapService();
  var page;
  if (!mapService.hasAccess()) {
    var authorizationUrl = mapService.getAuthorizationUrl();
    var template = HtmlService.createTemplate(
        'Click this ' +
        '<a href="<?= authorizationUrl ?>" target="_blank">link</a> ' +
        'to grant permission to the Poverty Data Aggregation Automated Script ' +
        'to get data from your Google Maps');
    template.authorizationUrl = authorizationUrl;
    page = template.evaluate();
    SpreadsheetApp.getUi().showSidebar(page);
  } else {
    var html = 'Access to Map is granted.';
    page = HtmlService.createHtmlOutput(html);
    SpreadsheetApp.getUi().showSidebar(page);
  }
}

function authCallback(request) {
  // Callback from the Google Authorization Server
  var mapService = getMapService();
  var isAuthorized = mapService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}

function resetOAuth() {
  OAuth2.createService('mapengine')
  .setPropertyStore(PropertiesService.getUserProperties())
  .reset();
  SpreadsheetApp.getUi().alert('OAuth Access cleared');
}

function update() {
  var mapService = getMapService();
  var response = UrlFetchApp.fetch('https://www.google.com/maps/d/kml?mid=zcAh7vf-hAK4.kiC3wtt-xHJw', {
    headers: {
      Authorization: 'Bearer ' + mapService.getAccessToken()
    }
  });
  Logger.log(response.getResponseCode());
  Logger.log(response.getResponseText());
  Logger.log(response.getContent());
}
